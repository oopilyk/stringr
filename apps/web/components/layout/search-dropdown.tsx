'use client'

import { useState, useEffect } from 'react'
import { User, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSearchLocation } from '@/lib/contexts/search-location-context'
import { formatDistance } from '@stringerly/ui'
import type { StringerSearchResult } from '@stringerly/types'

interface SearchDropdownProps {
  onClose: () => void
  searchQuery: string
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


export function SearchDropdown({ onClose, searchQuery }: SearchDropdownProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const { searchLocation } = useSearchLocation()
  const [searchResults, setSearchResults] = useState<StringerSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const searchProfiles = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)

      try {
        // Search for all profiles by name
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('full_name', `%${searchQuery}%`)
          .limit(10)

        if (profilesError) {
          console.error('Search error:', profilesError)
        }

        if (!profiles || profiles.length === 0) {
          setSearchResults([])
          setIsSearching(false)
          return
        }

        // Fetch stringer settings for these profiles
        const profileIds = profiles.map(p => p.id)
        const { data: stringerSettings } = await supabase
          .from('stringer_settings')
          .select('*')
          .in('id', profileIds)
          .not('onboarding_completed_at', 'is', null)

        // Transform database results
        const results = profiles.map(profileData => {
          // Find stringer settings if exists
          const settings = stringerSettings?.find(s => s.id === profileData.id)

          // Calculate distance using search location (filter location) or fallback to profile location
          let distance = 999
          const refLat = searchLocation?.lat ?? profile?.lat
          const refLng = searchLocation?.lng ?? profile?.lng

          if (refLat && refLng && profileData.lat && profileData.lng) {
            distance = calculateDistance(refLat, refLng, profileData.lat, profileData.lng)
          }

          return {
            ...profileData,
            is_stringer: !!settings,
            stringer_settings: settings ? {
              id: settings.id,
              base_price_cents: settings.base_price_cents,
              turnaround_hours: settings.turnaround_hours,
              accepts_rush: settings.accepts_rush,
              rush_fee_cents: settings.rush_fee_cents,
              max_daily_jobs: settings.max_daily_jobs,
              services: settings.services,
              string_inventory: settings.string_inventory,
              availability: settings.availability
            } : undefined,
            rating: {
              stringer_id: profileData.id,
              avg_rating: 0,
              review_count: 0
            },
            distance_km: distance
          } as StringerSearchResult & { is_stringer: boolean }
        })

        // Sort by: stringers first, then by distance
        results.sort((a, b) => {
          if (a.is_stringer && !b.is_stringer) return -1
          if (!a.is_stringer && b.is_stringer) return 1
          return (a.distance_km || 999) - (b.distance_km || 999)
        })

        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search - wait 300ms after user stops typing
    const timeoutId = setTimeout(searchProfiles, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, profile, supabase, searchLocation])

  // Show search results if there's a query
  if (searchQuery && searchQuery.trim().length >= 2) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
        <div className="p-4">
          {isSearching ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide px-2">
                  PEOPLE {searchResults.length > 0 && (
                    <Link
                      href={`/discover?search=${encodeURIComponent(searchQuery)}`}
                      className="text-primary hover:underline text-xs normal-case float-right"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTimeout(() => onClose(), 100)
                      }}
                    >
                      SEE ALL →
                    </Link>
                  )}
                </h3>
              </div>
              <div className="space-y-1">
                {searchResults.slice(0, 5).map((person) => (
                  <a
                    key={person.id}
                    href={`/stringer/${person.id}`}
                    className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 rounded-md transition-colors group cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/stringer/${person.id}`)
                      onClose()
                    }}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={person.avatar_url || '/default-avatar.png'}
                        alt={person.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900 group-hover:text-primary truncate">
                          {person.full_name}
                        </p>
                        {(person as any).is_stringer ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Stringer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Player
                          </span>
                        )}
                        {person.rating && person.rating.avg_rating > 0 && (
                          <span className="text-xs text-gray-500">
                            ⭐ {person.rating.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {person.city && <span>{person.city}</span>}
                        {person.distance_km !== undefined && person.distance_km < 999 && (
                          <>
                            <span>•</span>
                            <span>{formatDistance(person.distance_km)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No people found matching "{searchQuery}"</p>
              <p className="text-xs mt-1">Try searching for a different name</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show default menu when no search query
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="p-4">
        {/* Quick Links Section */}
        <div className="space-y-1">
          <Link
            href="/discover"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={(e) => {
              e.stopPropagation()
              setTimeout(() => onClose(), 100)
            }}
          >
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Stringers</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/players"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={(e) => {
              e.stopPropagation()
              setTimeout(() => onClose(), 100)
            }}
          >
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Players</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={(e) => {
              e.stopPropagation()
              setTimeout(() => onClose(), 100)
            }}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">My Requests</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
