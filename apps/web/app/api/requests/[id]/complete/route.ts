import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { capturePayment } from '@/lib/stripe/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { validateData, RequestIdParamSchema } from '@/lib/validation/schemas'

/**
 * POST /api/requests/[id]/complete - Player confirms pickup and completes request
 *
 * SECURITY:
 * - Rate limited to 30 req/min (prevents abuse)
 * - UUID validation on path parameters
 * - Authentication required (players only)
 * - Authorization: only the player who created the request can complete it
 * - State validation: only 'ready_for_pickup' requests can be completed
 * - Idempotency: already completed requests return success without error
 * - Payment capture with error handling
 * - Database error sanitization
 * - Audit logging for state changes
 * - Service role key usage justified (see NOTE below)
 *
 * NOTE: This endpoint uses SUPABASE_SERVICE_ROLE_KEY intentionally to:
 * 1. Bypass RLS when updating request status to 'completed'
 * 2. Update stringer earnings (RLS prevents players from updating stringer_settings)
 * 3. Insert audit logs (requires elevated permissions)
 * This is safe because:
 * - Player ownership is verified BEFORE using service role
 * - Only updates specific fields, not arbitrary data
 * - All operations are audited
 * Key rotation: See SECURITY.md for rotation procedures
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Create service role client for bypassing RLS on sensitive operations
    // SECURITY: Service role key is intentional and justified (see NOTE in header)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. AUTHENTICATION - Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING - Prevent abuse (30 req/min)
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.MUTATION, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. INPUT VALIDATION - Validate path parameters
    const paramsValidation = validateData(RequestIdParamSchema, params)
    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      )
    }

    // 4. AUTHORIZATION - Verify user is the player and get request details
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('player_id, stringer_id, status, final_price_cents, tip_cents, payment_intent_id, payment_captured_at')
      .eq('id', params.id)
      .eq('player_id', user.id)
      .single()

    if (reqError || !req) {
      console.error('[Complete Request] Request not found or unauthorized:', params.id)
      // SECURITY: Non-leaky error - don't reveal if request exists
      return NextResponse.json(
        { error: 'Request not found or access denied' },
        { status: 404 }
      )
    }

    // 5. IDEMPOTENCY CHECK - If already completed, return success
    if (req.status === 'completed') {
      console.log(`[Complete Request] Already completed: ${params.id}`)
      return NextResponse.json({
        success: true,
        message: 'Request already completed',
        alreadyCompleted: true
      })
    }

    // 6. STATE VALIDATION - Only ready_for_pickup requests can be completed
    if (req.status !== 'ready_for_pickup') {
      return NextResponse.json(
        { error: `Cannot complete request in '${req.status}' status. Request must be ready for pickup.` },
        { status: 400 }
      )
    }

    // 7. PAYMENT CAPTURE - Capture payment if authorized but not yet captured
    if (req.payment_intent_id && !req.payment_captured_at) {
      try {
        console.log(`[Complete Request] Capturing payment: ${req.payment_intent_id}`)
        await capturePayment(req.payment_intent_id)
        console.log('[Complete Request] Payment captured successfully')
      } catch (paymentError: any) {
        console.error('[Complete Request] Payment capture failed:', paymentError.message)
        // SECURITY: Don't expose Stripe error details
        return NextResponse.json({
          error: 'Failed to process payment. Please contact support.',
          code: 'payment_capture_failed'
        }, { status: 500 })
      }
    }

    // 8. DATABASE UPDATE - Update request to completed using admin client
    // NOTE: Using admin client to bypass RLS (justified in header comment)
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('requests')
      .update({
        status: 'completed',
        completed_at: now,
        payment_captured_at: req.payment_intent_id && !req.payment_captured_at ? now : req.payment_captured_at
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[Complete Request] Database update failed:', updateError.message)
      // SECURITY: Don't expose database details
      return NextResponse.json(
        { error: 'Failed to complete request. Please try again.' },
        { status: 500 }
      )
    }

    // 9. UPDATE EARNINGS - Increment stringer's total earnings
    const totalEarnings = (req.final_price_cents || 0) + (req.tip_cents || 0)

    if (totalEarnings > 0) {
      const { error: earningsError } = await supabaseAdmin.rpc('increment_stringer_earnings', {
        p_stringer_id: req.stringer_id,
        p_amount_cents: totalEarnings
      })

      if (earningsError) {
        console.error('[Complete Request] Earnings update failed:', earningsError.message)
        // Don't fail the request completion, just log the error
        // The request is still marked complete, earnings can be reconciled later
      } else {
        console.log(`[Complete Request] Earnings updated: +$${totalEarnings / 100} for stringer ${req.stringer_id}`)
      }
    }

    // 10. AUDIT LOGGING - Record state change
    const { error: auditError } = await supabaseAdmin
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'ready_for_pickup',
        to_status: 'completed',
        changed_by: user.id,
        metadata: {
          total_earnings: totalEarnings,
          payment_captured: !!req.payment_intent_id
        }
      })

    if (auditError) {
      console.error('[Complete Request] Audit log failed:', auditError.message)
      // Don't fail the request, just log the error
    }

    // 11. SUCCESS RESPONSE
    console.log(`[Complete Request] Success: ${params.id} by player ${user.id}, earnings: $${totalEarnings / 100}`)
    return NextResponse.json({
      success: true,
      message: 'Request completed successfully'
    })

  } catch (error: any) {
    // SECURITY: Global error handler - sanitize all errors
    console.error('[Complete Request] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
