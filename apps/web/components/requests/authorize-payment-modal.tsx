'use client'

import { useState } from 'react'
import { Button, formatPrice } from '@stringerly/ui'
import { X, CreditCard, Lock, DollarSign, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface AuthorizePaymentModalProps {
  request: {
    id: string
    final_price_cents: number
    stringer: {
      full_name: string
    }
  }
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({ request, onSuccess, onCancel }: AuthorizePaymentModalProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Create payment method from card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        throw new Error(pmError.message)
      }

      // Authorize payment on backend
      const response = await fetch(`/api/requests/${request.id}/authorize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to authorize payment')
      }

      // Success!
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Payment authorization failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Authorize Payment</h2>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Price Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Quote from {request.stringer.full_name}</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-gray-900">Total Amount</span>
              <span className="text-3xl font-bold text-green-600">
                {formatPrice(request.final_price_cents)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Payment will be held securely until you approve the completed work.
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Secure Escrow Payment</p>
              <p className="text-xs text-blue-700 mt-1">
                Your payment is held safely and will only be released to the stringer after you confirm the work is complete. You're protected by Stripe.
              </p>
            </div>
          </div>

          {/* Card Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4" />
              Card Information
            </label>
            <div className="p-3 border-2 border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💳 Test card: 4242 4242 4242 4242, any future date, any CVC
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'Processing...' : `Pay ${formatPrice(request.final_price_cents)}`}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            By authorizing this payment, you agree to hold {formatPrice(request.final_price_cents)} in escrow until the work is completed.
          </p>
        </form>
      </div>
    </div>
  )
}

export function AuthorizePaymentModal(props: AuthorizePaymentModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}
