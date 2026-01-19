'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@stringerly/ui'
import { Star, Loader2, Check, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface RequestData {
  id: string
  stringer_id: string
  player_id: string
  completion_photo_url?: string
  stringer: {
    full_name: string
    avatar_url?: string
  }
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.requestId as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [request, setRequest] = useState<RequestData | null>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    fetchRequestData()
  }, [requestId])

  const fetchRequestData = async () => {
    try {
      setLoading(true)

      // Fetch request data
      const { data: requestData, error: requestError } = await supabase
        .from('requests')
        .select('id, stringer_id, player_id, completion_photo_url')
        .eq('id', requestId)
        .single()

      if (requestError) throw requestError

      // Fetch stringer profile separately
      const { data: stringerData, error: stringerError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', requestData.stringer_id)
        .single()

      if (stringerError) throw stringerError

      // Combine the data
      const combinedData = {
        ...requestData,
        stringer: stringerData
      }

      setRequest(combinedData)

      // Check if review already exists
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
        .eq('review_type', 'stringer_review')
        .single()

      if (existingReview) {
        // Already reviewed, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching request:', error)
      setError('Failed to load request data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('request_id', requestId)
        .eq('reviewer_id', user.id)
        .eq('review_type', 'stringer_review')
        .maybeSingle()

      // Only create review if it doesn't exist
      if (!existingReview) {
        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            request_id: requestId,
            reviewee_id: request!.stringer_id,
            reviewer_id: user.id,
            review_type: 'stringer_review',
            rating,
            comment: comment.trim() || null,
          })

        if (reviewError) {
          console.error('Review insertion error:', reviewError)
          throw new Error(`Failed to save review: ${reviewError.message}`)
        }
      } else {
        console.log('Review already exists, skipping insertion')
      }

      // Mark request as completed
      const response = await fetch(`/api/requests/${requestId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Complete request error:', errorData)
        throw new Error(`Failed to complete request: ${errorData.error || response.statusText}`)
      }

      setSubmitted(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      setSkipping(true)
      setError('')

      // Complete the request without a review (captures payment)
      const response = await fetch(`/api/requests/${requestId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Complete request error:', errorData)
        throw new Error(`Failed to complete request: ${errorData.error || response.statusText}`)
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping review:', error)
      setError('Failed to complete request. Please try again.')
    } finally {
      setSkipping(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Request not found'}</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your review has been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6">
            <h1 className="text-2xl font-bold text-white mb-2">Review Your Stringer</h1>
            <p className="text-green-100 text-sm">
              How was your experience with {request.stringer.full_name}?
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Stringer Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={request.stringer.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=stringer'}
                alt={request.stringer.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
              />
              <div>
                <p className="text-sm text-gray-600">Stringer</p>
                <p className="font-bold text-gray-900 text-lg">{request.stringer.full_name}</p>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate Your Experience <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Your Feedback (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={5}
                placeholder="Tell us about your experience... What did you like? Any suggestions?"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={submitting || skipping}
                className="flex-1"
              >
                {skipping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  'Skip for Now'
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
