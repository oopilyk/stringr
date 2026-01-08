import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { authorizePayment } from '@/lib/stripe/server'

// POST /api/requests/[id]/authorize-payment - Player authorizes payment for accepted quote
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payment_method_id } = await request.json()

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
    }

    // Get the request
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', params.id)
      .eq('player_id', user.id)
      .single()

    console.log('Request lookup:', { req, reqError, userId: user.id, requestId: params.id })

    if (reqError || !req) {
      console.error('Request query error:', reqError)
      return NextResponse.json({
        error: 'Request not found or cannot be paid',
        details: reqError?.message
      }, { status: 404 })
    }

    // Check status separately for better error message
    if (req.status !== 'accepted') {
      console.error('Request status error:', { currentStatus: req.status, expected: 'accepted' })
      return NextResponse.json({
        error: `Request cannot be paid in ${req.status} status`,
        details: 'Request must be in accepted status'
      }, { status: 400 })
    }

    if (!req.final_price_cents) {
      return NextResponse.json({ error: 'No final price set for this request' }, { status: 400 })
    }

    // Get stringer's Stripe account ID from stringer_settings
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('stripe_account_id, stripe_onboarding_completed, stripe_charges_enabled')
      .eq('id', req.stringer_id)
      .single()

    console.log('Stringer settings lookup:', { stringerSettings, stringerError, stringerId: req.stringer_id })

    if (stringerError || !stringerSettings?.stripe_account_id) {
      console.error('Stringer settings error:', stringerError)
      return NextResponse.json({
        error: 'Stringer has not connected their bank account yet',
        details: stringerError?.message
      }, { status: 400 })
    }

    // Verify stringer has completed onboarding
    if (!stringerSettings.stripe_onboarding_completed || !stringerSettings.stripe_charges_enabled) {
      return NextResponse.json({
        error: 'Stringer has not completed Stripe onboarding'
      }, { status: 400 })
    }

    // Check if payment already authorized
    if (req.payment_intent_id && req.payment_authorized_at) {
      return NextResponse.json({
        error: 'Payment already authorized for this request',
        payment_intent_id: req.payment_intent_id
      }, { status: 400 })
    }

    // Authorize payment (create PaymentIntent with manual capture)
    console.log('Authorizing payment:', {
      amount_cents: req.final_price_cents,
      stringer_account_id: stringerSettings.stripe_account_id,
      request_id: params.id
    })

    const paymentResult = await authorizePayment({
      amount_cents: req.final_price_cents,
      player_id: user.id,
      stringer_account_id: stringerSettings.stripe_account_id,
      request_id: params.id,
      payment_method_id: payment_method_id,
      description: `Stringing service for request #${params.id.slice(0, 8)}`
    })

    console.log('Payment authorized:', paymentResult)

    // Use database function to update request (bypasses RLS)
    const { data: authResult, error: dbError } = await supabase
      .rpc('authorize_request_payment', {
        p_request_id: params.id,
        p_player_id: user.id,
        p_payment_intent_id: paymentResult.payment_intent_id,
        p_platform_fee_cents: paymentResult.platform_fee_cents,
        p_stringer_earnings_cents: paymentResult.stringer_earnings_cents
      })

    console.log('Authorization result:', { authResult, dbError })

    if (dbError) {
      console.error('Error authorizing payment in database:', dbError)
      return NextResponse.json({
        error: 'Failed to save payment information',
        details: dbError.message,
        code: dbError.code
      }, { status: 500 })
    }

    // Initialize stringing tasks now that payment is authorized
    const { error: tasksError } = await supabase
      .rpc('initialize_stringing_tasks', { p_request_id: params.id })

    if (tasksError) {
      console.error('Error initializing tasks:', tasksError)
      // Fallback: create tasks manually
      const taskTypes = [
        'receive_racket',
        'remove_strings',
        'inspect_frame',
        'mount_racket',
        'string_mains',
        'string_crosses',
        'tie_off',
        'final_inspection',
        'completion_photo'
      ]

      for (let i = 0; i < taskTypes.length; i++) {
        try {
          await supabase
            .from('stringing_tasks')
            .insert({
              request_id: params.id,
              task_type: taskTypes[i],
              status: 'pending',
              task_order: i + 1,
              is_required: !['inspect_frame', 'completion_photo'].includes(taskTypes[i])
            })
        } catch (error) {
          // Ignore errors - tasks might already exist
        }
      }
    }

    // Log state transition
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'accepted',
        to_status: 'in_progress',
        changed_by: user.id,
        metadata: {
          payment_authorized: true,
          payment_intent_id: paymentResult.payment_intent_id
        }
      })

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentResult.payment_intent_id,
      amount_cents: req.final_price_cents,
      platform_fee_cents: paymentResult.platform_fee_cents,
      stringer_earnings_cents: paymentResult.stringer_earnings_cents
    })
  } catch (error: any) {
    console.error('Payment authorization error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to authorize payment'
    }, { status: 500 })
  }
}
