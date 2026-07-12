import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateRequestSchema, validateData } from '@/lib/validation/schemas'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'

/**
 * POST /api/requests/create - Create a new stringing request
 *
 * SECURITY:
 * - Rate limited to 30 req/min (prevents spam requests)
 * - Strict input validation with Zod schema
 * - Authentication required (players only)
 * - Stringer verification (exists, accepting requests)
 * - String inventory validation (selected string must be available)
 * - Dropoff method validation
 * - Tension limits validation
 * - Database error sanitization
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // 1. AUTHENTICATION - Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. RATE LIMITING - Prevent request spam (30 req/min)
    const rateLimitResult = await withRateLimit(request, RATE_LIMITS.MUTATION, user.id)
    if (rateLimitResult) return rateLimitResult

    // 3. INPUT VALIDATION - Validate request body with strict schema
    const body = await request.json()
    const validationResult = validateData(CreateRequestSchema, body)
    if (!validationResult.success) {
      console.error('[Request Create] Validation failed:', validationResult.error)
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 4. AUTHORIZATION - Verify stringer exists and is accepting requests
    const { data: stringerSettings, error: stringerError } = await supabase
      .from('stringer_settings')
      .select('accepting_requests, string_inventory, dropoff_methods, max_tension, flexible_availability, availability, rush_turnaround_hours, accepts_rush')
      .eq('id', data.stringer_id)
      .single()

    if (stringerError || !stringerSettings) {
      console.error('[Request Create] Stringer not found:', data.stringer_id)
      return NextResponse.json(
        { error: 'Stringer not found or unavailable' },
        { status: 404 }
      )
    }

    if (!stringerSettings.accepting_requests) {
      return NextResponse.json(
        { error: 'Stringer is not currently accepting requests' },
        { status: 400 }
      )
    }

    // 5. BUSINESS LOGIC VALIDATION - Verify selected string exists in stringer's inventory
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
        console.error('[Request Create] String not in inventory:', data.string_selection)
        return NextResponse.json(
          { error: 'Selected string is not available from this stringer' },
          { status: 400 }
        )
      }
    }

    // 6. BUSINESS LOGIC VALIDATION - Verify dropoff method exists in stringer's options
    // MVP: Accept default "Drop-off" method even if not explicitly configured
    const dropoffExists = stringerSettings.dropoff_methods?.some(
      (d: any) => d.method === data.dropoff_method.method
    )

    const isDefaultDropoff = data.dropoff_method.method === 'Drop-off'

    if (!dropoffExists && !isDefaultDropoff) {
      console.error('[Request Create] Invalid dropoff method:', data.dropoff_method.method)
      return NextResponse.json(
        { error: 'Selected dropoff method is not available' },
        { status: 400 }
      )
    }

    // 7. BUSINESS LOGIC VALIDATION - Verify tension is within limits
    if (stringerSettings.max_tension) {
      if (data.tension_mains_lbs > stringerSettings.max_tension ||
          data.tension_crosses_lbs > stringerSettings.max_tension) {
        return NextResponse.json(
          { error: `Tension exceeds stringer's maximum of ${stringerSettings.max_tension} lbs` },
          { status: 400 }
        )
      }
    }

    // 8. BUSINESS LOGIC VALIDATION - Verify time slot if required
    if (!stringerSettings.flexible_availability &&
        stringerSettings.availability?.length > 0 &&
        !data.preferred_time_slot) {
      return NextResponse.json(
        { error: 'Please select a preferred time slot' },
        { status: 400 }
      )
    }

    // 9. DATABASE OPERATION - Create the request
    // Determine if this is a rush order based on preferred completion date
    let isRush = false
    if (stringerSettings.accepts_rush && data.preferred_completion_date) {
      // Default to 24 hours if rush_turnaround_hours is not set
      const rushHours = Number(stringerSettings.rush_turnaround_hours) || 24

      // Calculate the rush threshold date (just the date, ignoring time)
      const rushThreshold = new Date(Date.now() + rushHours * 60 * 60 * 1000)
      const rushThresholdDate = rushThreshold.toISOString().split('T')[0]

      // Compare dates only - if preferred date is on or before rush threshold date, it's rush
      isRush = data.preferred_completion_date <= rushThresholdDate
    }

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
        is_rush: isRush,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[Request Create] Database insert failed:', insertError.message)
      // SECURITY: Don't expose database details
      return NextResponse.json(
        { error: 'Failed to create request. Please try again.' },
        { status: 500 }
      )
    }

    // 10. SUCCESS RESPONSE
    console.log(`[Request Create] Success: ${newRequest.id} by player ${user.id}`)
    return NextResponse.json({
      success: true,
      id: newRequest.id,
      message: 'Request created successfully',
    })

  } catch (error: any) {
    // SECURITY: Global error handler - sanitize all errors
    console.error('[Request Create] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
