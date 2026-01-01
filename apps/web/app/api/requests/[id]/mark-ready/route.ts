import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/mark-ready - Mark request as ready for pickup
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

    // Verify user is the stringer
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('stringer_id, status, player_id')
      .eq('id', params.id)
      .single()

    if (reqError || !req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request is in_progress
    if (req.status !== 'in_progress') {
      return NextResponse.json({ error: 'Request must be in progress' }, { status: 400 })
    }

    // Verify all required tasks are completed
    const { data: allCompleted } = await supabase
      .rpc('all_required_tasks_completed', { p_request_id: params.id })

    if (!allCompleted) {
      return NextResponse.json({ error: 'All required tasks must be completed' }, { status: 400 })
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
        actual_string_installed
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
        from_status: 'in_progress',
        to_status: 'ready_for_pickup',
        changed_by: user.id,
        metadata: { completion_notes }
      })

    // TODO: Send notification to player
    // await sendNotification(req.player_id, {
    //   type: 'request_ready',
    //   title: 'Your Racket is Ready!',
    //   body: 'Pick up your freshly strung racket',
    //   data: { request_id: params.id }
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
