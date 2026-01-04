'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Button, formatTimeRange } from '@stringerly/ui'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface RequestData {
  stringer_id: string
  stringer_name: string
  racket_photo_url: string
  service_type: string
  string_selection: {
    brand: string
    model: string
    gauge: string
    price_cents: number
  }
  tension_mains_lbs: number
  tension_crosses_lbs: number
  string_pattern: string
  dropoff_method: {
    method: string
    details?: string
  }
  preferred_time_slot?: {
    day: string
    start: string
    end: string
  }
  special_instructions?: string
  preferred_completion_date?: string
  estimated_price_cents: number
}

function ReviewRequestContent() {
  const router = useRouter()
  const [requestData, setRequestData] = useState<RequestData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('pending_request')
    if (!stored) {
      router.push('/discover')
      return
    }

    try {
      const data = JSON.parse(stored)
      setRequestData(data)
    } catch (err) {
      console.error('Failed to parse request data:', err)
      router.push('/discover')
    }
  }, [router])

  const handleSubmit = async () => {
    if (!requestData) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit request')
      }

      // Clear localStorage
      localStorage.removeItem('pending_request')

      // Redirect to dashboard with success message
      router.push('/dashboard?request_submitted=true')
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const serviceTypeLabels: Record<string, string> = {
    restring_only: 'Restring Only',
    restring_grip: 'Restring + Grip Replacement',
    restring_grommets: 'Restring + Grommet Replacement',
    full_service: 'Full Service (Restring + Grip + Grommets)',
  }

  const stringPatternLabels: Record<string, string> = {
    existing: 'Keep existing pattern',
    two_piece: '2-piece pattern',
    one_piece: '1-piece pattern',
    ask_stringer: 'Ask the stringer',
  }

  if (!requestData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Edit
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Review Your Request</h1>
          <p className="text-gray-600 mt-1">
            Please review your request to <span className="font-medium">{requestData.stringer_name}</span>
          </p>
        </div>

        {/* Request Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Racket Photo */}
          <div className="relative w-full h-64 bg-gray-100">
            <Image
              src={requestData.racket_photo_url}
              alt="Your racket"
              fill
              className="object-contain"
            />
          </div>

          <div className="p-6 space-y-6">
            {/* Service Type */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Service</h3>
              <p className="text-base text-gray-900">{serviceTypeLabels[requestData.service_type]}</p>
            </div>

            {/* String Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">String</h3>
              <p className="text-base text-gray-900">
                {requestData.string_selection.brand} {requestData.string_selection.model} {requestData.string_selection.gauge}
              </p>
              <p className="text-sm text-gray-600">
                {formatPrice(requestData.string_selection.price_cents)}
              </p>
            </div>

            {/* Tension */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Tension</h3>
              <p className="text-base text-gray-900">
                Mains: {requestData.tension_mains_lbs} lbs | Crosses: {requestData.tension_crosses_lbs} lbs
              </p>
            </div>

            {/* String Pattern */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">String Pattern</h3>
              <p className="text-base text-gray-900">{stringPatternLabels[requestData.string_pattern]}</p>
            </div>

            {/* Dropoff Instructions */}
            {requestData.dropoff_method?.details && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Drop-off Instructions</h3>
                <p className="text-sm text-gray-600">{requestData.dropoff_method.details}</p>
              </div>
            )}

            {/* Preferred Time Slot */}
            {requestData.preferred_time_slot && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Preferred Dropoff Time</h3>
                <p className="text-base text-gray-900">
                  {requestData.preferred_time_slot.day} {formatTimeRange(requestData.preferred_time_slot.start, requestData.preferred_time_slot.end)}
                </p>
              </div>
            )}

            {/* Special Instructions */}
            {requestData.special_instructions && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Special Instructions</h3>
                <p className="text-base text-gray-900">{requestData.special_instructions}</p>
              </div>
            )}

            {/* Preferred Completion Date */}
            {requestData.preferred_completion_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Preferred Completion Date</h3>
                <p className="text-base text-gray-900">
                  {new Date(requestData.preferred_completion_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Price */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Estimated Total</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(requestData.estimated_price_cents)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Final price may be adjusted by the stringer
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="flex-1"
          >
            Edit Request
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          By submitting, you agree to the stringer's pricing and terms
        </p>
      </main>
    </div>
  )
}

export default function ReviewRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewRequestContent />
    </Suspense>
  )
}
