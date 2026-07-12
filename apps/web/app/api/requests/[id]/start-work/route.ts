/**
 * Start Work on a Racket Endpoint
 *
 * Called by stringer when they're ready to begin work on a racket.
 * Payment must be authorized before work can start.
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Get request and verify stringer ownership
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, stringer_id, status, payment_authorized_at, work_started_at')
      .eq('id', params.id)
      .eq('stringer_id', user.id)
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Request not found or access denied' }, { status: 404 })
    }

    // 3. Verify request is in correct state
    if (req.status !== 'accepted') {
      return NextResponse.json({ error: 'Request must be in accepted status' }, { status: 400 })
    }

    if (!req.payment_authorized_at) {
      return NextResponse.json({ error: 'Payment must be authorized before starting work' }, { status: 400 })
    }

    if (req.work_started_at) {
      return NextResponse.json({ error: 'Work has already started on this request' }, { status: 400 })
    }

    // 4. Start work using database function
    const { data: startResult, error: startError } = await supabase
      .rpc('start_racket_work', {
        p_request_id: params.id,
        p_stringer_id: user.id
      })

    if (startError) {
      console.error('Start work error:', startError)
      return NextResponse.json({ error: 'Failed to start work' }, { status: 500 })
    }

    // 5. Initialize stringing tasks
    const { error: tasksError } = await supabase
      .rpc('initialize_stringing_tasks', { p_request_id: params.id })

    if (tasksError) {
      console.error('Task initialization error:', tasksError)
      // Fallback: create tasks manually
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
          .then(() => {}, () => {})
      }
    }

    // 6. Audit log
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: 'accepted',
        to_status: 'in_progress',
        changed_by: user.id,
        metadata: { work_started: true }
      })

    return NextResponse.json({
      success: true,
      status: 'in_progress',
      work_started_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Start work error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
