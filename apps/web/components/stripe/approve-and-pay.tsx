'use client'

import { useState } from 'react'
import { Button } from '@stringerly/ui'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

interface ApproveAndPayProps {
  requestId: string
  quotedPriceCents: number
  stringerName: string
  completionPhotoUrl?: string
  onSuccess: () => void
}

export function ApproveAndPay({
  requestId,
  quotedPriceCents,
  stringerName,
  completionPhotoUrl,
  onSuccess,
}: ApproveAndPayProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReportIssue, setShowReportIssue] = useState(false)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/capture-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process payment')
      }

      // Payment captured successfully
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Your Racket is Ready!
          </h3>
          <p className="text-gray-600 mb-4">
            {stringerName} has completed stringing your racket. Please review the work and approve to release payment.
          </p>

          {completionPhotoUrl && (
            <div className="mb-4">
              <img
                src={completionPhotoUrl}
                alt="Completed racket"
                className="rounded-lg w-full max-w-md border border-gray-200"
              />
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Payment Amount:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(quotedPriceCents)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This amount was authorized when the job was accepted. Approving will complete the payment and transfer funds to your stringer.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Pay {formatCurrency(quotedPriceCents)}
                </>
              )}
            </Button>

            {!showReportIssue && (
              <Button
                variant="outline"
                onClick={() => setShowReportIssue(true)}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            )}
          </div>

          {showReportIssue && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Report an Issue</h4>
              <p className="text-sm text-red-700 mb-3">
                If there's a problem with the stringing work, please contact {stringerName} directly or reach out to Stringerly support. Your payment is held securely until this is resolved.
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReportIssue(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    // TODO: Implement support contact
                    window.location.href = '/contact'
                  }}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
