'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient, supabaseUrl, supabaseAnonKey } from '@/lib/supabase'
import { StringerCard } from '@rally-strings/ui'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { MapPin, Search, Filter, UserPlus } from 'lucide-react'
import type { StringerSearchResult, SearchStringersParams } from '@rally-strings/types'
import { CreateRequestDialog } from '@/components/requests/create-request-dialog'
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

export function DiscoverPage() {
  const { profile } = useAuth()
  const [selectedStringer, setSelectedStringer] = useState<StringerSearchResult | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'granted' | 'denied' | 'error'>('detecting')
  const [searchParams, setSearchParams] = useState<SearchStringersParams>({
    lat: 39.2904, // Default to Baltimore (where sample data is located)
    lng: -76.6122,
    radius_km: 25
  })
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)

  const supabase = createClient()

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('detecting')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ Location detected:', latitude, longitude)
          setLocation({ lat: latitude, lng: longitude })
          setLocationStatus('granted')
          setSearchParams(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }))
        },
        (error) => {
          console.log('❌ Location access failed:', error.message, 'Code:', error.code)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
          // Keep using default location (Baltimore) where sample data exists
          setLocation({ lat: 39.2904, lng: -76.6122 })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      console.log('❌ Geolocation not supported by browser')
      setLocationStatus('error')
      setLocation({ lat: 39.2904, lng: -76.6122 })
    }
  }, [])

  // Fetch stringers from API
  const { data: stringers = [], isLoading, error } = useQuery({
    queryKey: ['stringers', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: searchParams.lat.toString(),
        lng: searchParams.lng.toString(),
        radius_km: (searchParams.radius_km || 25).toString(),
      })

      if (searchParams.min_rating) {
        params.append('min_rating', searchParams.min_rating.toString())
      }
      if (searchParams.max_price_cents) {
        params.append('max_price_cents', searchParams.max_price_cents.toString())
      }
      if (searchParams.accepts_rush) {
        params.append('accepts_rush', 'true')
      }

      // Get current session for auth
      const session = await supabase.auth.getSession()
      const accessToken = session.data.session?.access_token
      
      if (!accessToken) {
        console.log('No access token available')
        throw new Error('Authentication required')
      }

      // Call the API with proper authentication
      const functionUrl = `${supabaseUrl}/functions/v1/search-stringers?${params.toString()}`
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error:', response.status, response.statusText, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error('API error:', data.error)
        throw new Error(data.error)
      }
      
      console.log('API returned:', data.stringers?.length || 0, 'stringers')
      return data.stringers as StringerSearchResult[] || []
    },
    enabled: !!searchParams.lat && !!searchParams.lng,
    retry: 1, // Retry once on failure
  })

  const handleStringerSelect = (stringer: StringerSearchResult) => {
    setSelectedStringer(stringer)
    setIsRequestDialogOpen(true)
  }

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('detecting')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('✅ Manual location request - Location detected:', latitude, longitude)
          setLocation({ lat: latitude, lng: longitude })
          setLocationStatus('granted')
          setSearchParams(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude
          }))
        },
        (error) => {
          console.log('❌ Manual location request failed:', error.message, 'Code:', error.code)
          setLocationStatus(error.code === 1 ? 'denied' : 'error')
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // Force fresh location
        }
      )
    }
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Stringers</h1>
              <p className="mt-2 text-gray-600">
                Find local tennis stringers near you
              </p>
            </div>
            
            {/* Show "Provide Services" for all users */}
            <div className="text-right">
              <Button
                onClick={() => window.location.href = '/my-profile'}
                variant="outline"
                className="bg-primary/5 border-primary/20 hover:bg-primary/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Provide Services
              </Button>
              <p className="text-xs text-gray-500 mt-1">List your services</p>
            </div>
          </div>
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

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="w-4 h-4" />
                {locationStatus === 'detecting' ? (
                  <span className="text-blue-600">🔍 Detecting your location...</span>
                ) : locationStatus === 'granted' ? (
                  <span className="text-green-600">
                    📍 Using your location ({location?.lat.toFixed(3)}, {location?.lng.toFixed(3)})
                  </span>
                ) : locationStatus === 'denied' ? (
                  <span className="text-orange-600">📍 Location access denied - using default location</span>
                ) : (
                  <span className="text-gray-600">📍 Using default location (Baltimore)</span>
                )}
              </div>
              {locationStatus !== 'granted' && locationStatus !== 'detecting' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestLocation}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Use My Location
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-80 animate-pulse">
                <div className="bg-white rounded-lg h-64 border"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600 mb-2">Unable to load stringers at this time.</p>
              <p className="text-gray-500 text-sm">Please try again or contact support if the problem persists.</p>
            </CardContent>
          </Card>
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
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {stringers.map((stringer) => (
              <div key={stringer.id} className="flex-shrink-0 w-80">
                <StringerCard
                  stringer={stringer}
                  onSelect={handleStringerSelect}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Request Dialog */}
      {selectedStringer && (
        <CreateRequestDialog
          stringer={selectedStringer}
          isOpen={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onSuccess={() => {
            setIsRequestDialogOpen(false)
            setSelectedStringer(null)
          }}
        />
      )}
    </div>
  )
}
