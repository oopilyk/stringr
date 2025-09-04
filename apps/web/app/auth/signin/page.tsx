'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
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
    setIsLoading(true)
    
    // For demo purposes, try common test accounts
    const testAccounts = [
      { email: 'marco@example.com', password: 'password123' },
      { email: 'sarah@example.com', password: 'password123' },
      { email: 'david@example.com', password: 'password123' },
      { email: 'alex@example.com', password: 'password123' },
      { email: 'emma@example.com', password: 'password123' },
    ]

    const testAccount = testAccounts.find(account => account.email === email)
    
    if (testAccount) {
      const { error } = await supabase.auth.signInWithPassword({
        email: testAccount.email,
        password: testAccount.password,
      })

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        router.push('/')
      }
    } else {
      setMessage('For demo, use one of the test accounts: marco@example.com, sarah@example.com, david@example.com, alex@example.com, or emma@example.com')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Stringr</h1>
          <p className="mt-2 text-sm text-gray-600">
            Tennis racquet stringing marketplace
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Enter your email to sign in or create an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Magic Link'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignInWithPassword}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Signing in...' : 'Demo Sign In'}
                </Button>
              </div>

              {message && (
                <div className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </form>

            <div className="mt-6 text-xs text-gray-500">
              <p><strong>Demo Accounts:</strong></p>
              <p>Stringers: marco@example.com, sarah@example.com, david@example.com</p>
              <p>Players: alex@example.com, emma@example.com</p>
              <p>Password: password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
