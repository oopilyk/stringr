import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// GET /api/requests/[id]/tasks - Get all tasks for a request
export async function GET(
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

    // Verify user is involved in this request
    const { data: req } = await supabase
      .from('requests')
      .select('player_id, stringer_id')
      .eq('id', params.id)
      .single()

    if (!req || (req.player_id !== user.id && req.stringer_id !== user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch tasks
    const { data: tasks, error } = await supabase
      .from('stringing_tasks')
      .select('*')
      .eq('request_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    // Calculate progress
    const { data: progress } = await supabase
      .rpc('calculate_request_progress', { p_request_id: params.id })

    return NextResponse.json({
      tasks: tasks || [],
      progress: progress || 0
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
