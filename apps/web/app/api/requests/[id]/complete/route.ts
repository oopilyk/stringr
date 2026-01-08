import { createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { capturePayment } from '@/lib/stripe/server'

// POST /api/requests/[id]/complete - Player confirms pickup and completes request
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Create service role client for bypassing RLS on sensitive operations
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the player and get request details
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('player_id, stringer_id, status, final_price_cents, tip_cents, payment_intent_id, payment_captured_at')
      .eq('id', params.id)
      .single()

    if (reqError) {
      console.error('Error fetching request:', reqError)
      return NextResponse.json({ error: 'Request not found', details: reqError.message }, { status: 404 })
    }

    if (!req || req.player_id !== user.id) {
      console.error('Unauthorized access attempt:', { req, userId: user.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request is ready_for_pickup or already completed
    if (req.status === 'completed') {
      // Already completed, just return success
      console.log('Request already completed, returning success')
      return NextResponse.json({ success: true, alreadyCompleted: true })
    }

    if (req.status !== 'ready_for_pickup') {
      console.error('Invalid status:', req.status)
      return NextResponse.json({ error: 'Request must be ready for pickup', currentStatus: req.status }, { status: 400 })
    }

    // Capture payment if there's a payment intent and it hasn't been captured yet
    if (req.payment_intent_id && !req.payment_captured_at) {
      try {
        console.log('Capturing payment:', req.payment_intent_id)
        await capturePayment(req.payment_intent_id)
        console.log('Payment captured successfully')
      } catch (paymentError: any) {
        console.error('Error capturing payment:', paymentError)
        return NextResponse.json({
          error: 'Failed to capture payment',
          details: paymentError.message
        }, { status: 500 })
      }
    }

    // Update request to completed using admin client to bypass RLS
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
      console.error('Error completing request:', updateError)
      return NextResponse.json({ error: 'Failed to complete request' }, { status: 500 })
    }

    // Increment stringer's earnings
    const totalEarnings = (req.final_price_cents || 0) + (req.tip_cents || 0)
    console.log('Incrementing earnings:', { stringer_id: req.stringer_id, totalEarnings })

    if (totalEarnings > 0) {
      const { error: earningsError } = await supabaseAdmin.rpc('increment_stringer_earnings', {
        p_stringer_id: req.stringer_id,
        p_amount_cents: totalEarnings
      })

      if (earningsError) {
        console.error('Error updating stringer earnings:', earningsError)
        // Don't fail the request completion, just log the error
      } else {
        console.log('Successfully updated earnings')
      }
    }

    // Log state change
    await supabaseAdmin
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'ready_for_pickup',
        to_status: 'completed',
        changed_by: user.id
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
