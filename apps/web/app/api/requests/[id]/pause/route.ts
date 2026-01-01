import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/pause - Pause a job
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pause_reason } = await request.json()

    if (!pause_reason) {
      return NextResponse.json({ error: 'Pause reason is required' }, { status: 400 })
    }

    // Verify user is the stringer
    const { data: req } = await supabase
      .from('requests')
      .select('stringer_id, status, is_paused')
      .eq('id', params.id)
      .single()

    if (!req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (req.status !== 'in_progress') {
      return NextResponse.json({ error: 'Can only pause in-progress jobs' }, { status: 400 })
    }

    if (req.is_paused) {
      return NextResponse.json({ error: 'Job is already paused' }, { status: 400 })
    }

    // Pause the request
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        is_paused: true,
        pause_reason,
        paused_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error pausing request:', updateError)
      return NextResponse.json({ error: 'Failed to pause request' }, { status: 500 })
    }

    // Pause current in-progress task
    const { data: currentTask } = await supabase
      .from('stringing_tasks')
      .select('id')
      .eq('request_id', params.id)
      .eq('status', 'in_progress')
      .single()

    if (currentTask) {
      await supabase
        .from('stringing_tasks')
        .update({
          paused_at: new Date().toISOString(),
          pause_notes: pause_reason
        })
        .eq('id', currentTask.id)
    }

    // Log state change
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'in_progress',
        to_status: 'in_progress',
        changed_by: user.id,
        reason: `Paused: ${pause_reason}`
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/requests/[id]/pause - Resume a paused job
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the stringer
    const { data: req } = await supabase
      .from('requests')
      .select('stringer_id, status, is_paused')
      .eq('id', params.id)
      .single()

    if (!req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!req.is_paused) {
      return NextResponse.json({ error: 'Job is not paused' }, { status: 400 })
    }

    // Resume the request
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        is_paused: false,
        resumed_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error resuming request:', updateError)
      return NextResponse.json({ error: 'Failed to resume request' }, { status: 500 })
    }

    // Log state change
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'in_progress',
        to_status: 'in_progress',
        changed_by: user.id,
        reason: 'Resumed'
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
