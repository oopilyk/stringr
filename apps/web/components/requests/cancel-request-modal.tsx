'use client'

import { useState } from 'react'
import { Button } from '@stringerly/ui'
import { X, AlertTriangle, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@stringerly/ui'

interface CancelRequestModalProps {
  request: {
    id: string
    status: string
    final_price_cents?: number
    estimated_price_cents?: number
    payment_intent_id?: string
    payment_captured_at?: string
  }
  userRole: 'player' | 'stringer'
  onCancel: () => void
}

const CANCELLATION_REASONS = {
  player: [
    'Changed my mind',
    'Found another stringer',
    'No longer need service',
    'Taking too long',
    'Other'
  ],
  stringer: [
    'Cannot complete request',
    'Missing equipment/string',
    'Schedule conflict',
    'Player unresponsive',
    'Other'
  ]
}

export function CancelRequestModal({ request, userRole, onCancel }: CancelRequestModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const priceCents = request.final_price_cents || request.estimated_price_cents || 0
  const hasPayment = !!request.payment_intent_id
  const paymentCaptured = !!request.payment_captured_at

  const handleConfirm = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason

    if (!reason.trim()) {
      setError('Please provide a reason for cancellation')
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      const response = await fetch(`/api/requests/${request.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          cancellation_reason: 'requested_by_customer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel request')
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Cancel Request</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-medium mb-2">
              Are you sure you want to cancel this request?
            </p>
            <p className="text-xs text-red-700">
              This action cannot be undone. {userRole === 'player' && 'The stringer will be notified.'}
            </p>
          </div>

          {/* Refund Information */}
          {hasPayment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {paymentCaptured ? 'Full Refund Will Be Issued' : 'Payment Authorization Will Be Released'}
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    {paymentCaptured
                      ? `${formatPrice(priceCents)} will be refunded to the player's card within 5-10 business days.`
                      : `The ${formatPrice(priceCents)} authorization hold will be released immediately.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Why are you cancelling? <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              disabled={isProcessing}
            >
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS[userRole].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Other' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Please specify <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason..."
                rows={3}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                disabled={isProcessing}
              />
            </div>
          )}

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
              Keep Request
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !selectedReason}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
