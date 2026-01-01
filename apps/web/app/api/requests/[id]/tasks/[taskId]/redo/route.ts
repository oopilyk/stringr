import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/tasks/[taskId]/redo - Mark task for redo
export async function POST(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { redo_reason } = await request.json()

    if (!redo_reason) {
      return NextResponse.json({ error: 'Redo reason is required' }, { status: 400 })
    }

    // Verify user is the stringer
    const { data: req } = await supabase
      .from('requests')
      .select('stringer_id, status')
      .eq('id', params.id)
      .single()

    if (!req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get task
    const { data: task } = await supabase
      .from('stringing_tasks')
      .select('*')
      .eq('id', params.taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (task.status !== 'completed') {
      return NextResponse.json({ error: 'Can only redo completed tasks' }, { status: 400 })
    }

    // Reset task to in_progress
    const { error: updateError } = await supabase
      .from('stringing_tasks')
      .update({
        status: 'in_progress',
        redo_count: (task.redo_count || 0) + 1,
        redo_reason,
        completed_at: null
      })
      .eq('id', params.taskId)

    if (updateError) {
      console.error('Error redoing task:', updateError)
      return NextResponse.json({ error: 'Failed to redo task' }, { status: 500 })
    }

    // Log state change
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: req.status,
        to_status: req.status,
        changed_by: user.id,
        reason: `Task redone: ${task.task_type} - ${redo_reason}`,
        metadata: { task_id: params.taskId, task_type: task.task_type, redo_reason }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
