'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@stringerly/ui'
import { MessageSquare, Settings, Search, Menu, X } from 'lucide-react'
import { SearchDropdown } from './search-dropdown'

export function Navigation() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Check if user is a stringer and fetch pending requests count
  const { data: stringerSettings } = useQuery({
    queryKey: ['stringer-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', user.id)
        .single()
      return data
    },
    enabled: !!user?.id,
  })

  const isStringer = !!stringerSettings

  // Fetch unviewed pending requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ['pending-requests-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('stringer_id', user.id)
        .eq('status', 'pending')
        .is('viewed_at', null)
      return count || 0
    },
    enabled: !!user?.id && isStringer,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery)
    setIsSearchFocused(false)
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (searchRef.current && !searchRef.current.contains(target)) {
        // Only close if we're not clicking on a link or navigation element
        const isNavigationClick = (event.target as HTMLElement).closest('a')
        if (!isNavigationClick) {
          setIsSearchFocused(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="relative z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={profile ? "/discover" : "/"} className="flex items-center space-x-3 flex-shrink-0">
            <img
              src="/racket-logo.png"
              alt="Stringerly Logo"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <span className="text-2xl font-bold text-primary hidden sm:inline">STRINGERLY</span>
          </Link>

          {/* Desktop Navigation - Left Side Links */}
          <div className="hidden lg:flex items-center space-x-1 ml-8">
            {profile && (
              <>
                <Link
                  href="/discover"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Discover
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors relative"
                >
                  Dashboard
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Desktop Search Bar - Centered */}
          {profile && (
            <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-xl mx-auto relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
              </form>

              {/* Search Dropdown */}
              {isSearchFocused && (
                <SearchDropdown onClose={() => setIsSearchFocused(false)} searchQuery={searchQuery} />
              )}
            </div>
          )}

          {/* Desktop Right Side - Icons & Profile */}
          <div className="hidden md:flex items-center space-x-2">
            {profile ? (
              <>
                {/* Messages Icon with Tooltip */}
                <div className="relative group">
                  <button
                    onClick={() => router.push('/messages')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MessageSquare className="w-6 h-6" />
                  </button>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Messages
                  </div>
                </div>

                {/* Settings Icon with Tooltip */}
                <div className="relative group">
                  <button
                    onClick={() => router.push('/settings')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Settings
                  </div>
                </div>

                {/* User Profile Avatar with Tooltip */}
                <div className="relative group ml-2">
                  <Link
                    href="/my-profile"
                    className="flex items-center hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      <img
                        src={profile.avatar_url || '/default-avatar.png'}
                        alt={profile.full_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    My Profile
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/auth/signin')}
                >
                  Log In
                </Button>
                <Button
                  onClick={() => router.push('/auth/signup')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile Search Bar */}
        {profile && (
          <div ref={searchRef} className="md:hidden pb-3 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                />
              </div>
            </form>

            {/* Mobile Search Dropdown */}
            {isSearchFocused && (
              <SearchDropdown onClose={() => setIsSearchFocused(false)} searchQuery={searchQuery} />
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            {profile ? (
              <>
                {/* User Profile Section */}
                <Link
                  href="/my-profile"
                  className="flex items-center space-x-3 px-3 py-3 bg-gray-50 rounded-lg mb-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    <img
                      src={profile.avatar_url || '/default-avatar.png'}
                      alt={profile.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile.full_name || 'User'}</p>
                    <p className="text-sm text-gray-500">{profile.city || 'Location not set'}</p>
                  </div>
                </Link>

                {/* Navigation Links */}
                <Link
                  href="/discover"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Discover
                </Link>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium relative"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="flex items-center justify-between">
                    Dashboard
                    {pendingRequestsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href="/messages"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md font-medium mt-2"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push('/auth/signin')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    router.push('/auth/signup')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
