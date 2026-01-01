import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/accept - Stringer accepts a request
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

    const {
      estimated_completion,
      accept_message,
      confirmed_string_brand,
      confirmed_string_model,
      confirmed_tension_mains_lbs,
      confirmed_tension_crosses_lbs,
      string_issue_notes,
      racket_count
    } = await request.json()

    // Validate request exists, is pending, and user is the assigned stringer
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', params.id)
      .eq('stringer_id', user.id)
      .eq('status', 'pending')
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Request not found or already accepted' }, { status: 404 })
    }

    // Validate state transition
    const { data: canTransition } = await supabase
      .rpc('validate_request_state_transition', {
        p_request_id: params.id,
        p_new_status: 'accepted'
      })

    if (!canTransition) {
      return NextResponse.json({ error: 'Invalid state transition' }, { status: 400 })
    }

    // Update request status to accepted with confirmed details
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        estimated_completion: estimated_completion || null,
        confirmed_string_brand: confirmed_string_brand || req.string_selection?.brand,
        confirmed_string_model: confirmed_string_model || req.string_selection?.model,
        confirmed_tension_mains_lbs: confirmed_tension_mains_lbs || req.tension_mains_lbs,
        confirmed_tension_crosses_lbs: confirmed_tension_crosses_lbs || req.tension_crosses_lbs,
        string_issue_notes: string_issue_notes || null,
        racket_count: racket_count || 1
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error accepting request:', updateError)
      return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 })
    }

    // Initialize stringing tasks
    const { error: tasksError } = await supabase
      .rpc('initialize_stringing_tasks', { p_request_id: params.id })

    if (tasksError) {
      console.error('Error initializing tasks:', tasksError)
      // Don't fail the whole request - tasks might already exist
      // We'll try to create them manually as fallback
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

      // Try inserting tasks directly
      for (let i = 0; i < taskTypes.length; i++) {
        await supabase
          .from('stringing_tasks')
          .insert({
            request_id: params.id,
            task_type: taskTypes[i],
            status: 'pending',
            task_order: i + 1,
            is_required: !['inspect_frame', 'completion_photo'].includes(taskTypes[i])
          })
          .select()
          .single()
          // Ignore errors - tasks might already exist
          .then(() => {})
          .catch(() => {})
      }
    }

    // Create state change audit log
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'pending',
        to_status: 'accepted',
        changed_by: user.id,
        metadata: accept_message ? { message: accept_message } : null
      })

    return NextResponse.json({
      success: true,
      message: 'Request accepted successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
