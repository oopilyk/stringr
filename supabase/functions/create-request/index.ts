import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateRequestPayload {
  stringer_id: string
  racquet_brand?: string
  racquet_model?: string
  string_pref?: string
  tension_lbs?: number
  notes?: string
  dropoff_method?: string
  address?: string
  lat?: number
  lng?: number
  is_rush?: boolean
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

    const payload: CreateRequestPayload = await req.json()

    // Validate required fields
    if (!payload.stringer_id) {
      return new Response(
        JSON.stringify({ error: 'stringer_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get stringer settings to calculate price and check availability
    const { data: stringerSettings, error: settingsError } = await supabase
      .from('stringer_settings')
      .select('*')
      .eq('id', payload.stringer_id)
      .single()

    if (settingsError || !stringerSettings) {
      return new Response(
        JSON.stringify({ error: 'Stringer not found or settings not configured' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check daily job limit
    const today = new Date().toISOString().split('T')[0]
    const { data: todaysRequests, error: countError } = await supabase
      .from('requests')
      .select('id')
      .eq('stringer_id', payload.stringer_id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .in('status', ['requested', 'accepted', 'in_progress'])

    if (countError) {
      console.error('Error checking daily requests:', countError)
      return new Response(
        JSON.stringify({ error: 'Error checking availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (todaysRequests && todaysRequests.length >= stringerSettings.max_daily_jobs) {
      return new Response(
        JSON.stringify({ error: 'Stringer has reached maximum daily job limit' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate quoted price
    let quoted_price_cents = stringerSettings.base_price_cents
    if (payload.is_rush && stringerSettings.accepts_rush) {
      quoted_price_cents += stringerSettings.rush_fee_cents
    }

    // Create the request
    const { data: request, error: createError } = await supabase
      .from('requests')
      .insert({
        player_id: user.id,
        stringer_id: payload.stringer_id,
        racquet_brand: payload.racquet_brand,
        racquet_model: payload.racquet_model,
        string_pref: payload.string_pref,
        tension_lbs: payload.tension_lbs,
        notes: payload.notes,
        dropoff_method: payload.dropoff_method || 'meetup',
        address: payload.address,
        lat: payload.lat,
        lng: payload.lng,
        quoted_price_cents,
        status: 'requested',
        payment_status: 'unpaid'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating request:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Send notification to stringer (email/push)

    return new Response(
      JSON.stringify({ request }),
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
