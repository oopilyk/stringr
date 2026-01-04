'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { StringerCard } from '@stringerly/ui'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'
import { UserPlus } from 'lucide-react'
import type { StringerSearchResult, SearchStringersParams } from '@stringerly/types'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { FilterBar } from './filter-bar'
import { useSearchLocation } from '@/lib/contexts/search-location-context'
import { calculateProfileCompleteness } from '@/lib/utils/profile-completeness'


// Calculate distance using Haversine formula
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

interface DiscoverPageProps {
  isAuthenticated?: boolean
}

export function DiscoverPage({ isAuthenticated = false }: DiscoverPageProps) {
  const { profile } = useAuth()
  const { setSearchLocation } = useSearchLocation()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [searchParams, setSearchParams] = useState<SearchStringersParams>({
    lat: 0,
    lng: 0,
    radius_km: 201.168 // 125 miles in km
  })
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const supabase = createClient()

  // Update search location whenever filter location changes
  useEffect(() => {
    if (searchParams.lat && searchParams.lng) {
      setSearchLocation({ lat: searchParams.lat, lng: searchParams.lng })
    }
  }, [searchParams.lat, searchParams.lng, setSearchLocation])

  // Get user's location - try browser first, then fall back to profile
  useEffect(() => {
    // Try to get browser location first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setSearchParams((prev: SearchStringersParams) => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }))
          setLocationError(false)
        },
        (error) => {
          console.log('Browser location access denied:', error)
          // Fall back to profile location
          if (profile?.lat != null && profile?.lng != null) {
            const userLat = profile.lat
            const userLng = profile.lng
            setLocation({ lat: userLat, lng: userLng })
            setSearchParams((prev: SearchStringersParams) => ({
              ...prev,
              lat: userLat,
              lng: userLng
            }))
            setLocationError(false)
          } else {
            // No location available
            setLocationError(true)
          }
        }
      )
    } else {
      // Geolocation not supported, try profile location
      if (profile?.lat != null && profile?.lng != null) {
        const userLat = profile.lat
        const userLng = profile.lng
        setLocation({ lat: userLat, lng: userLng })
        setSearchParams((prev: SearchStringersParams) => ({
          ...prev,
          lat: userLat,
          lng: userLng
        }))
        setLocationError(false)
      } else {
        setLocationError(true)
      }
    }
  }, [profile?.lat, profile?.lng])

  // Fetch stringers from database with fallback to sample data
  const { data: stringers = [], isLoading } = useQuery({
    queryKey: ['stringers', searchParams, profile?.id, profile?.full_name],
    queryFn: async () => {
      try {
        console.log('Fetching stringers from database...')
        console.log('Current profile:', profile?.full_name, 'ID:', profile?.id, 'Role:', profile?.role)
        console.log('Current user location:', { lat: profile?.lat, lng: profile?.lng })
        console.log('Search location:', { lat: searchParams.lat, lng: searchParams.lng })

        // Fetch stringers from database
        // Only fetch profiles that have completed stringer onboarding
        const { data: dbStringers, error: dbError } = await supabase
          .from('stringer_settings')
          .select(`
            *,
            profiles!inner (*)
          `)
          .not('onboarding_completed_at', 'is', null)

        if (dbError) {
          console.error('Database error:', dbError)
          throw dbError
        }

        console.log('Fetched from database:', dbStringers?.length || 0, 'stringers')
        console.log('Database stringers:', dbStringers?.map(s => {
          const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
          return profile?.full_name
        }))

        // Map database stringers to StringerSearchResult format
        const allStringers = (dbStringers || []).map(settings => {
          const profile = Array.isArray(settings.profiles) ? settings.profiles[0] : settings.profiles
          return {
            ...profile,
            stringer_settings: {
              id: settings.id,
              base_price_cents: settings.base_price_cents,
              turnaround_hours: settings.turnaround_hours,
              accepts_rush: settings.accepts_rush,
              rush_fee_cents: settings.rush_fee_cents,
              max_daily_jobs: settings.max_daily_jobs,
              services: settings.services,
              string_inventory: settings.string_inventory,
              availability: settings.availability,
              // Include fields needed for profile completeness calculation
              machine_brand: settings.machine_brand,
              machine_model: settings.machine_model,
              machine_type: settings.machine_type,
              supported_racket_types: settings.supported_racket_types,
              max_tension: settings.max_tension,
              dropoff_methods: settings.dropoff_methods,
              flexible_availability: settings.flexible_availability
            },
            rating: {
              stringer_id: profile.id,
              avg_rating: 0, // TODO: Calculate from reviews table
              review_count: 0
            }
          }
        })

        // Calculate distances and apply filters
        const processedData = allStringers
          .map(stringer => ({
            ...stringer,
            distance_km: stringer.lat && stringer.lng ? calculateDistance(
              searchParams.lat,
              searchParams.lng,
              stringer.lat,
              stringer.lng
            ) : 999 // Put stringers without location at the end
          }))
          .filter(stringer => {
            // Must have stringer_settings to be shown
            if (!stringer.stringer_settings) return false

            // Exclude the current user from results
            if (profile && stringer.id === profile.id) {
              console.log('Filtering out current user:', stringer.full_name)
              return false
            }

            // CRITICAL: Only show stringers with at least 80% profile completion
            const profileData = {
              ...stringer,
              ...stringer.stringer_settings
            }
            const completeness = calculateProfileCompleteness(profileData as any)
            if (completeness < 80) {
              console.log(`Filtering out ${stringer.full_name} - profile only ${completeness}% complete`)
              return false
            }

            // Apply search filters
            // Only show stringers with valid location data
            if (!stringer.lat || !stringer.lng || stringer.distance_km! >= 999) return false
            // Apply radius filter
            if (searchParams.radius_km && stringer.distance_km! > searchParams.radius_km) return false
            if (searchParams.min_rating && (!stringer.rating?.avg_rating || stringer.rating.avg_rating < searchParams.min_rating)) return false
            if (searchParams.max_price_cents && stringer.stringer_settings.base_price_cents > searchParams.max_price_cents) return false
            if (searchParams.accepts_rush && !stringer.stringer_settings.accepts_rush) return false
            return true
          })
          .sort((a, b) => a.distance_km! - b.distance_km!)

        console.log('Processed data:', processedData.length, 'stringers')
        console.log('Final stringer names:', processedData.map(s => `${s.full_name} (${s.distance_km?.toFixed(1)}km)`))
        return processedData
      } catch (err) {
        console.error('Error fetching stringers:', err)
        // Return empty array on error - no fallback to fake data
        return []
      }
    },
    enabled: !!searchParams.lat && !!searchParams.lng,
  })

  const handleViewProfile = (stringer: StringerSearchResult) => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true)
      return
    }
    window.location.href = `/stringer/${stringer.id}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Discover Stringers</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
              Find professional tennis stringers near you
            </p>
          </div>

          {isAuthenticated && (
            <Button
              onClick={() => window.location.href = '/my-profile'}
              className="bg-primary hover:bg-primary/90 whitespace-nowrap"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Provide Services</span>
              <span className="sm:hidden">Provide</span>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <FilterBar
            searchParams={searchParams}
            onSearchParamsChange={setSearchParams}
            currentLocation={location}
            onLocationChange={(lat, lng) => {
              setLocation({ lat, lng })
              setSearchParams((prev: SearchStringersParams) => ({ ...prev, lat, lng }))
              setLocationError(false)
            }}
          />
        </div>

        {/* Location Error */}
        {locationError && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="py-8 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Location Required
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                To find stringers near you, please enable location services in your browser or manually enter your location using the location filter above.
              </p>
              <p className="text-sm text-gray-500">
                You can also add your location to your profile in settings.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!locationError && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white rounded-lg h-64 border"></div>
                  </div>
                ))}
              </div>
            ) : stringers.length === 0 ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No stringers found matching your criteria. Try adjusting your filters.</p>
              </CardContent>
            </Card>
            
            {/* Stringer Recruitment Section - Only show to non-stringers */}
            {profile?.role !== 'stringer' && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Are you a tennis stringer?
                  </h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    Join our marketplace and connect with local tennis players who need your stringing services.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/become-stringer'}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join as a Stringer
                  </Button>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>✓ Set your own prices  ✓ Choose your schedule  ✓ Grow your business</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stringers.map((stringer) => (
              <StringerCard
                key={stringer.id}
                stringer={stringer}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Sign In Prompt Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in required</CardTitle>
              <CardDescription>
                Please sign in to view stringer profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Create an account or sign in to connect with local stringers and manage your bookings.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full h-12"
                    onClick={() => window.location.href = '/auth/signup'}
                  >
                    Create Account
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => window.location.href = '/auth/login'}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowSignInPrompt(false)}
                  >
                    Continue Browsing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
