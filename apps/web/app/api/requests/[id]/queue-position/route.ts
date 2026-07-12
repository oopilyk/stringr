import { createServerClient, createServiceRoleClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    // Service role client bypasses RLS - needed to see all requests in queue
    const adminClient = createServiceRoleClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the request to find the stringer and other details
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, stringer_id, player_id, status, payment_authorized_at, work_started_at, is_rush, queue_priority')
      .eq('id', params.id)
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Verify user has access (either player or stringer)
    if (req.player_id !== user.id && req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If work has started, no queue position
    if (req.work_started_at) {
      return NextResponse.json({ queue_position: null, status: 'in_progress' })
    }

    // If payment not authorized, not in queue yet
    if (!req.payment_authorized_at) {
      return NextResponse.json({ queue_position: null, status: 'awaiting_payment' })
    }

    // Calculate queue position directly (matches dashboard sorting exactly)
    // Use adminClient to bypass RLS and see ALL requests in the stringer's queue
    const { data: queueRequests, error: queueError } = await adminClient
      .from('requests')
      .select('id, is_rush, queue_priority, payment_authorized_at')
      .eq('stringer_id', req.stringer_id)
      .eq('status', 'accepted')
      .not('payment_authorized_at', 'is', null)
      .is('work_started_at', null)

    if (queueError || !queueRequests) {
      console.error('Queue fetch error:', queueError)
      return NextResponse.json({ queue_position: 1, total_in_queue: 1, status: 'in_queue' })
    }

    // Debug logging
    console.log('[Queue Position] Request ID:', params.id)
    console.log('[Queue Position] Stringer ID:', req.stringer_id)
    console.log('[Queue Position] All queue requests:', queueRequests.map(r => ({
      id: r.id.substring(0, 8),
      is_rush: r.is_rush,
      queue_priority: r.queue_priority
    })))

    // Sort: By queue_priority (stringer's manual order) first, then rush, then payment time
    // This respects the stringer's manual reordering while still auto-sorting rush orders
    // when they haven't been manually positioned
    const sorted = queueRequests.sort((a, b) => {
      // First: respect stringer's manual queue order (queue_priority)
      const aPriority = a.queue_priority ?? 999999
      const bPriority = b.queue_priority ?? 999999
      if (aPriority !== bPriority) return aPriority - bPriority
      // If no manual order set, rush orders come first
      if (a.is_rush && !b.is_rush) return -1
      if (!a.is_rush && b.is_rush) return 1
      // Finally by payment_authorized_at (oldest first - FIFO)
      const aDate = a.payment_authorized_at ? new Date(a.payment_authorized_at).getTime() : 0
      const bDate = b.payment_authorized_at ? new Date(b.payment_authorized_at).getTime() : 0
      return aDate - bDate
    })

    // Debug: Log sorted order
    console.log('[Queue Position] Sorted order:', sorted.map((r, i) => ({
      position: i + 1,
      id: r.id.substring(0, 8),
      is_rush: r.is_rush
    })))

    // Find this request's position
    const index = sorted.findIndex(r => r.id === params.id)
    console.log('[Queue Position] This request position:', index + 1)

    return NextResponse.json({
      queue_position: index + 1,
      total_in_queue: sorted.length,
      status: 'in_queue'
    })

  } catch (error: any) {
    console.error('Queue position error:', error)
    return NextResponse.json({ error: 'Failed to get queue position' }, { status: 500 })
  }
}
