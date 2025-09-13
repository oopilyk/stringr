'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { Navigation } from '@/components/layout/navigation'
import { UserPlus, Zap, CheckCircle, ArrowRight } from 'lucide-react'

export default function BecomeStringerPage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // If already a stringer, redirect to profile
  if (profile?.role === 'stringer') {
    router.push('/stringer-profile')
    return <div>Redirecting...</div>
  }

  const handleBecomeStringer = async () => {
    if (!profile?.id) {
      router.push('/auth/stringer-signup')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // Update existing player to stringer
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'stringer' })
        .eq('id', profile.id)

      if (profileError) {
        setMessage(`Error: ${profileError.message}`)
        return
      }

      // Create basic stringer settings
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .insert({
          id: profile.id,
          base_price_cents: 2500,
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 500,
          max_daily_jobs: 5,
          services: [
            { name: 'Standard Restring', price_cents: 2500 },
            { name: 'Premium String', price_cents: 3500 }
          ]
        })

      if (settingsError) {
        setMessage(`Settings error: ${settingsError.message}`)
        return
      }

      setMessage('Success! You are now a stringer. Redirecting to your profile...')
      setTimeout(() => {
        window.location.reload() // Refresh to update auth state
      }, 2000)

    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Stringer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join our marketplace and start earning by providing professional tennis racquet stringing services to local players.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Set Your Rates</h3>
              <p className="text-gray-600 text-sm">
                Choose your pricing, turnaround times, and service offerings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Manage Schedule</h3>
              <p className="text-gray-600 text-sm">
                Control your availability and maximum daily job capacity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Grow Business</h3>
              <p className="text-gray-600 text-sm">
                Connect with local players and build your customer base
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to get started?</CardTitle>
            <CardDescription>
              {profile 
                ? "Convert your player account to a stringer account and set up your business profile."
                : "Create your stringer account and start listing your services."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Set up your business profile and pricing</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Choose your service area and availability</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Start receiving booking requests from players</span>
              </div>
            </div>

            <Button
              onClick={handleBecomeStringer}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              {isLoading 
                ? 'Setting up...' 
                : profile 
                ? 'Become a Stringer' 
                : 'Create Stringer Account'
              }
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            {message && (
              <div className={`text-sm ${message.startsWith('Error') || message.startsWith('Settings error') ? 'text-red-600' : 'text-green-600'}`}>
                {message}
              </div>
            )}

            <p className="text-xs text-gray-500">
              {profile 
                ? "Your existing player data will be preserved"
                : "You'll be able to complete your profile after account creation"
              }
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
