'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SearchLocationContextType {
  searchLocation: { lat: number; lng: number } | null
  setSearchLocation: (location: { lat: number; lng: number } | null) => void
}

const SearchLocationContext = createContext<SearchLocationContextType | undefined>(undefined)

export function SearchLocationProvider({ children }: { children: ReactNode }) {
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null)

  return (
    <SearchLocationContext.Provider value={{ searchLocation, setSearchLocation }}>
      {children}
    </SearchLocationContext.Provider>
  )
}

export function useSearchLocation() {
  const context = useContext(SearchLocationContext)
  if (context === undefined) {
    throw new Error('useSearchLocation must be used within a SearchLocationProvider')
  }
  return context
}
