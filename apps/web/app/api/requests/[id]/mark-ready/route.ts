import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { capturePayment } from '@/lib/stripe/server'

// POST /api/requests/[id]/mark-ready - Mark request as ready for pickup and capture payment
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

    const { completion_notes, completion_photo_url, actual_string_installed } = await request.json()

    // Require completion photo
    if (!completion_photo_url) {
      return NextResponse.json({ error: 'Completion photo is required' }, { status: 400 })
    }

    // Verify user is the stringer and get request details for gallery
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('stringer_id, status, player_id, payment_intent_id, payment_captured_at, string_selection, tension_mains_lbs, tension_crosses_lbs')
      .eq('id', params.id)
      .single()

    if (reqError || !req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request is in_progress (stringer must have started work)
    if (req.status !== 'in_progress') {
      return NextResponse.json({ error: 'Request must be in progress to mark as ready' }, { status: 400 })
    }

    // CAPTURE PAYMENT - Release funds to stringer when work is complete
    let paymentCapturedAt = req.payment_captured_at
    if (req.payment_intent_id && !req.payment_captured_at) {
      try {
        console.log(`[Mark Ready] Capturing payment: ${req.payment_intent_id}`)
        await capturePayment(req.payment_intent_id)
        paymentCapturedAt = new Date().toISOString()
        console.log('[Mark Ready] Payment captured successfully')
      } catch (paymentError: any) {
        console.error('[Mark Ready] Payment capture failed:', paymentError.message)
        return NextResponse.json({
          error: 'Failed to process payment. Please try again or contact support.',
          code: 'payment_capture_failed'
        }, { status: 500 })
      }
    }

    // Update request to ready_for_pickup
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'ready_for_pickup',
        ready_at: now,
        completion_notes,
        completion_photo_url,
        actual_string_installed,
        payment_captured_at: paymentCapturedAt
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error marking ready:', updateError)
      return NextResponse.json({ error: 'Failed to mark ready' }, { status: 500 })
    }

    // Log state change
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: req.status,
        to_status: 'ready_for_pickup',
        changed_by: user.id,
        metadata: {
          completion_notes,
          payment_captured: !!paymentCapturedAt,
          payment_intent_id: req.payment_intent_id
        }
      })

    // Add completion photo to stringer's racket gallery
    try {
      // Get current gallery count for display_order
      const { count } = await supabase
        .from('racket_gallery')
        .select('*', { count: 'exact', head: true })
        .eq('stringer_id', user.id)

      // Prepare string information from the request
      const stringSelection = req.string_selection as any
      const stringInfo = stringSelection?.brand && stringSelection?.brand !== 'Player Provided'
        ? `${stringSelection.brand} ${stringSelection.model || ''} ${stringSelection.gauge || ''}`.trim()
        : null

      // Calculate average tension
      const avgTension = req.tension_mains_lbs && req.tension_crosses_lbs
        ? Math.round((req.tension_mains_lbs + req.tension_crosses_lbs) / 2)
        : null

      // Generate caption with stringing details
      let caption = 'Completed stringing job'
      if (stringSelection?.brand === 'Player Provided') {
        caption += ' - Player provided string'
      } else if (stringInfo) {
        caption += ` - ${stringInfo}`
      }
      if (avgTension) {
        caption += ` @ ${avgTension} lbs`
      }

      // Insert into racket gallery
      await supabase
        .from('racket_gallery')
        .insert({
          stringer_id: user.id,
          image_url: completion_photo_url,
          caption: caption,
          string_used: stringInfo,
          tension_lbs: avgTension,
          display_order: count || 0,
        })

      console.log('[Mark Ready] Added completion photo to racket gallery')
    } catch (galleryError) {
      // Don't fail the request if gallery addition fails
      console.error('[Mark Ready] Error adding to racket gallery:', galleryError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
