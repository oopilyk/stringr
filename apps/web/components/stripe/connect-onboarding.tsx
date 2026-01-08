'use client'

import { useState, useEffect } from 'react'
import { Button } from '@stringerly/ui'
import { CheckCircle, AlertCircle, Loader2, DollarSign } from 'lucide-react'

interface ConnectOnboardingProps {
  userId: string
}

export function ConnectOnboarding({ userId }: ConnectOnboardingProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [status, setStatus] = useState<{
    connected: boolean
    onboardingCompleted?: boolean
    chargesEnabled?: boolean
    payoutsEnabled?: boolean
    accountId?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check existing connection status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/stripe/connect-account')
      const data = await response.json()
      setStatus(data)
    } catch (err) {
      console.error('Failed to check Stripe status:', err)
    } finally {
      setChecking(false)
    }
  }

  const handleConnect = async () => {
    try {
      setLoading(true)
      setError(null)

      // If account exists but onboarding not completed, refresh the link
      if (status?.connected && !status.onboardingCompleted) {
        const response = await fetch('/api/stripe/refresh-onboarding', {
          method: 'POST',
        })
        const data = await response.json()

        if (data.onboardingUrl) {
          window.location.href = data.onboardingUrl
          return
        }

        if (data.completed) {
          await checkStatus()
          return
        }
      } else {
        // Create new account
        const response = await fetch('/api/stripe/connect-account', {
          method: 'POST',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create Stripe account')
        }

        const data = await response.json()

        if (data.onboardingUrl) {
          // Redirect to Stripe onboarding
          window.location.href = data.onboardingUrl
          return
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect Stripe account')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Fully connected and verified
  if (status?.connected && status.onboardingCompleted && status.chargesEnabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Bank Account Connected
            </h3>
            <p className="text-sm text-green-700 mb-3">
              Your Stripe account is fully set up and ready to receive payments. You'll be paid automatically when jobs are completed.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800">Charges enabled</span>
              </div>
              {status.payoutsEnabled && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800">Payouts enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Account exists but onboarding not completed
  if (status?.connected && !status.onboardingCompleted) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-1">
              Complete Bank Account Setup
            </h3>
            <p className="text-sm text-yellow-700">
              You started connecting your bank account but didn't finish. Complete the setup to start receiving payments for completed jobs.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    )
  }

  // No account yet - show connect button
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3 mb-4">
        <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">
            Connect Bank Account
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            To receive payments for completed stringing jobs, you need to connect your bank account through Stripe.
          </p>
          <ul className="text-sm text-blue-700 space-y-1 mb-3">
            <li>✓ Secure payment processing</li>
            <li>✓ Automatic payouts after job completion</li>
            <li>✓ Stringerly takes a 12% platform fee</li>
            <li>✓ Track all earnings in your dashboard</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <DollarSign className="w-4 h-4 mr-2" />
            Connect Bank Account
          </>
        )}
      </Button>
    </div>
  )
}
