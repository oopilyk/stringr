import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createPaymentIntent, calculatePaymentBreakdown } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID required' }, { status: 400 })
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the request details
    const { data: jobRequest, error: requestError } = await supabase
      .from('requests')
      .select('*, stringer:stringer_id(*)')
      .eq('id', requestId)
      .single()

    if (requestError || !jobRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify this is the player's request
    if (jobRequest.player_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request has been accepted
    if (jobRequest.status !== 'accepted') {
      return NextResponse.json({ error: 'Request must be accepted first' }, { status: 400 })
    }

    // Check if payment already authorized
    if (jobRequest.payment_intent_id) {
      return NextResponse.json({
        error: 'Payment already authorized',
        paymentIntentId: jobRequest.payment_intent_id
      }, { status: 400 })
    }

    // Get stringer's Stripe account
    const { data: stringerSettings } = await supabase
      .from('stringer_settings')
      .select('stripe_account_id, stripe_charges_enabled')
      .eq('id', jobRequest.stringer_id)
      .single()

    if (!stringerSettings?.stripe_account_id) {
      return NextResponse.json({
        error: 'Stringer has not connected their bank account'
      }, { status: 400 })
    }

    if (!stringerSettings.stripe_charges_enabled) {
      return NextResponse.json({
        error: 'Stringer payment setup is incomplete'
      }, { status: 400 })
    }

    // Calculate payment breakdown
    const quotedPrice = jobRequest.quoted_price_cents || 0
    if (quotedPrice === 0) {
      return NextResponse.json({ error: 'No price quoted for this job' }, { status: 400 })
    }

    const breakdown = calculatePaymentBreakdown(quotedPrice)

    // Create payment intent (authorization hold)
    const paymentIntent = await createPaymentIntent(
      quotedPrice,
      stringerSettings.stripe_account_id,
      requestId,
      {
        player_id: user.id,
        stringer_id: jobRequest.stringer_id,
      }
    )

    // Update request with payment details
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_authorized_at: new Date().toISOString(),
        platform_fee_cents: breakdown.platformFeeCents,
        stringer_earnings_cents: breakdown.stringerEarningsCents,
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update request with payment info:', updateError)
      // Note: Payment intent is created but not saved to DB - consider canceling it
      return NextResponse.json({ error: 'Failed to save payment authorization' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: quotedPrice,
      platformFee: breakdown.platformFeeCents,
      stringerEarnings: breakdown.stringerEarningsCents,
    })
  } catch (error: any) {
    console.error('Error authorizing payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to authorize payment' },
      { status: 500 }
    )
  }
}
