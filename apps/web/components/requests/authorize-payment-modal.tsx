'use client'

import { useState } from 'react'
import { Button, formatPrice } from '@stringerly/ui'
import { X, CreditCard, Lock, User } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// App fee percentage (should match server config)
const APP_FEE_PERCENT = 5

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
  const [cardholderName, setCardholderName] = useState('')

  // Calculate fee breakdown
  const stringerPrice = request.final_price_cents
  const appFee = Math.round(stringerPrice * (APP_FEE_PERCENT / 100))
  const totalAmount = stringerPrice + appFee

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Create payment method from card element with billing details
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName.trim(),
        },
      })

      if (pmError) {
        throw new Error(pmError.message)
      }

      // Authorize payment on backend
      const response = await fetch(`/api/requests/${request.id}/authorize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          cardholder_name: cardholderName.trim()
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Price Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Quote from {request.stringer.full_name}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stringing Service</span>
                <span className="text-gray-900">{formatPrice(stringerPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service Fee ({APP_FEE_PERCENT}%)</span>
                <span className="text-gray-900">{formatPrice(appFee)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-green-600">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Secure Escrow Payment</p>
              <p className="text-xs text-blue-700 mt-1">
                Your payment is held securely until the stringer completes your racket. Money is released when the work is finished.
              </p>
            </div>
          </div>

          {/* Cardholder Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name on card"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              required
            />
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
              disabled={!stripe || isProcessing || !cardholderName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? 'Processing...' : `Authorize ${formatPrice(totalAmount)}`}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Payment will be held in escrow and released when the stringer completes your racket.
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
