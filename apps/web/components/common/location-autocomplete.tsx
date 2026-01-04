'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { formatCityName } from '@/lib/utils/input-formatters'

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (city: string, lat?: number, lng?: number) => void
  placeholder?: string
  error?: string
  required?: boolean
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'e.g., Baltimore, MD',
  error,
  required = false,
  className = ''
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false)
  const [userIsTyping, setUserIsTyping] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced location suggestions
  useEffect(() => {
    if (inputValue.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Only fetch if user is actively typing
    if (!userIsTyping) {
      return
    }

    setIsLoadingSuggestions(true)

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(inputValue)}&format=json&limit=5&addressdetails=1`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      } catch (error) {
        console.error('Failed to fetch location suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [inputValue, userIsTyping])

  const handleInputChange = (newValue: string) => {
    setUserIsTyping(true)
    setInputValue(newValue)
    onChange(newValue) // Update parent without coordinates until selection
  }

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const { lat, lon, display_name, address } = suggestion

    // Try to extract a clean city name
    let cityName = address?.city || address?.town || address?.village || address?.county

    // If we have a city and state, format nicely
    if (cityName && address?.state) {
      cityName = `${cityName}, ${address.state}`
    } else if (!cityName) {
      // Fallback to first part of display_name
      cityName = display_name.split(',')[0]
    }

    const formattedCity = formatCityName(cityName)

    setUserIsTyping(false)
    setInputValue(formattedCity)
    onChange(formattedCity, parseFloat(lat), parseFloat(lon))
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleUseCurrentLocation = () => {
    setIsLoadingCurrentLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            )
            const data = await response.json()

            let cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county

            if (cityName && data.address?.state) {
              cityName = `${cityName}, ${data.address.state}`
            } else if (!cityName) {
              cityName = data.display_name?.split(',')[0] || 'Current Location'
            }

            const formattedCity = formatCityName(cityName)
            setUserIsTyping(false)
            setInputValue(formattedCity)
            onChange(formattedCity, latitude, longitude)
          } catch (error) {
            console.error('Failed to reverse geocode:', error)
            alert('Failed to get location name. Please try again.')
          }

          setIsLoadingCurrentLocation(false)
        },
        (error) => {
          console.error('Location access denied:', error)
          setIsLoadingCurrentLocation(false)
          alert('Unable to access your location. Please enable location services.')
        }
      )
    } else {
      setIsLoadingCurrentLocation(false)
      alert('Geolocation is not supported by your browser.')
    }
  }

  const handleClear = () => {
    setUserIsTyping(false)
    setInputValue('')
    onChange('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            maxLength={100}
            className={`w-full px-4 py-2 pr-10 border rounded-md shadow-sm focus:ring-primary focus:border-primary ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
          />

          {/* Clear button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Use current location button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLoadingCurrentLocation}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Use current location"
        >
          {isLoadingCurrentLocation ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoadingSuggestions ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.address?.city || suggestion.address?.town || suggestion.display_name.split(',')[0]}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.display_name}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
