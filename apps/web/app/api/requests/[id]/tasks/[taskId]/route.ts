import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// PUT /api/requests/[id]/tasks/[taskId] - Update task status
export async function PUT(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const supabase = createServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes, photo_url } = await request.json()

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'skipped']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify user is the stringer for this request
    const { data: req } = await supabase
      .from('requests')
      .select('stringer_id, status, is_paused')
      .eq('id', params.id)
      .single()

    if (!req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can't update tasks if request is completed or cancelled
    if (req.status === 'completed' || req.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot update tasks for completed/cancelled request' }, { status: 400 })
    }

    // Can't update tasks if job is paused
    if (req.is_paused) {
      return NextResponse.json({ error: 'Cannot update tasks while job is paused. Resume the job first.' }, { status: 400 })
    }

    // Get current task
    const { data: task } = await supabase
      .from('stringing_tasks')
      .select('*')
      .eq('id', params.taskId)
      .eq('request_id', params.id)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Validate ordered progression: can only start next task if previous are done
    if (status === 'in_progress' && task.status === 'pending') {
      const { data: canStart } = await supabase
        .rpc('can_start_task', { p_task_id: params.taskId })

      if (!canStart) {
        return NextResponse.json({
          error: 'Must complete previous tasks first',
          message: 'Tasks must be completed in order. Please finish earlier steps before starting this one.'
        }, { status: 400 })
      }
    }

    // Prepare update
    const now = new Date().toISOString()
    const updates: any = { status }

    if (status === 'in_progress' && !task.started_at) {
      updates.started_at = now
      // Clear pause timestamp if resuming
      updates.paused_at = null
    }
    if (status === 'completed' && !task.completed_at) {
      updates.completed_at = now
    }
    if (notes !== undefined) updates.notes = notes
    if (photo_url !== undefined) updates.photo_url = photo_url

    // Update task
    const { error: updateError } = await supabase
      .from('stringing_tasks')
      .update(updates)
      .eq('id', params.taskId)

    if (updateError) {
      console.error('Error updating task:', updateError)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    // Check if this is the first task starting (transition request to in_progress)
    if (status === 'in_progress' && req.status === 'accepted') {
      const { data: allTasks } = await supabase
        .from('stringing_tasks')
        .select('status')
        .eq('request_id', params.id)

      const anyInProgress = allTasks?.some(t => t.status === 'in_progress' || t.status === 'completed')

      if (anyInProgress) {
        await supabase
          .from('requests')
          .update({
            status: 'in_progress',
            work_started_at: now
          })
          .eq('id', params.id)

        // Log state change
        await supabase
          .from('request_state_changes')
          .insert({
            request_id: params.id,
            from_status: 'accepted',
            to_status: 'in_progress',
            changed_by: user.id
          })
      }
    }

    // Calculate new progress
    const { data: progress } = await supabase
      .rpc('calculate_request_progress', { p_request_id: params.id })

    return NextResponse.json({
      success: true,
      progress: progress || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
