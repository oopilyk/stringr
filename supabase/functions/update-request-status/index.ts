import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'requested': ['accepted', 'canceled'],
  'accepted': ['in_progress', 'canceled'],
  'in_progress': ['ready', 'canceled'],
  'ready': ['completed'],
  'completed': [], // terminal state
  'canceled': [] // terminal state
}

interface UpdateStatusPayload {
  request_id: string
  new_status: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: UpdateStatusPayload = await req.json()

    // Validate required fields
    if (!payload.request_id || !payload.new_status) {
      return new Response(
        JSON.stringify({ error: 'request_id and new_status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the current request
    const { data: request, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', payload.request_id)
      .single()

    if (fetchError || !request) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check permissions
    const canUpdate = (
      (user.id === request.player_id && ['canceled'].includes(payload.new_status)) ||
      (user.id === request.stringer_id && ['accepted', 'in_progress', 'ready', 'completed'].includes(payload.new_status))
    )

    if (!canUpdate) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to update this request' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate status transition
    const validNextStatuses = VALID_TRANSITIONS[request.status] || []
    if (!validNextStatuses.includes(payload.new_status)) {
      return new Response(
        JSON.stringify({ 
          error: `Invalid status transition from ${request.status} to ${payload.new_status}`,
          valid_transitions: validNextStatuses
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: payload.new_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating request:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update request status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Send notification to the other party (email/push)
    // TODO: For 'completed' status, prompt for review

    return new Response(
      JSON.stringify({ request: updatedRequest }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
