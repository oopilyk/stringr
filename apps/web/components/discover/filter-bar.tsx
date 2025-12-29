'use client'

import { useState, useEffect } from 'react'
import { Button } from '@stringr/ui'
import { MapPin, DollarSign, Star, Clock, Zap, X, ChevronDown } from 'lucide-react'
import type { SearchStringersParams } from '@stringr/types'

interface FilterBarProps {
  searchParams: SearchStringersParams
  onSearchParamsChange: (params: SearchStringersParams) => void
  currentLocation?: { lat: number; lng: number } | null
  onLocationChange?: (lat: number, lng: number) => void
}

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

export function FilterBar({ searchParams, onSearchParamsChange, currentLocation, onLocationChange }: FilterBarProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [tempLocationInput, setTempLocationInput] = useState('')
  // Convert km to miles for display (radius_km is in kilometers, slider should show miles)
  const [tempDistance, setTempDistance] = useState(
    searchParams.radius_km ? Math.round(searchParams.radius_km / 1.60934) : 125
  )
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationLabel, setLocationLabel] = useState<string>('Set Location')
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  const hasActiveFilters = Boolean(
    searchParams.max_price_cents ||
    searchParams.min_rating ||
    searchParams.accepts_rush ||
    searchParams.radius_km // Any radius filter is considered active
  )

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          onLocationChange?.(latitude, longitude)

          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            )
            const data = await response.json()
            const city = data.address?.city || data.address?.town || data.address?.county || 'Current Location'
            setLocationLabel(city)
          } catch (error) {
            console.error('Failed to reverse geocode:', error)
            setLocationLabel('Current Location')
          }

          setIsLoadingLocation(false)
          setActiveModal(null)
        },
        (error) => {
          console.error('Location access denied:', error)
          setIsLoadingLocation(false)
          alert('Unable to access your location. Please enable location services.')
        }
      )
    }
  }

  // Debounced location suggestions
  useEffect(() => {
    if (tempLocationInput.trim().length < 3) {
      setLocationSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tempLocationInput)}&format=json&limit=5&addressdetails=1`
        )
        const data = await response.json()
        setLocationSuggestions(data)
      } catch (error) {
        console.error('Failed to fetch location suggestions:', error)
        setLocationSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [tempLocationInput])

  // Fetch location suggestions as user types
  const handleLocationInputChange = (value: string) => {
    setTempLocationInput(value)
  }

  // Handle clicking on a suggestion
  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const { lat, lon, display_name } = suggestion
    onLocationChange?.(parseFloat(lat), parseFloat(lon))
    // Extract city name from display_name (usually first part before comma)
    const cityName = display_name.split(',')[0]
    setLocationLabel(cityName || display_name)
    setActiveModal(null)
    setTempLocationInput('')
    setLocationSuggestions([])
  }

  const handleLocationSearch = async () => {
    if (!tempLocationInput.trim()) return

    // If there are suggestions, select the first one
    if (locationSuggestions.length > 0) {
      handleSelectSuggestion(locationSuggestions[0])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tempLocationInput)}&format=json&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        handleSelectSuggestion(data[0])
      } else {
        alert('Location not found. Please try a different search.')
      }
    } catch (error) {
      console.error('Failed to geocode location:', error)
      alert('Failed to search location. Please try again.')
    }
  }

  const handleDistanceApply = () => {
    // Convert miles to km (tempDistance is in miles, need to store as km)
    onSearchParamsChange({
      ...searchParams,
      radius_km: tempDistance * 1.60934
    })
    setActiveModal(null)
  }

  const handlePriceApply = (maxPrice: number | undefined) => {
    onSearchParamsChange({
      ...searchParams,
      max_price_cents: maxPrice
    })
    setActiveModal(null)
  }

  const handleRatingApply = (minRating: number | undefined) => {
    onSearchParamsChange({
      ...searchParams,
      min_rating: minRating
    })
    setActiveModal(null)
  }

  const handleRushToggle = () => {
    onSearchParamsChange({
      ...searchParams,
      accepts_rush: !searchParams.accepts_rush
    })
  }

  const clearAllFilters = () => {
    onSearchParamsChange({
      lat: searchParams.lat,
      lng: searchParams.lng,
      radius_km: undefined
    })
  }

  const getLocationLabel = () => {
    return locationLabel
  }

  const getDistanceLabel = () => {
    const distanceInMiles = searchParams.radius_km ? Math.round(searchParams.radius_km / 1.60934) : 125
    return `${distanceInMiles}mi`
  }

  const getPriceLabel = () => {
    if (!searchParams.max_price_cents) return 'Price'
    return `< $${(searchParams.max_price_cents / 100).toFixed(0)}`
  }

  const getRatingLabel = () => {
    if (!searchParams.min_rating) return 'Rating'
    return `${searchParams.min_rating}+ ★`
  }

  return (
    <div className="relative">
      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Location Filter */}
        <button
          onClick={() => setActiveModal(activeModal === 'location' ? null : 'location')}
          className={`
            px-4 py-2 rounded-full border-2 font-medium transition-all
            ${currentLocation ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}
          `}
        >
          <MapPin className="w-4 h-4 inline mr-1" />
          {getLocationLabel()}
          <ChevronDown className="w-4 h-4 inline ml-1" />
        </button>

        {/* Distance Filter */}
        <button
          onClick={() => setActiveModal(activeModal === 'distance' ? null : 'distance')}
          className={`
            px-4 py-2 rounded-full border-2 font-medium transition-all
            ${searchParams.radius_km ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}
          `}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          {getDistanceLabel()}
          <ChevronDown className="w-4 h-4 inline ml-1" />
        </button>

        {/* Price Filter */}
        <button
          onClick={() => setActiveModal(activeModal === 'price' ? null : 'price')}
          className={`
            px-4 py-2 rounded-full border-2 font-medium transition-all
            ${searchParams.max_price_cents ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}
          `}
        >
          <DollarSign className="w-4 h-4 inline mr-1" />
          {getPriceLabel()}
          <ChevronDown className="w-4 h-4 inline ml-1" />
        </button>

        {/* Rating Filter */}
        <button
          onClick={() => setActiveModal(activeModal === 'rating' ? null : 'rating')}
          className={`
            px-4 py-2 rounded-full border-2 font-medium transition-all
            ${searchParams.min_rating ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}
          `}
        >
          <Star className="w-4 h-4 inline mr-1" />
          {getRatingLabel()}
          <ChevronDown className="w-4 h-4 inline ml-1" />
        </button>

        {/* Rush Available Toggle */}
        <button
          onClick={handleRushToggle}
          className={`
            px-4 py-2 rounded-full border-2 font-medium transition-all
            ${searchParams.accepts_rush ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}
          `}
        >
          <Zap className="w-4 h-4 inline mr-1" />
          Rush
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-full border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'location' && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Location</h3>
            <button onClick={() => setActiveModal(null)}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={tempLocationInput}
                onChange={(e) => handleLocationInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                placeholder="City, State, Country, Zip code..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
              />

              {/* Suggestions dropdown */}
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {suggestion.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isLoadingSuggestions && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <MapPin className="w-5 h-5" />
              <span>{isLoadingLocation ? 'Getting location...' : 'Use Current Location'}</span>
            </button>
          </div>
        </div>
      )}

      {activeModal === 'distance' && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Distance</h3>
            <button onClick={() => setActiveModal(null)}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{tempDistance}mi</div>
            </div>

            <input
              type="range"
              min="10"
              max="125"
              step="5"
              value={tempDistance}
              onChange={(e) => setTempDistance(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <div className="flex justify-between text-sm text-gray-600">
              <span>10mi</span>
              <span>25mi</span>
              <span>50mi</span>
              <span>75mi</span>
              <span>100mi</span>
              <span>125mi</span>
            </div>

            <button
              onClick={handleDistanceApply}
              className="w-full bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
            >
              APPLY
            </button>
          </div>
        </div>
      )}

      {activeModal === 'price' && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-xs bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Max Price</h3>
            <button onClick={() => setActiveModal(null)}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handlePriceApply(undefined)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Any price
            </button>
            <button
              onClick={() => handlePriceApply(2000)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Under $20
            </button>
            <button
              onClick={() => handlePriceApply(2500)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Under $25
            </button>
            <button
              onClick={() => handlePriceApply(3000)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Under $30
            </button>
            <button
              onClick={() => handlePriceApply(4000)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Under $40
            </button>
          </div>
        </div>
      )}

      {activeModal === 'rating' && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-xs bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Min Rating</h3>
            <button onClick={() => setActiveModal(null)}>
              <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleRatingApply(undefined)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              Any rating
            </button>
            <button
              onClick={() => handleRatingApply(3)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              3+ stars ★★★
            </button>
            <button
              onClick={() => handleRatingApply(4)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              4+ stars ★★★★
            </button>
            <button
              onClick={() => handleRatingApply(4.5)}
              className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 transition-colors"
            >
              4.5+ stars ★★★★★
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
