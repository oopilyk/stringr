'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@stringr/ui'
import { Home, MessageSquare, Calendar, Settings, LogOut, Menu, X, UserPlus, User } from 'lucide-react'

export function Navigation() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const getNavigationItems = () => {
    if (!profile) {
      // Unauthenticated users only see Discover
      return [
        { href: '/discover', label: 'Discover', icon: Home }
      ]
    }

    const baseItems = [
      { href: '/discover', label: 'Discover', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: Calendar },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ]

    // Add profile management for all users
    baseItems.push({
      href: '/my-profile',
      label: 'My Profile',
      icon: User
    })

    // Add general settings last
    baseItems.push({ href: '/settings', label: 'Settings', icon: Settings })

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="relative z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="Stringr Logo"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <span className="text-2xl font-bold text-primary">STRINGR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 text-gray-700">
            {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center space-x-2 hover:text-primary transition-colors font-medium"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {profile ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary">
                      {profile.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{profile.full_name || 'User'}</span>
                </div>

                <Button
                  variant="outline"
                  className="hidden md:flex border-primary text-primary hover:bg-primary/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-4">
              {profile && (
                <div className="flex items-center space-x-3 px-2 py-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {profile.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{profile.full_name || 'User'}</p>
                    <p className="text-sm text-gray-500">{profile.city || 'Location not set'}</p>
                  </div>
                </div>
              )}

              {navigationItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center space-x-3 px-2 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </Link>
              ))}

              {profile ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start space-x-3 px-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/auth/signin')}
                    className="w-full"
                  >
                    Log In
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/signup')}
                    className="w-full"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
