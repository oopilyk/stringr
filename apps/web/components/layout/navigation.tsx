'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@rally-strings/ui'
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
    const baseItems = [
      { href: '/', label: 'Discover', icon: Home },
      { href: '/dashboard', label: 'Dashboard', icon: Calendar },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
    ]

    // Add profile management for all users
    if (profile) {
      baseItems.push({ 
        href: '/my-profile', 
        label: 'My Profile', 
        icon: User 
      })
    }

    // Add general settings last
    baseItems.push({ href: '/settings', label: 'Settings', icon: Settings })

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="RallyStrings logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-xl font-bold text-gray-900">Stringr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center space-x-1 text-gray-700 hover:text-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {profile.full_name?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{profile.full_name || 'User'}</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="hidden md:flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>

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

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start space-x-3 px-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
