'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@stringerly/ui'

export default function SignInPage() {
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
        router.push('/discover')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <img
          src="/racket-logo.png"
          alt="Stringerly logo"
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
        <span className="text-lg font-bold text-primary">STRINGERLY</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            {showPasswordField ? 'Sign in to your account' : 'Enter your email to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={showPasswordField ? handleSignInWithPassword : handleSignInWithMagicLink}
            className="space-y-4"
          >
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
              <div
                className={`text-sm font-medium p-3 rounded-lg ${
                  message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-gray-600">
        New to Stringerly?{' '}
        <Link href="/auth/signup" className="font-medium text-primary hover:underline">
          Join as a player
        </Link>{' '}
        ·{' '}
        <Link href="/auth/stringer-signup" className="font-medium text-primary hover:underline">
          Join as a stringer
        </Link>
      </p>
    </div>
  )
}
