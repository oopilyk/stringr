'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'
import { Search } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Animated counter for users
  useEffect(() => {
    let start = 0
    const end = 10000
    const duration = 2000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setUserCount(end)
        clearInterval(timer)
      } else {
        setUserCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [])

  const handleSignInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Check your email for the login link!')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      setMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        router.push('/discover')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden">
      {/* Navigation Bar */}
      <nav className="relative z-50 flex flex-col md:flex-row items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-sm shadow-sm gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="Stringerly Logo"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <span className="text-2xl font-bold text-primary">STRINGERLY</span>
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => setShowAuthModal(true)}
            >
              Log In
            </Button>
            <Button
              size="sm"
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => router.push('/auth/signup')}
            >
              Sign Up
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-gray-700 w-full md:w-auto">
          <Link href="/about" className="hover:text-primary transition font-medium text-sm md:text-base">
            About the Creators
          </Link>
          <Link href="/contact" className="hover:text-primary transition font-medium text-sm md:text-base">
            Contact Us
          </Link>
          <Link href="/pricing" className="hover:text-primary transition font-medium text-sm md:text-base">
            Pricing
          </Link>
          <Link href="/discover">
            <Button
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Stringers
            </Button>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => setShowAuthModal(true)}
          >
            Log In
          </Button>
          <Button
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => router.push('/auth/signup')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Main Content - Centered with gradient background */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="flex flex-col items-center justify-center text-center max-w-5xl w-full">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            The Home of Stringing
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/95 max-w-2xl mb-8 leading-relaxed">
            Connecting players with professional stringers globally through ratings, reviews, and seamless booking.
          </p>

          {/* Animated Stat */}
          <div className="mb-8">
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">
              {userCount.toLocaleString()}+
            </div>
            <div className="text-base md:text-lg text-white">
              Active Users
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
                onClick={() => router.push('/auth/signup')}
              >
                Join as a Player
              </Button>
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-primary text-white border-2 border-white hover:bg-white hover:text-primary transition-all shadow-lg"
                onClick={() => router.push('/auth/stringer-signup')}
              >
                Join as a Stringer
              </Button>
            </div>
            <p className="text-white/90 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/login')}
                className="underline hover:text-white transition font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                {showPasswordField ? 'Sign in to your account' : 'Enter your email to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={showPasswordField ? handleSignInWithPassword : handleSignInWithMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                {showPasswordField && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your password"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {!showPasswordField ? (
                    <>
                      <Button type="submit" disabled={isLoading} className="w-full h-12">
                        {isLoading ? 'Sending...' : 'Send Magic Link'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPasswordField(true)}
                        disabled={isLoading}
                        className="w-full h-12"
                      >
                        Sign In with Password
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="submit" disabled={isLoading} className="w-full h-12">
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordField(false)
                          setPassword('')
                          setMessage('')
                        }}
                        disabled={isLoading}
                        className="w-full h-12"
                      >
                        Use Magic Link Instead
                      </Button>
                    </>
                  )}
                </div>

                {message && (
                  <div className={`text-sm font-medium p-3 rounded-lg ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                  </div>
                )}
              </form>

              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
