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

    // Build the query to find only active stringers (those with stringer_settings entries)
    let query = supabase
      .from('stringer_settings')
      .select(`
        *,
        profiles!inner(id, full_name, bio, city, lat, lng, phone, avatar_url, created_at, updated_at)
      `)
      .not('profiles.lat', 'is', null)
      .not('profiles.lng', 'is', null)
      .eq('suspended', false) // Only include non-suspended stringers

    const { data: stringerSettings, error } = await query

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!stringerSettings || stringerSettings.length === 0) {
      return new Response(
        JSON.stringify({ stringers: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get ratings for all stringers
    const stringerIds = stringerSettings.map(s => s.profiles.id)
    const { data: ratings } = await supabase
      .from('stringer_ratings')
      .select('*')
      .in('stringer_id', stringerIds)

    // Create a map of ratings by stringer_id
    const ratingsMap = new Map()
    if (ratings) {
      ratings.forEach(rating => {
        ratingsMap.set(rating.stringer_id, rating)
      })
    }

    // Filter by distance and other criteria
    const filtered = stringerSettings
      .map(settings => {
        // Calculate distance using haversine formula
        const distance = calculateDistance(lat, lng, settings.profiles.lat, settings.profiles.lng)
        
        // Get rating for this stringer
        const rating = ratingsMap.get(settings.profiles.id) || undefined

        // Restructure data to match expected frontend format
        return { 
          id: settings.profiles.id,
          full_name: settings.profiles.full_name,
          bio: settings.profiles.bio,
          city: settings.profiles.city,
          lat: settings.profiles.lat,
          lng: settings.profiles.lng,
          phone: settings.profiles.phone,
          avatar_url: settings.profiles.avatar_url,
          created_at: settings.profiles.created_at,
          updated_at: settings.profiles.updated_at,
          stringer_settings: {
            id: settings.id,
            base_price_cents: settings.base_price_cents,
            turnaround_hours: settings.turnaround_hours,
            accepts_rush: settings.accepts_rush,
            rush_fee_cents: settings.rush_fee_cents,
            max_daily_jobs: settings.max_daily_jobs,
            services: settings.services,
            availability: settings.availability
          },
          distance_km: distance,
          rating
        }
      })
      .filter(stringer => {
        // Filter by radius
        if (stringer.distance_km > radius_km) return false
        
        // Filter by minimum rating
        if (min_rating && (!stringer.rating?.avg_rating || stringer.rating.avg_rating < min_rating)) {
          return false
        }
        
        // Filter by max price
        if (max_price_cents && stringer.stringer_settings.base_price_cents > max_price_cents) {
          return false
        }
        
        // Filter by rush availability
        if (accepts_rush && !stringer.stringer_settings.accepts_rush) {
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
