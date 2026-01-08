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
      racket_count,
      final_price_cents
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

    // Validate final price
    if (!final_price_cents || final_price_cents <= 0) {
      return NextResponse.json({ error: 'Final price is required' }, { status: 400 })
    }

    // Update request status to accepted with confirmed details and final price
    // NOTE: Status stays as 'accepted' until player authorizes payment
    // Payment authorization will transition to 'in_progress'
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
        racket_count: racket_count || 1,
        final_price_cents: final_price_cents
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error accepting request:', updateError)
      return NextResponse.json({ error: 'Failed to accept request' }, { status: 500 })
    }

    // DO NOT initialize tasks yet - wait for payment authorization
    // Tasks will be created when payment is authorized in /authorize-payment endpoint

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
