'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { useForm } from 'react-hook-form'
import { UserCheck, UserPlus, Users, Zap } from 'lucide-react'

type UserRole = 'player' | 'stringer'

interface SignupForm {
  email: string
  full_name: string
  role: UserRole
}

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignupForm>()

  const watchedRole = watch('role')

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setValue('role', role)
  }

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setMessage('')

    try {
      if (data.role === 'stringer') {
        // Redirect to full stringer signup
        const params = new URLSearchParams({
          email: data.email,
          full_name: data.full_name
        })
        router.push(`/auth/stringer-signup?${params.toString()}`)
        return
      }

      // For players, create a simple account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: 'temp_password_' + Math.random().toString(36).substring(7), // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'player'
          }
        }
      })

      if (authError) {
        setMessage(`Error: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Create player profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            role: 'player',
            full_name: data.full_name
          })

        if (profileError) {
          setMessage(`Profile error: ${profileError.message}`)
          return
        }

        setMessage('Account created! Check your email to verify your account.')
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Join Stringr</h1>
            <p className="mt-2 text-sm text-gray-600">
              Choose how you'd like to use our tennis stringing marketplace
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Player Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleRoleSelect('player')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">I'm a Player</CardTitle>
                <CardDescription>
                  I need my tennis racquet restrung
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Find local stringers near you</li>
                  <li>• Compare prices and ratings</li>
                  <li>• Book stringing appointments</li>
                  <li>• Track your requests</li>
                  <li>• Leave reviews</li>
                </ul>
                <Button className="w-full">
                  Join as a Player
                </Button>
              </CardContent>
            </Card>

            {/* Stringer Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleRoleSelect('stringer')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">I'm a Stringer</CardTitle>
                <CardDescription>
                  I provide professional stringing services
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>• Set your own prices</li>
                  <li>• Choose your schedule</li>
                  <li>• Grow your customer base</li>
                  <li>• Manage your business</li>
                  <li>• Get paid securely</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Join as a Stringer
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/signin')}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {selectedRole === 'player' ? (
              <Users className="w-6 h-6 text-primary" />
            ) : (
              <Zap className="w-6 h-6 text-primary" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Join as a {selectedRole === 'player' ? 'Player' : 'Stringer'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {selectedRole === 'player' 
              ? 'Find local stringers and book your next restring'
              : 'This will redirect you to our detailed stringer onboarding'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              {selectedRole === 'player' 
                ? 'Get started with finding stringers'
                : 'Complete your business setup'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  {...register('full_name', { required: 'Name is required' })}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter your full name"
                />
                {errors.full_name && <p className="text-red-600 text-sm">{errors.full_name.message}</p>}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRole(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Creating...' : 
                   selectedRole === 'player' ? 'Create Account' : 'Continue'
                  }
                </Button>
              </div>

              {message && (
                <div className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
