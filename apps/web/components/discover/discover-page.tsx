'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { StringerCard } from '@rally-strings/ui'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { MapPin, Search, Filter } from 'lucide-react'
import type { StringerSearchResult, SearchStringersParams } from '@rally-strings/types'
import { CreateRequestDialog } from '@/components/requests/create-request-dialog'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'

export function DiscoverPage() {
  const { profile } = useAuth()
  const [selectedStringer, setSelectedStringer] = useState<StringerSearchResult | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchParams, setSearchParams] = useState<SearchStringersParams>({
    lat: 37.4419, // Default to Palo Alto
    lng: -122.1430,
    radius_km: 25
  })
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)

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

  // Fetch stringers
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

      const { data, error } = await supabase.functions.invoke('search-stringers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (error) throw error
      return data.stringers as StringerSearchResult[]
    },
    enabled: !!searchParams.lat && !!searchParams.lng,
  })

  const handleStringerSelect = (stringer: StringerSearchResult) => {
    setSelectedStringer(stringer)
    setIsRequestDialogOpen(true)
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover Stringers</h1>
          <p className="mt-2 text-gray-600">
            Find local tennis stringers near you
          </p>
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
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-600">Error loading stringers. Please try again.</p>
            </CardContent>
          </Card>
        ) : stringers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No stringers found in your area. Try expanding your search radius.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stringers.map((stringer) => (
              <StringerCard
                key={stringer.id}
                stringer={stringer}
                onSelect={handleStringerSelect}
              />
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
