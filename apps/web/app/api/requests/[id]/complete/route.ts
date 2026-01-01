import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/complete - Player confirms pickup and completes request
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

    // Verify user is the player
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('player_id, stringer_id, status')
      .eq('id', params.id)
      .single()

    if (reqError || !req || req.player_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify request is ready_for_pickup
    if (req.status !== 'ready_for_pickup') {
      return NextResponse.json({ error: 'Request must be ready for pickup' }, { status: 400 })
    }

    // Update request to completed
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'completed',
        completed_at: now
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error completing request:', updateError)
      return NextResponse.json({ error: 'Failed to complete request' }, { status: 500 })
    }

    // Log state change
    await supabase
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
