'use client'

import { useState, useEffect } from 'react'
import { Search, User, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSearchLocation } from '@/lib/contexts/search-location-context'
import type { StringerSearchResult } from '@stringr/types'

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

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}


export function SearchDropdown({ onClose, searchQuery }: SearchDropdownProps) {
  const { profile } = useAuth()
  const { searchLocation } = useSearchLocation()
  const [searchResults, setSearchResults] = useState<StringerSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const searchStringers = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)

      try {
        // Search for stringers by name in database
        const { data: dbStringers, error } = await supabase
          .from('stringer_settings')
          .select(`
            *,
            profiles!inner (*)
          `)
          .not('onboarding_completed_at', 'is', null)
          .ilike('profiles.full_name', `%${searchQuery}%`)

        if (error) {
          console.error('Search error:', error)
        }

        // Transform database results
        const results = (dbStringers || []).map(settings => {
          const profileData = Array.isArray(settings.profiles) ? settings.profiles[0] : settings.profiles

          // Calculate distance using search location (filter location) or fallback to profile location
          let distance = 999
          const refLat = searchLocation?.lat ?? profile?.lat
          const refLng = searchLocation?.lng ?? profile?.lng

          if (refLat && refLng && profileData.lat && profileData.lng) {
            distance = calculateDistance(refLat, refLng, profileData.lat, profileData.lng)
          }

          return {
            ...profileData,
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
              stringer_id: profileData.id,
              avg_rating: 0,
              review_count: 0
            },
            distance_km: distance
          } as StringerSearchResult
        })

        // Sort by distance (closest first)
        results.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999))

        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search - wait 300ms after user stops typing
    const timeoutId = setTimeout(searchStringers, 300)
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
                  STRINGERS {searchResults.length > 0 && (
                    <Link
                      href={`/discover?search=${encodeURIComponent(searchQuery)}`}
                      className="text-primary hover:underline text-xs normal-case float-right"
                      onClick={onClose}
                    >
                      SEE ALL →
                    </Link>
                  )}
                </h3>
              </div>
              <div className="space-y-1">
                {searchResults.slice(0, 5).map((stringer) => (
                  <Link
                    key={stringer.id}
                    href={`/stringer/${stringer.id}`}
                    className="flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 rounded-md transition-colors group"
                    onClick={onClose}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {stringer.avatar_url ? (
                        <img
                          src={stringer.avatar_url}
                          alt={stringer.full_name || 'Stringer'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-primary">
                          {stringer.full_name?.[0] || 'S'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900 group-hover:text-primary truncate">
                          {stringer.full_name}
                        </p>
                        {stringer.rating && stringer.rating.avg_rating > 0 && (
                          <span className="text-xs text-gray-500">
                            ⭐ {stringer.rating.avg_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {stringer.city && <span>{stringer.city}</span>}
                        {stringer.distance_km !== undefined && stringer.distance_km < 999 && (
                          <>
                            <span>•</span>
                            <span>{formatDistance(stringer.distance_km)}</span>
                          </>
                        )}
                        {stringer.years_experience && (
                          <>
                            <span>•</span>
                            <span>{stringer.years_experience}+ years</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No stringers found matching "{searchQuery}"</p>
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
        <div className="mb-4">
          <Link
            href="/discover"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={onClose}
          >
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Stringers</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={onClose}
          >
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">My Requests</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/messages"
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-md transition-colors group"
            onClick={onClose}
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              <span className="font-medium text-gray-700 group-hover:text-gray-900">Nearby Stringers</span>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* Categories Section */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🎾</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">TENNIS</span>
              </div>

              <Link
                href="/discover?service=restring"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Restring services
              </Link>
              <Link
                href="/discover?rush=true"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Rush services
              </Link>
              <Link
                href="/discover?rating=4.5"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Top rated stringers
              </Link>
              <Link
                href="/my-profile"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                My profile
              </Link>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 px-4 py-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🏓</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">SERVICES</span>
              </div>

              <Link
                href="/discover?price=low"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Budget friendly
              </Link>
              <Link
                href="/discover?experience=high"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Certified stringers
              </Link>
              <Link
                href="/discover?turnaround=fast"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Same day service
              </Link>
              <Link
                href="/settings"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md text-sm"
                onClick={onClose}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
