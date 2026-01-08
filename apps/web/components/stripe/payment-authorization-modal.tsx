'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@stringerly/ui'
import { Loader2, DollarSign, X } from 'lucide-react'
import { formatCurrency } from '@/lib/stripe/client'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentAuthorizationModalProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  quotedPriceCents: number
  stringerName: string
  onSuccess: () => void
}

function PaymentForm({
  requestId,
  quotedPriceCents,
  stringerName,
  onSuccess,
  onClose,
}: Omit<PaymentAuthorizationModalProps, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate fee breakdown
  const platformFeeCents = Math.round(quotedPriceCents * 0.12)
  const stringerEarningsCents = quotedPriceCents - platformFeeCents

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Confirm payment with Stripe
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Failed to submit payment')
        setLoading(false)
        return
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setLoading(false)
        return
      }

      // Payment authorized successfully
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Price Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Job Total</span>
          <span className="font-medium">{formatCurrency(quotedPriceCents)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Platform fee (12%)</span>
          <span>{formatCurrency(platformFeeCents)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{stringerName} receives</span>
          <span>{formatCurrency(stringerEarningsCents)}</span>
        </div>
        <div className="pt-2 border-t border-gray-200 flex justify-between">
          <span className="font-semibold">Amount to Authorize</span>
          <span className="font-semibold text-lg">{formatCurrency(quotedPriceCents)}</span>
        </div>
      </div>

      {/* Important Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Your card will be authorized for {formatCurrency(quotedPriceCents)}, but you won't be charged until you approve the completed work.
        </p>
      </div>

      {/* Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Authorizing...
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4 mr-2" />
              Authorize Payment
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function PaymentAuthorizationModal({
  isOpen,
  onClose,
  requestId,
  quotedPriceCents,
  stringerName,
  onSuccess,
}: PaymentAuthorizationModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch client secret when modal opens
  useState(() => {
    if (isOpen && !clientSecret) {
      fetchClientSecret()
    }
  })

  const fetchClientSecret = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/authorize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initialize payment')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Authorize Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {loading && !clientSecret ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-gray-600">Preparing payment...</p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
              <Button onClick={onClose} variant="outline" className="w-full">
                Close
              </Button>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#10b981',
                  },
                },
              }}
            >
              <PaymentForm
                requestId={requestId}
                quotedPriceCents={quotedPriceCents}
                stringerName={stringerName}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  )
}
