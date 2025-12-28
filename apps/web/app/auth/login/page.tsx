'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringr/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringr/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const router = useRouter()
  const supabase = createClient()

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
        router.push('/')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden flex items-center justify-center p-4">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="Stringr Logo"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <span className="text-2xl font-bold text-primary">STRINGR</span>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => router.push('/auth/signin')}
          >
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Login Card */}
      <Card className="w-full max-w-md mt-20">
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

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-600 mb-1">Demo: marco@example.com / password123</p>
              <p className="text-sm text-gray-600 text-center mt-4">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
