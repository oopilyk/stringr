import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// POST /api/requests/[id]/report-issue - Report string/tension issue
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      issue_type,
      issue_notes,
      corrected_string_brand,
      corrected_string_model,
      corrected_tension_mains,
      corrected_tension_crosses
    } = await request.json()

    if (!issue_type || !issue_notes) {
      return NextResponse.json({ error: 'Issue type and notes are required' }, { status: 400 })
    }

    // Verify user is the stringer
    const { data: req } = await supabase
      .from('requests')
      .select('stringer_id, player_id, status')
      .eq('id', params.id)
      .single()

    if (!req || req.stringer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!['accepted', 'in_progress'].includes(req.status)) {
      return NextResponse.json({ error: 'Can only report issues on active jobs' }, { status: 400 })
    }

    // Update request with issue details
    const updates: any = {
      string_issue_notes: issue_notes
    }

    if (corrected_string_brand) updates.confirmed_string_brand = corrected_string_brand
    if (corrected_string_model) updates.confirmed_string_model = corrected_string_model
    if (corrected_tension_mains) updates.confirmed_tension_mains_lbs = corrected_tension_mains
    if (corrected_tension_crosses) updates.confirmed_tension_crosses_lbs = corrected_tension_crosses

    const { error: updateError } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // Create notification for player
    await supabase.rpc('create_notification', {
      p_user_id: req.player_id,
      p_request_id: params.id,
      p_type: 'string_issue',
      p_title: 'String Issue Reported',
      p_message: issue_notes,
      p_metadata: {
        issue_type,
        corrected_string_brand,
        corrected_string_model,
        corrected_tension_mains,
        corrected_tension_crosses
      }
    })

    // Log state change
    await supabase
      .from('request_state_changes')
      .insert({
        request_id: params.id,
        from_status: req.status,
        to_status: req.status,
        changed_by: user.id,
        reason: `Issue reported: ${issue_type}`,
        metadata: { issue_type, issue_notes }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
