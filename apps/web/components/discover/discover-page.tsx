'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { StringerCard } from '@stringr/ui'
import { Button } from '@stringr/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringr/ui'
import { MapPin, Search, Filter, UserPlus } from 'lucide-react'
import type { StringerSearchResult, SearchStringersParams } from '@stringr/types'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'

// Create sample stringers based on user location
function createSampleStringers(userLat: number, userLng: number): StringerSearchResult[] {
  // Default to Baltimore if no location provided
  const baseLat = userLat || 39.2904
  const baseLng = userLng || -76.6122
  
  return [
    {
      id: '1',
      full_name: 'Marco Rodriguez',
      bio: 'Professional tennis stringer with 15+ years experience. Former college player and certified Master Racquet Technician.',
      city: getLocalCity(baseLat, baseLng, 0),
      lat: baseLat + 0.01,
      lng: baseLng + 0.01,
    stringer_settings: {
      id: '1',
      base_price_cents: 2500,
      turnaround_hours: 24,
      accepts_rush: true,
      rush_fee_cents: 800,
      max_daily_jobs: 8,
      services: [
        { name: 'Standard Restring', price_cents: 2500 },
        { name: 'Premium String', price_cents: 3500 },
        { name: 'Hybrid Setup', price_cents: 4000 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '1',
      avg_rating: 4.8,
      review_count: 127
    },
    distance_km: 2.3
  },
    {
      id: '2',
      full_name: 'Sarah Chen',
      bio: 'Tennis coach and certified stringer specializing in high-performance strings. Quick turnaround and competitive pricing.',
      city: getLocalCity(baseLat, baseLng, 1),
      lat: baseLat + 0.05,
      lng: baseLng - 0.03,
    stringer_settings: {
      id: '2',
      base_price_cents: 3000,
      turnaround_hours: 12,
      accepts_rush: true,
      rush_fee_cents: 1000,
      max_daily_jobs: 6,
      services: [
        { name: 'Express Restring', price_cents: 3000 },
        { name: 'Tournament Prep', price_cents: 4500 },
        { name: 'String Consultation', price_cents: 5000 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '2',
      avg_rating: 4.9,
      review_count: 89
    },
    distance_km: 4.7
  },
    {
      id: '3',
      full_name: 'David Thompson',
      bio: 'Budget-friendly stringing service. Great for recreational players. Available weekends and evenings.',
      city: getLocalCity(baseLat, baseLng, 2),
      lat: baseLat - 0.02,
      lng: baseLng + 0.04,
    stringer_settings: {
      id: '3',
      base_price_cents: 2000,
      turnaround_hours: 48,
      accepts_rush: false,
      rush_fee_cents: 0,
      max_daily_jobs: 4,
      services: [
        { name: 'Basic Restring', price_cents: 2000 },
        { name: 'Synthetic Gut', price_cents: 2200 },
        { name: 'Multifilament', price_cents: 2800 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '3',
      avg_rating: 4.3,
      review_count: 45
    },
    distance_km: 8.1
  },
    {
      id: '4',
      full_name: 'Alex Kim',
      bio: 'Former touring pro with expertise in polyester and natural gut strings. Available for consultations.',
      city: getLocalCity(baseLat, baseLng, 3),
      lat: baseLat + 0.08,
      lng: baseLng - 0.05,
    stringer_settings: {
      id: '4',
      base_price_cents: 3500,
      turnaround_hours: 18,
      accepts_rush: true,
      rush_fee_cents: 1200,
      max_daily_jobs: 5,
      services: [
        { name: 'Pro Restring', price_cents: 3500 },
        { name: 'Natural Gut Setup', price_cents: 5500 },
        { name: 'Custom Tension', price_cents: 4000 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '4',
      avg_rating: 4.7,
      review_count: 63
    },
    distance_km: 12.5
  },
    {
      id: '5',
      full_name: 'Lisa Martinez',
      bio: 'Mobile stringing service - I come to you! Specialized in junior and beginner setups.',
      city: getLocalCity(baseLat, baseLng, 4),
      lat: baseLat - 0.04,
      lng: baseLng - 0.02,
    stringer_settings: {
      id: '5',
      base_price_cents: 2800,
      turnaround_hours: 6,
      accepts_rush: true,
      rush_fee_cents: 500,
      max_daily_jobs: 10,
      services: [
        { name: 'Mobile Service', price_cents: 2800 },
        { name: 'Junior Setup', price_cents: 2300 },
        { name: 'Beginner Special', price_cents: 2000 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '5',
      avg_rating: 4.6,
      review_count: 92
    },
    distance_km: 15.2
  },
    {
      id: '6',
      full_name: 'Mike Johnson',
      bio: 'Tennis shop owner with 20+ years experience. Full service including grip replacement and racquet maintenance.',
      city: getLocalCity(baseLat, baseLng, 5),
      lat: baseLat + 0.03,
      lng: baseLng + 0.06,
    stringer_settings: {
      id: '6',
      base_price_cents: 2700,
      turnaround_hours: 36,
      accepts_rush: true,
      rush_fee_cents: 700,
      max_daily_jobs: 12,
      services: [
        { name: 'Shop Service', price_cents: 2700 },
        { name: 'Grip + String', price_cents: 3200 },
        { name: 'Full Service', price_cents: 4500 }
      ],
      availability: []
    },
    rating: {
      stringer_id: '6',
      avg_rating: 4.5,
      review_count: 156
    },
    distance_km: 5.9
    }
  ]
}

// Get local city names based on location
function getLocalCity(lat: number, lng: number, index: number): string {
  // Baltimore area (you can expand this for other cities)
  if (lat > 39.0 && lat < 39.6 && lng > -77.0 && lng < -76.0) {
    const baltimoreCities = ['Baltimore', 'Towson', 'Columbia', 'Annapolis', 'Rockville', 'Silver Spring']
    return baltimoreCities[index] || 'Baltimore'
  }
  
  // San Francisco Bay Area
  if (lat > 37.0 && lat < 38.0 && lng > -123.0 && lng < -121.0) {
    const bayCities = ['Palo Alto', 'Mountain View', 'Sunnyvale', 'Redwood City', 'San Mateo', 'Los Altos']
    return bayCities[index] || 'San Francisco'
  }
  
  // Default fallback
  const defaultCities = ['Downtown', 'Midtown', 'Uptown', 'Eastside', 'Westside', 'Northside']
  return defaultCities[index] || 'Local Area'
}

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
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchParams, setSearchParams] = useState<SearchStringersParams>({
    lat: 39.2904, // Default to Baltimore
    lng: -76.6122,
    radius_km: 25
  })
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)

  const supabase = createClient()

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setSearchParams(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }))
        },
        (error) => {
          console.log('Location access denied:', error)
          // Use default location (Palo Alto)
        }
      )
    }
  }, [])

  // Fetch stringers from database with fallback to sample data
  const { data: stringers = [], isLoading, error } = useQuery({
    queryKey: ['stringers', searchParams, profile?.id, profile?.full_name],
    queryFn: async () => {
      try {
        console.log('Fetching stringers from database...')
        console.log('Current profile:', profile?.full_name, 'ID:', profile?.id)

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

        // Get sample data for fallback
        const sampleData = createSampleStringers(searchParams.lat, searchParams.lng)

        // Combine database stringers with sample data
        const allStringers = [
          // Map database stringers to StringerSearchResult format
          ...(dbStringers || []).map(settings => {
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
                availability: settings.availability
              },
              rating: {
                stringer_id: profile.id,
                avg_rating: 0, // No rating for new users
                review_count: 0
              }
            }
          }),
          // Add sample data
          ...sampleData
        ]

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
            if (profile) {
              // Match by ID (for real users from database)
              if (stringer.id === profile.id) {
                console.log('Filtering out by ID:', stringer.full_name)
                return false
              }
              // Match by full name (for demo data)
              if (stringer.full_name && profile.full_name &&
                  stringer.full_name.toLowerCase() === profile.full_name.toLowerCase()) {
                console.log('Filtering out by name:', stringer.full_name, 'matches', profile.full_name)
                return false
              }
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
      } catch (error) {
        console.error('Error fetching stringers, falling back to sample data:', error)
        // Fallback to sample data only
        const sampleData = createSampleStringers(searchParams.lat, searchParams.lng)
        return sampleData.map(stringer => ({
          ...stringer,
          distance_km: calculateDistance(
            searchParams.lat,
            searchParams.lng,
            stringer.lat!,
            stringer.lng!
          )
        })).sort((a, b) => a.distance_km! - b.distance_km!)
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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search & Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radius
                </label>
                <select
                  value={searchParams.radius_km || 25}
                  onChange={(e) => setSearchParams(prev => ({
                    ...prev,
                    radius_km: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price
                </label>
                <select
                  value={searchParams.max_price_cents || ''}
                  onChange={(e) => setSearchParams(prev => ({
                    ...prev,
                    max_price_cents: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Any price</option>
                  <option value={2000}>Under $20</option>
                  <option value={2500}>Under $25</option>
                  <option value={3000}>Under $30</option>
                  <option value={4000}>Under $40</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Rating
                </label>
                <select
                  value={searchParams.min_rating || ''}
                  onChange={(e) => setSearchParams(prev => ({
                    ...prev,
                    min_rating: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Any rating</option>
                  <option value={3}>3+ stars</option>
                  <option value={4}>4+ stars</option>
                  <option value={4.5}>4.5+ stars</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={searchParams.accepts_rush || false}
                    onChange={(e) => setSearchParams(prev => ({
                      ...prev,
                      accepts_rush: e.target.checked || undefined
                    }))}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Rush available</span>
                </label>
              </div>
            </div>

            {location && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>
                  Searching near {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
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
            
            {/* Stringer Recruitment Section */}
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
