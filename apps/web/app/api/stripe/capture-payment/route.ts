import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { capturePaymentIntent } from '@/lib/stripe/server'

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
      .select('*')
      .eq('id', requestId)
      .single()

    if (requestError || !jobRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify this is the player's request
    if (jobRequest.player_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request is ready for payment capture
    if (jobRequest.status !== 'ready') {
      return NextResponse.json({
        error: 'Request must be marked as ready before payment capture'
      }, { status: 400 })
    }

    // Check if payment already captured
    if (jobRequest.payment_captured_at) {
      return NextResponse.json({
        error: 'Payment already captured',
        capturedAt: jobRequest.payment_captured_at
      }, { status: 400 })
    }

    // Check if payment was authorized
    if (!jobRequest.payment_intent_id) {
      return NextResponse.json({
        error: 'No payment authorization found for this request'
      }, { status: 400 })
    }

    // Capture the payment intent
    const paymentIntent = await capturePaymentIntent(jobRequest.payment_intent_id)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({
        error: 'Payment capture failed',
        status: paymentIntent.status
      }, { status: 400 })
    }

    // Update request with payment capture details and mark as completed
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        payment_captured_at: new Date().toISOString(),
        payment_status: 'paid',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Failed to update request after payment capture:', updateError)
      return NextResponse.json({ error: 'Failed to update request status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    })
  } catch (error: any) {
    console.error('Error capturing payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
