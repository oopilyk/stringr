'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Card, CardContent } from '@stringr/ui'
import { User } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { useRouter } from 'next/navigation'

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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

interface Player {
  id: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  lat: number | null
  lng: number | null
  bio: string | null
  distance_km?: number
}

interface PlayersPageProps {
  isAuthenticated?: boolean
}

export function PlayersPage({ isAuthenticated = false }: PlayersPageProps) {
  const { profile } = useAuth()
  const router = useRouter()
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState(false)

  const supabase = createClient()

  // Get user's location - try browser first, then fall back to profile
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLocationError(false)
        },
        (error) => {
          console.log('Browser location access denied:', error)
          if (profile?.lat != null && profile?.lng != null) {
            setLocation({ lat: profile.lat, lng: profile.lng })
            setLocationError(false)
          } else {
            setLocationError(true)
          }
        }
      )
    } else {
      if (profile?.lat != null && profile?.lng != null) {
        setLocation({ lat: profile.lat, lng: profile.lng })
        setLocationError(false)
      } else {
        setLocationError(true)
      }
    }
  }, [profile?.lat, profile?.lng])

  // Fetch players (non-stringers) from database
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', location?.lat, location?.lng, profile?.id],
    queryFn: async () => {
      try {
        console.log('Fetching players from database...')

        // Fetch all profiles
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')

        if (profilesError) {
          console.error('Database error:', profilesError)
          throw profilesError
        }

        // Fetch all stringer settings to identify stringers
        const { data: stringerSettings, error: settingsError } = await supabase
          .from('stringer_settings')
          .select('id')
          .not('onboarding_completed_at', 'is', null)

        if (settingsError) {
          console.error('Settings error:', settingsError)
          throw settingsError
        }

        const stringerIds = new Set(stringerSettings?.map(s => s.id) || [])

        // Filter to get only players (profiles without completed stringer settings)
        const playerProfiles = allProfiles?.filter(p => !stringerIds.has(p.id)) || []

        console.log('Found', playerProfiles.length, 'players')

        // Calculate distances and filter
        const playersWithDistance = playerProfiles
          .map(player => ({
            ...player,
            distance_km: player.lat && player.lng && location ? calculateDistance(
              location.lat,
              location.lng,
              player.lat,
              player.lng
            ) : 999
          }))
          .filter(player => {
            // Exclude the current user
            if (profile && player.id === profile.id) return false
            // Only show players with valid location data
            if (!player.lat || !player.lng || player.distance_km >= 999) return false
            return true
          })
          .sort((a, b) => a.distance_km - b.distance_km)

        console.log('Processed', playersWithDistance.length, 'players with location')
        return playersWithDistance
      } catch (err) {
        console.error('Error fetching players:', err)
        return []
      }
    },
    enabled: !!location,
  })

  const handleViewProfile = (player: Player) => {
    router.push(`/stringer/${player.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Players Near You</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Connect with tennis players in your area
          </p>
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
                To find players near you, please enable location services in your browser.
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
                    <div className="bg-white rounded-lg h-48 border"></div>
                  </div>
                ))}
              </div>
            ) : players.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No players found near you.</p>
                  <p className="text-sm text-gray-400">Try checking back later as more users join the platform.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {players.map((player) => (
                  <Card
                    key={player.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewProfile(player)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt={player.full_name || 'Player'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-semibold text-primary">
                              {player.full_name?.[0] || 'P'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {player.full_name || 'Anonymous Player'}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            {player.city && <span>{player.city}</span>}
                            {player.distance_km !== undefined && player.distance_km < 999 && (
                              <>
                                <span>•</span>
                                <span>{formatDistance(player.distance_km)}</span>
                              </>
                            )}
                          </div>
                          {player.bio && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {player.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
