/**
 * Pickup Extension Response Endpoint
 *
 * Allows stringers to approve or deny extension requests
 */

import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Rate limiting
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.DEFAULT, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. Parse request body
    const body = await request.json()
    const { approved, reason } = body

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Approved field is required' }, { status: 400 })
    }

    // 4. Get request and verify ownership
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, player_id, stringer_id, status, pickup_deadline, extension_requested_at, extension_approved')
      .eq('id', params.id)
      .eq('stringer_id', user.id) // Only stringer can respond
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Request not found or access denied' }, { status: 404 })
    }

    // 5. Validate state
    if (!req.extension_requested_at) {
      return NextResponse.json({ error: 'No extension request pending' }, { status: 400 })
    }

    if (req.extension_approved !== null) {
      return NextResponse.json({ error: 'Extension request already responded to' }, { status: 409 })
    }

    // 6. Update based on approval
    const updateData: any = {
      extension_approved: approved,
      extension_response_at: new Date().toISOString(),
      extension_response_reason: reason?.trim() || null,
      updated_at: new Date().toISOString()
    }

    // If approved, extend the deadline by 24 hours
    if (approved) {
      const currentDeadline = req.pickup_deadline ? new Date(req.pickup_deadline) : new Date()
      const newDeadline = new Date(currentDeadline.getTime() + 24 * 60 * 60 * 1000)
      updateData.pickup_deadline = newDeadline.toISOString()
    }

    const { error: updateError } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to respond to extension request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? 'Extension approved. Pickup deadline extended by 24 hours.'
        : 'Extension denied. The player has been notified.',
      new_deadline: approved ? updateData.pickup_deadline : req.pickup_deadline
    })

  } catch (error: any) {
    console.error('Extension response error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
