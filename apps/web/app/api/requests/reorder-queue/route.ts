import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/requests/reorder-queue - Reorder stringer's queue
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Get request body
    const { request_ids } = await request.json()

    if (!Array.isArray(request_ids) || request_ids.length === 0) {
      return NextResponse.json({ error: 'request_ids array is required' }, { status: 400 })
    }

    // 3. Verify user is a stringer
    const { data: stringerSettings } = await supabase
      .from('stringer_settings')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!stringerSettings) {
      return NextResponse.json({ error: 'Only stringers can reorder queues' }, { status: 403 })
    }

    // 4. Update queue priorities directly
    const updatePromises = request_ids.map((requestId, index) =>
      supabase
        .from('requests')
        .update({
          queue_priority: index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('stringer_id', user.id)
        .eq('status', 'accepted')
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Queue reorder - some updates failed:', errors.map(e => e.error))
      return NextResponse.json({ error: 'Failed to update some requests' }, { status: 500 })
    }

    // Note: Real-time broadcast is handled client-side in SortableQueue component

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Reorder queue error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
