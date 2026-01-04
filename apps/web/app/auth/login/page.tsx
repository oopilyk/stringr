'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'
import { SignInSchema, MagicLinkSchema, validateData } from '@/lib/validation/schemas'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [blockUntil, setBlockUntil] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignInWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // SECURITY: Validate email input
      const validationResult = validateData(MagicLinkSchema, { email })
      if (!validationResult.success) {
        setMessage(`Error: ${validationResult.error}`)
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: validationResult.data.email,
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

    // SECURITY: Check if user is temporarily blocked
    if (blockUntil && Date.now() < blockUntil) {
      const remainingSeconds = Math.ceil((blockUntil - Date.now()) / 1000)
      setMessage(`Too many failed attempts. Please wait ${remainingSeconds} seconds.`)
      return
    }

    if (!password) {
      setMessage('Please enter your password')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // SECURITY: Validate credentials
      const validationResult = validateData(SignInSchema, { email, password })
      if (!validationResult.success) {
        setMessage(`Error: ${validationResult.error}`)
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      })

      if (error) {
        // SECURITY: Track failed login attempts
        const newAttemptCount = attemptCount + 1
        setAttemptCount(newAttemptCount)

        if (newAttemptCount >= 5) {
          const blockTime = Date.now() + 60000 // Block for 1 minute
          setBlockUntil(blockTime)
          setMessage('Too many failed attempts. Please wait 1 minute before trying again.')
        } else {
          setMessage(`Error: ${error.message} (${5 - newAttemptCount} attempts remaining)`)
        }
      } else {
        // Reset attempt count on successful login
        setAttemptCount(0)
        setBlockUntil(null)
        router.push('/discover')
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
            alt="Stringerly Logo"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
          <span className="text-2xl font-bold text-primary">STRINGERLY</span>
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
