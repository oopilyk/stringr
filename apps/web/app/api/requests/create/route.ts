import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { CreateRequestSchema, validateData } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // SECURITY: Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log('Received request body:', JSON.stringify(body, null, 2))

    // SECURITY: Server-side validation with Zod
    const validationResult = validateData(CreateRequestSchema, body)
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error)
      console.log('Failed fields:', JSON.stringify(body, null, 2))
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // SECURITY: Verify stringer exists and is accepting requests
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('accepting_requests, string_inventory, dropoff_methods, max_tension, flexible_availability, availability')
      .eq('id', data.stringer_id)
      .single()

    if (stringerError || !stringerSettings) {
      return NextResponse.json(
        { error: 'Stringer not found' },
        { status: 404 }
      )
    }

    if (!stringerSettings.accepting_requests) {
      return NextResponse.json(
        { error: 'Stringer is not accepting requests' },
        { status: 400 }
      )
    }

    // SECURITY: Verify selected string exists in stringer's inventory
    // Skip check if player is providing their own string
    const isPlayerProvidedString = data.string_selection.brand === 'Player Provided'

    if (!isPlayerProvidedString) {
      const stringExists = stringerSettings.string_inventory?.some(
        (s: any) =>
          s.brand === data.string_selection.brand &&
          s.model === data.string_selection.model &&
          s.gauge === data.string_selection.gauge
      )

      if (!stringExists) {
        return NextResponse.json(
          { error: 'Selected string is not available in stringer inventory' },
          { status: 400 }
        )
      }
    }

    // SECURITY: Verify dropoff method exists in stringer's options
    const dropoffExists = stringerSettings.dropoff_methods?.some(
      (d: any) => d.method === data.dropoff_method.method
    )

    if (!dropoffExists) {
      return NextResponse.json(
        { error: 'Selected dropoff method is not available' },
        { status: 400 }
      )
    }

    // SECURITY: Verify tension is within limits
    if (stringerSettings.max_tension) {
      if (data.tension_mains_lbs > stringerSettings.max_tension ||
          data.tension_crosses_lbs > stringerSettings.max_tension) {
        return NextResponse.json(
          { error: `Tension exceeds stringer's maximum of ${stringerSettings.max_tension} lbs` },
          { status: 400 }
        )
      }
    }

    // SECURITY: Verify time slot if required
    if (!stringerSettings.flexible_availability &&
        stringerSettings.availability?.length > 0 &&
        !data.preferred_time_slot) {
      return NextResponse.json(
        { error: 'Preferred time slot is required for this stringer' },
        { status: 400 }
      )
    }

    // Create the request in database
    const { data: newRequest, error: insertError } = await supabase
      .from('requests')
      .insert({
        player_id: user.id,
        stringer_id: data.stringer_id,
        status: 'pending',
        racket_photo_url: data.racket_photo_url,
        service_type: data.service_type,
        string_selection: data.string_selection,
        tension_mains_lbs: data.tension_mains_lbs,
        tension_crosses_lbs: data.tension_crosses_lbs,
        string_pattern: data.string_pattern,
        dropoff_method: data.dropoff_method,
        preferred_time_slot: data.preferred_time_slot || null,
        special_instructions: data.special_instructions || null,
        preferred_completion_date: data.preferred_completion_date || null,
        estimated_price_cents: data.estimated_price_cents,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: newRequest.id,
      message: 'Request created successfully',
    })
  } catch (error) {
    console.error('Request creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
