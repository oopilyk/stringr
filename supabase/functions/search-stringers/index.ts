import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  lat: number
  lng: number
  radius_km?: number
  min_rating?: number
  max_price_cents?: number
  accepts_rush?: boolean
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

    const url = new URL(req.url)
    const lat = parseFloat(url.searchParams.get('lat') || '0')
    const lng = parseFloat(url.searchParams.get('lng') || '0')
    const radius_km = parseFloat(url.searchParams.get('radius_km') || '25')
    const min_rating = url.searchParams.get('min_rating') ? parseFloat(url.searchParams.get('min_rating')!) : undefined
    const max_price_cents = url.searchParams.get('max_price_cents') ? parseInt(url.searchParams.get('max_price_cents')!) : undefined
    const accepts_rush = url.searchParams.get('accepts_rush') === 'true'

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'lat and lng parameters are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the query to find stringers within radius
    let query = supabase
      .from('profiles')
      .select(`
        *,
        stringer_settings (*),
        stringer_ratings (avg_rating, review_count)
      `)
      .eq('role', 'stringer')
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    const { data: stringers, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter by distance and other criteria
    const filtered = stringers
      .map(stringer => {
        // Calculate distance using haversine formula
        const distance = calculateDistance(lat, lng, stringer.lat, stringer.lng)
        return { ...stringer, distance_km: distance }
      })
      .filter(stringer => {
        // Filter by radius
        if (stringer.distance_km > radius_km) return false
        
        // Filter by minimum rating
        if (min_rating && (!stringer.stringer_ratings?.[0]?.avg_rating || stringer.stringer_ratings[0].avg_rating < min_rating)) {
          return false
        }
        
        // Filter by max price
        if (max_price_cents && stringer.stringer_settings?.[0]?.base_price_cents > max_price_cents) {
          return false
        }
        
        // Filter by rush availability
        if (accepts_rush && !stringer.stringer_settings?.[0]?.accepts_rush) {
          return false
        }
        
        return true
      })
      .sort((a, b) => a.distance_km - b.distance_km) // Sort by distance

    return new Response(
      JSON.stringify({ stringers: filtered }),
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

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadius = 6371 // km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
