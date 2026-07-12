/**
 * Pickup Extension Request Endpoint
 *
 * Allows players to request an extension of the 48-hour pickup deadline
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
    const { reason } = body

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a reason for the extension request (min 10 characters)' },
        { status: 400 }
      )
    }

    // 4. Get request and verify ownership
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select('id, player_id, stringer_id, status, pickup_deadline, extension_requested_at, extension_approved')
      .eq('id', params.id)
      .eq('player_id', user.id) // Only player can request extension
      .single()

    if (reqError || !req) {
      return NextResponse.json({ error: 'Request not found or access denied' }, { status: 404 })
    }

    // 5. Validate state
    if (req.status !== 'ready') {
      return NextResponse.json(
        { error: 'Extensions can only be requested for completed jobs awaiting pickup' },
        { status: 400 }
      )
    }

    if (req.extension_requested_at && req.extension_approved === null) {
      return NextResponse.json(
        { error: 'An extension request is already pending' },
        { status: 409 }
      )
    }

    // 6. Update request with extension request
    const { error: updateError } = await supabase
      .from('requests')
      .update({
        extension_requested_at: new Date().toISOString(),
        extension_request_reason: reason.trim(),
        extension_approved: null, // Reset for new request
        extension_response_at: null,
        extension_response_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to submit extension request' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Extension request submitted. The stringer will be notified.'
    })

  } catch (error: any) {
    console.error('Extension request error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
