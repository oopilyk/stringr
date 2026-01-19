/**
 * Request Cancellation Endpoint
 *
 * Security Features:
 * - Rate limiting: 30 requests per minute (mutation limit)
 * - Input validation: Zod schema validation with strict mode
 * - Authentication: Supabase auth required
 * - Authorization: Player or stringer verification
 * - Financial protection: Secure refund processing
 * - Audit logging: State change tracking
 *
 * OWASP Protections:
 * - API4:2023 Unrestricted Resource Consumption (rate limiting)
 * - API8:2023 Security Misconfiguration (strict validation)
 * - API1:2023 Broken Object Level Authorization (dual ownership check)
 * - API2:2023 Broken Authentication (Supabase auth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { cancelPaymentIntent } from '@/lib/stripe/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { validateData, CancelRequestSchema, RequestIdParamSchema } from '@/lib/validation/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION - Verify user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING - Prevent cancellation spam
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

    // 4. INPUT VALIDATION - Validate request body
    const body = await request.json()
    const validation = validateData(CancelRequestSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { reason, cancellation_reason } = validation.data

    // 5. AUTHORIZATION - Get request and verify ownership
    // Select only necessary fields to minimize data exposure
    const { data: req, error: fetchError } = await supabase
      .from('requests')
      .select('id, player_id, stringer_id, status, payment_intent_id, payment_captured_at')
      .eq('id', params.id)
      .single()

    if (fetchError || !req) {
      // Non-leaky error - don't reveal if request exists
      return NextResponse.json(
        { error: 'Request not found or access denied' },
        { status: 404 }
      )
    }

    // 6. AUTHORIZATION CHECK - Verify user is player OR stringer
    // CRITICAL: Allows either party to cancel
    if (req.player_id !== user.id && req.stringer_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // 7. STATE VALIDATION - Check if request can be cancelled
    const cancellableStatuses = ['pending', 'accepted', 'in_progress']
    if (!cancellableStatuses.includes(req.status)) {
      return NextResponse.json(
        { error: 'Request cannot be cancelled in current status' },
        { status: 400 }
      )
    }

    let refundResult = null

    // 8. FINANCIAL PROCESSING - Handle payment cancellation/refund
    if (req.payment_intent_id) {
      try {
        // If payment was captured, create a refund
        if (req.payment_captured_at) {
          const { createRefund } = await import('@/lib/stripe/server')
          refundResult = await createRefund(
            req.payment_intent_id,
            undefined, // Full refund
            cancellation_reason || 'requested_by_customer'
          )
        } else {
          // Payment was only authorized, cancel the hold
          await cancelPaymentIntent(
            req.payment_intent_id,
            cancellation_reason || 'requested_by_customer'
          )
        }
      } catch (paymentError: any) {
        // Sanitize Stripe errors - don't leak sensitive payment info
        console.error('Payment cancellation error:', paymentError)
        return NextResponse.json(
          { error: 'Failed to process payment cancellation' },
          { status: 500 }
        )
      }
    }

    // 9. DATABASE UPDATE - Mark request as cancelled
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || cancellation_reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      // Don't leak database errors
      return NextResponse.json(
        { error: 'Failed to cancel request' },
        { status: 500 }
      )
    }

    // 10. AUDIT LOGGING - Record cancellation
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: req.status,
        to_status: 'cancelled',
        changed_by: user.id,
        metadata: {
          reason: reason,
          refunded: !!req.payment_intent_id,
          refund_id: refundResult?.id
        }
      })

    // 11. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      message: 'Request cancelled successfully',
      refunded: !!req.payment_intent_id,
      refund_id: refundResult?.id
    })

  } catch (error: any) {
    // Global error handler - sanitize all errors
    console.error('Request cancellation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
