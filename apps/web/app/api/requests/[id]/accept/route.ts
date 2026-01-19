import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { validateData, AcceptRequestSchema, RequestIdParamSchema } from '@/lib/validation/schemas'

/**
 * POST /api/requests/[id]/accept - Stringer accepts a request with final quote
 *
 * SECURITY:
 * - Rate limited to 30 req/min (prevents abuse)
 * - UUID validation on path parameters
 * - Strict input validation with Zod schema
 * - Authorization: only assigned stringer can accept
 * - State validation: only 'pending' requests can be accepted
 * - Price validation: final price must be at least $1
 * - Database error sanitization
 * - Audit logging for state changes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

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

    // 4. INPUT VALIDATION - Validate request body
    const body = await request.json()
    const validation = validateData(AcceptRequestSchema, body)
    if (!validation.success) {
      console.error('[Accept Request] Validation failed:', validation.error)
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const {
      estimated_completion,
      accept_message,
      confirmed_string_brand,
      confirmed_string_model,
      confirmed_tension_mains_lbs,
      confirmed_tension_crosses_lbs,
      string_issue_notes,
      racket_count,
      final_price_cents
    } = validation.data

    // 5. AUTHORIZATION - Get request and verify ownership
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, stringer_id, status, string_selection, tension_mains_lbs, tension_crosses_lbs')
      .eq('id', params.id)
      .eq('stringer_id', user.id)
      .single()

    if (reqError || !req) {
      console.error('[Accept Request] Request not found or unauthorized:', params.id)
      // SECURITY: Non-leaky error - don't reveal if request exists
      return NextResponse.json(
        { error: 'Request not found or access denied' },
        { status: 404 }
      )
    }

    // 6. STATE VALIDATION - Only pending requests can be accepted
    if (req.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot accept request in '${req.status}' status. Only pending requests can be accepted.` },
        { status: 400 }
      )
    }

    // 7. DATABASE UPDATE - Accept request with confirmed details and final price
    // NOTE: Status stays as 'accepted' until player authorizes payment
    // Payment authorization will transition to 'in_progress'
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        estimated_completion: estimated_completion || null,
        confirmed_string_brand: confirmed_string_brand || req.string_selection?.brand,
        confirmed_string_model: confirmed_string_model || req.string_selection?.model,
        confirmed_tension_mains_lbs: confirmed_tension_mains_lbs || req.tension_mains_lbs,
        confirmed_tension_crosses_lbs: confirmed_tension_crosses_lbs || req.tension_crosses_lbs,
        string_issue_notes: string_issue_notes || null,
        racket_count: racket_count || 1,
        final_price_cents: final_price_cents
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('[Accept Request] Database update failed:', updateError.message)
      // SECURITY: Don't expose database details
      return NextResponse.json(
        { error: 'Failed to accept request. Please try again.' },
        { status: 500 }
      )
    }

    // DO NOT initialize tasks yet - wait for payment authorization
    // Tasks will be created when payment is authorized in /authorize-payment endpoint

    // 8. AUDIT LOGGING - Record state change
    const { error: auditError } = await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'pending',
        to_status: 'accepted',
        changed_by: user.id,
        metadata: accept_message ? { message: accept_message, final_price_cents } : { final_price_cents }
      })

    if (auditError) {
      console.error('[Accept Request] Audit log failed:', auditError.message)
      // Don't fail the request, just log the error
    }

    // 9. SUCCESS RESPONSE
    console.log(`[Accept Request] Success: ${params.id} by stringer ${user.id}, price: $${final_price_cents / 100}`)
    return NextResponse.json({
      success: true,
      message: 'Request accepted successfully'
    })

  } catch (error: any) {
    // SECURITY: Global error handler - sanitize all errors
    console.error('[Accept Request] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
