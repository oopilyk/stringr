'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Check, Loader2, Clock, ChevronRight, Package, Wrench, AlertTriangle, CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@stringerly/ui'

interface Request {
  id: string
  status: string
  estimated_completion: string | null
  work_started_at: string | null
  ready_at: string | null
  completed_at: string | null
  estimated_price_cents: number
  final_price_cents?: number | null
  stringer_id: string
  service_type: string
  completion_photo_url?: string
  completion_notes?: string
  payment_authorized_at?: string | null
  // Pickup window fields
  pickup_deadline?: string | null
  extension_requested_at?: string | null
  extension_request_reason?: string | null
  extension_approved?: boolean | null
  extension_response_at?: string | null
  extension_response_reason?: string | null
}

interface Profile {
  full_name: string
  avatar_url?: string
  city?: string
}

interface PlayerActiveRequestCardProps {
  request: Request
  stringer: Profile
}

export function PlayerActiveRequestCard({ request, stringer }: PlayerActiveRequestCardProps) {
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [extensionReason, setExtensionReason] = useState('')
  const [isRequestingExtension, setIsRequestingExtension] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Fetch queue position for requests waiting in queue
  useEffect(() => {
    if (request.status === 'accepted' && request.payment_authorized_at && !request.work_started_at) {
      fetchQueuePosition()
    }
  }, [request.id, request.status, request.payment_authorized_at, request.work_started_at])

  const fetchQueuePosition = async () => {
    try {
      // Get all accepted requests for this stringer that are waiting (payment authorized, not started)
      const { data: queuedRequests, error } = await supabase
        .from('requests')
        .select('id, queue_priority, is_rush, payment_authorized_at')
        .eq('stringer_id', request.stringer_id)
        .eq('status', 'accepted')
        .not('payment_authorized_at', 'is', null)
        .is('work_started_at', null)
        .order('queue_priority', { ascending: true, nullsFirst: false })
        .order('is_rush', { ascending: false })
        .order('payment_authorized_at', { ascending: true })

      if (error) {
        console.error('Error fetching queue position:', error)
        return
      }

      // Find position of this request in the queue
      const position = queuedRequests?.findIndex(r => r.id === request.id)
      if (position !== undefined && position !== -1) {
        setQueuePosition(position + 1) // 1-indexed position
      }
    } catch (err) {
      console.error('Error fetching queue position:', err)
    }
  }

  // Calculate pickup deadline status
  const pickupDeadline = request.pickup_deadline ? new Date(request.pickup_deadline) : null
  const now = new Date()
  const hoursRemaining = pickupDeadline ? Math.max(0, (pickupDeadline.getTime() - now.getTime()) / (1000 * 60 * 60)) : null
  const isDeadlineNear = hoursRemaining !== null && hoursRemaining <= 12 && hoursRemaining > 0
  const isDeadlinePassed = hoursRemaining !== null && hoursRemaining <= 0
  const hasExtensionPending = request.extension_requested_at && request.extension_approved === null
  const extensionApproved = request.extension_approved === true
  const extensionDenied = request.extension_approved === false

  const handleRequestExtension = async () => {
    if (extensionReason.trim().length < 10) return

    setIsRequestingExtension(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/request-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: extensionReason.trim() })
      })

      if (response.ok) {
        setShowExtensionModal(false)
        setExtensionReason('')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to request extension')
      }
    } catch (error) {
      console.error('Error requesting extension:', error)
      alert('Failed to request extension')
    } finally {
      setIsRequestingExtension(false)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToUpdates()

    return () => {
      unsubscribe()
    }
  }, [request.id])

  const subscribeToUpdates = () => {
    // Subscribe to this specific request's updates
    const requestChannel = supabase
      .channel(`player-request-updates:${request.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${request.id}`
      }, (payload) => {
        const newData = payload.new as any
        const oldData = payload.old as any

        // If status or work_started_at changed, reload the page
        if (newData?.status !== oldData?.status ||
            newData?.work_started_at !== oldData?.work_started_at) {
          window.location.reload()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
    }
  }

  const handleConfirmPickup = () => {
    // Redirect to review page instead of directly completing
    router.push(`/review/${request.id}`)
  }

  const completionPhotoUrl = request.completion_photo_url

  // Payment authorization needed view (accepted status, payment NOT authorized)
  if (request.status === 'accepted' && !request.payment_authorized_at) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-lg border-2 border-yellow-300 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quote Received!</h2>
              <p className="text-yellow-100 text-sm">Payment Authorization Required</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-yellow-300"
            />
            <div>
              <p className="text-sm text-gray-600">Quote from</p>
              <p className="font-bold text-gray-900 text-lg">{stringer.full_name}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-white rounded-lg border-2 border-yellow-300">
            <p className="text-sm text-gray-600 mb-2">Your stringer has accepted your request with a final quote of:</p>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {formatPrice(request.final_price_cents || request.estimated_price_cents)}
            </div>
            <p className="text-xs text-gray-600">
              ⚡ Work will begin as soon as you authorize payment
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">💳 Secure Escrow Payment</p>
            <p className="text-xs text-blue-700">
              Your payment will be held securely and only released to the stringer after you confirm the completed work. You're protected by Stripe.
            </p>
          </div>

          <Button
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            onClick={() => router.push(`/request/${request.id}`)}
          >
            <Check className="w-4 h-4 mr-2" />
            View Quote & Authorize Payment
          </Button>
        </div>
      </div>
    )
  }

  // Payment authorized but work not started - show queue position
  if (request.status === 'accepted' && request.payment_authorized_at && !request.work_started_at) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-300 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Payment Authorized</h2>
              <p className="text-green-100 text-sm">Waiting in Queue</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Queue Position */}
          {queuePosition !== null && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border-2 border-green-300">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  #{queuePosition}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {queuePosition === 1 ? "You're next!" : `You're #${queuePosition} in queue`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {queuePosition === 1
                      ? "Your racket will be started soon"
                      : `${queuePosition - 1} racket${queuePosition - 1 === 1 ? '' : 's'} ahead of you`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stringer Info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-green-300"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Your Stringer</p>
              <p className="font-semibold text-gray-900">{stringer.full_name}</p>
            </div>
          </div>

          {request.estimated_completion && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Estimated ready: {new Date(request.estimated_completion).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              💳 Your payment is securely held. You'll be notified when {stringer.full_name} starts working on your racket.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/request/${request.id}`)}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // Ready for pickup view
  if (request.status === 'ready_for_pickup' || request.status === 'ready') {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg border-2 border-green-300 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Racket is Ready!</h2>
              <p className="text-green-100 text-sm">Ready for Pickup</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Pickup Deadline Banner */}
          {pickupDeadline && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              isDeadlinePassed ? 'bg-red-50 border-red-300' :
              isDeadlineNear ? 'bg-amber-50 border-amber-300' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                {isDeadlinePassed ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : isDeadlineNear ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CalendarClock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isDeadlinePassed ? 'text-red-800' :
                    isDeadlineNear ? 'text-amber-800' :
                    'text-blue-800'
                  }`}>
                    {isDeadlinePassed ? 'Pickup deadline passed' :
                     isDeadlineNear ? 'Pickup deadline approaching' :
                     'Pickup window'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDeadlinePassed ? 'text-red-700' :
                    isDeadlineNear ? 'text-amber-700' :
                    'text-blue-700'
                  }`}>
                    {isDeadlinePassed ? (
                      <>Deadline was {pickupDeadline.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}. Please request an extension or pick up ASAP.</>
                    ) : (
                      <>Please pick up by {pickupDeadline.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })} ({Math.ceil(hoursRemaining || 0)} hours remaining)</>
                    )}
                  </p>

                  {/* Extension Status */}
                  {hasExtensionPending && (
                    <p className="text-xs mt-2 text-amber-700 font-medium">
                      ⏳ Extension request pending - waiting for stringer response
                    </p>
                  )}
                  {extensionApproved && (
                    <p className="text-xs mt-2 text-green-700 font-medium">
                      ✅ Extension approved! New deadline: {pickupDeadline.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  )}
                  {extensionDenied && (
                    <p className="text-xs mt-2 text-red-700 font-medium">
                      ❌ Extension denied: {request.extension_response_reason || 'No reason provided'}
                    </p>
                  )}

                  {/* Request Extension Button */}
                  {(isDeadlineNear || isDeadlinePassed) && !hasExtensionPending && !extensionApproved && (
                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="mt-2 text-xs font-medium underline text-blue-600 hover:text-blue-800"
                    >
                      Request pickup extension
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
            />
            <div>
              <p className="text-sm text-gray-600">Strung by</p>
              <p className="font-bold text-gray-900 text-lg">{stringer.full_name}</p>
            </div>
          </div>

          {completionPhotoUrl && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Completed Racket</p>
              <div className="overflow-x-auto">
                <img
                  src={completionPhotoUrl}
                  alt="Completed racket"
                  className="w-full max-h-96 object-contain rounded-lg border-2 border-green-200 bg-white cursor-pointer"
                  onClick={() => window.open(completionPhotoUrl, '_blank')}
                />
              </div>
            </div>
          )}

          {request.completion_notes && (
            <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Notes from Stringer</p>
              <p className="text-gray-900">{request.completion_notes}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmPickup}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark as Picked Up
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/request/${request.id}`)}
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Extension Request Modal */}
        {showExtensionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Pickup Extension</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please explain why you need more time to pick up your racket. The stringer will review your request.
              </p>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="I need an extension because..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-2"
                rows={3}
              />
              <p className="text-xs text-gray-500 mb-4">
                {extensionReason.length}/100 characters (minimum 10)
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowExtensionModal(false)}
                  disabled={isRequestingExtension}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestExtension}
                  disabled={extensionReason.trim().length < 10 || isRequestingExtension}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isRequestingExtension ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Request'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // In progress view
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Racket is Being Strung</h2>
              <p className="text-blue-100 text-sm">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stringer Info */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={stringer.avatar_url || '/default-avatar.png'}
            alt={stringer.full_name}
            className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Your Stringer</p>
            <p className="font-semibold text-gray-900">{stringer.full_name}</p>
          </div>
        </div>

        {/* Estimated Completion */}
        {request.estimated_completion && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Estimated ready: {new Date(request.estimated_completion).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <p className="text-sm text-blue-800">
            {stringer.full_name} is working on your racket. You'll be notified when it's ready for pickup.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/request/${request.id}`)}
        >
          View Details
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
