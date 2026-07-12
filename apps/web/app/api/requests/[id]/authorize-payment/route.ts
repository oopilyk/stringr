/**
 * Payment Authorization Endpoint
 *
 * Security Features:
 * - Rate limiting: 5 requests per minute (prevents payment spam)
 * - Input validation: Zod schema validation
 * - Authentication: Supabase auth required
 * - Authorization: Player-only access verification
 * - Idempotency: Prevents duplicate payment authorization
 * - Error handling: Non-leaky error messages
 *
 * OWASP Protections:
 * - API4:2023 Unrestricted Resource Consumption (rate limiting)
 * - API8:2023 Security Misconfiguration (strict validation)
 * - API1:2023 Broken Object Level Authorization (owner check)
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { authorizePayment } from '@/lib/stripe/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'
import { validateData, AuthorizePaymentSchema, RequestIdParamSchema } from '@/lib/validation/schemas'

// POST /api/requests/[id]/authorize-payment - Player authorizes payment for accepted quote
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

    // 2. RATE LIMITING - Prevent payment spam (5 req/min per user)
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.PAYMENT, user.id)
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
    const validation = validateData(AuthorizePaymentSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      )
    }

    const { payment_method_id, cardholder_name } = validation.data

    // 5. AUTHORIZATION - Get request and verify ownership
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, player_id, stringer_id, status, final_price_cents, payment_intent_id, payment_authorized_at')
      .eq('id', params.id)
      .eq('player_id', user.id) // CRITICAL: Ensure player owns this request
      .single()

    if (reqError || !req) {
      // Non-leaky error message - don't reveal if request exists
      return NextResponse.json(
        { error: 'Request not found or access denied' },
        { status: 404 }
      )
    }

    // 6. STATE VALIDATION - Check request is in correct status
    if (req.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Payment can only be authorized for accepted requests' },
        { status: 400 }
      )
    }

    // 7. BUSINESS LOGIC VALIDATION - Verify price exists
    if (!req.final_price_cents || req.final_price_cents < 100) {
      return NextResponse.json(
        { error: 'Invalid request price' },
        { status: 400 }
      )
    }

    // 8. IDEMPOTENCY CHECK - Prevent duplicate authorization
    if (req.payment_intent_id && req.payment_authorized_at) {
      return NextResponse.json(
        {
          error: 'Payment already authorized',
          payment_intent_id: req.payment_intent_id
        },
        { status: 409 } // Conflict
      )
    }

    // 9. STRINGER VERIFICATION - Get stringer's Stripe account
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('stripe_account_id, stripe_onboarding_completed, stripe_charges_enabled')
      .eq('id', req.stringer_id)
      .single()

    if (stringerError || !stringerSettings?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Stringer payment account not configured' },
        { status: 400 }
      )
    }

    // 10. STRIPE VERIFICATION - Ensure stringer completed onboarding
    if (!stringerSettings.stripe_onboarding_completed || !stringerSettings.stripe_charges_enabled) {
      return NextResponse.json(
        { error: 'Stringer cannot receive payments yet' },
        { status: 400 }
      )
    }

    // 11. PAYMENT AUTHORIZATION - Create Stripe PaymentIntent
    // This is a Stripe API call - errors are caught and sanitized
    // Note: final_price_cents is the stringer's listed price, player pays this + app tax
    let paymentResult
    try {
      paymentResult = await authorizePayment({
        stringer_price_cents: req.final_price_cents,
        player_id: user.id,
        stringer_account_id: stringerSettings.stripe_account_id,
        request_id: params.id,
        payment_method_id: payment_method_id,
        cardholder_name: cardholder_name,
        description: 'Stringerly - Racket Stringing Service'
      })
    } catch (stripeError: any) {
      // Sanitize Stripe errors - don't leak sensitive info
      console.error('Stripe authorization error:', stripeError)
      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 500 }
      )
    }

    // 12. DATABASE UPDATE - Use RPC to bypass RLS and ensure atomic update
    const { data: authResult, error: dbError } = await supabase
      .rpc('authorize_request_payment', {
        p_request_id: params.id,
        p_player_id: user.id,
        p_payment_intent_id: paymentResult.payment_intent_id,
        p_platform_fee_cents: paymentResult.platform_fee_cents,
        p_stringer_earnings_cents: paymentResult.stringer_earnings_cents
      })

    if (dbError) {
      console.error('Database authorization error:', dbError)
      // Don't leak database errors to client
      return NextResponse.json(
        { error: 'Failed to save payment authorization' },
        { status: 500 }
      )
    }

    // 13. AUDIT LOGGING - Record payment authorization (status stays 'accepted')
    // Tasks will be created when stringer starts work
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'accepted',
        to_status: 'accepted', // Status stays accepted until stringer starts work
        changed_by: user.id,
        metadata: {
          payment_authorized: true,
          payment_intent_id: paymentResult.payment_intent_id
        }
      })

    // 15. SUCCESS RESPONSE - Return sanitized payment info
    return NextResponse.json({
      success: true,
      payment_intent_id: paymentResult.payment_intent_id,
      // Stringer's listed price
      stringer_price_cents: paymentResult.stringer_price_cents,
      // What player actually pays (stringer price + app tax)
      player_total_cents: paymentResult.player_total_cents,
      // What stringer receives (their price - fee)
      stringer_earnings_cents: paymentResult.stringer_earnings_cents,
      // Platform revenue breakdown
      platform_fee_cents: paymentResult.platform_fee_cents,
      stringer_fee_cents: paymentResult.stringer_fee_cents,
      player_app_tax_cents: paymentResult.player_app_tax_cents
    })

  } catch (error: any) {
    // Global error handler - sanitize all errors
    console.error('Payment authorization error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
