'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button, formatPrice } from '@stringerly/ui'
import { Check, Clock, Package, Loader2, MessageSquare, CheckCircle, DollarSign } from 'lucide-react'
import Link from 'next/link'
interface Request {
  id: string
  status: string
  estimated_completion: string | null
  accepted_at: string | null
  work_started_at: string | null
  ready_at: string | null
  completed_at: string | null
  completion_notes: string | null
  completion_photo_url: string | null
  stringer_id: string
  final_price_cents?: number | null
  estimated_price_cents?: number
  payment_authorized_at?: string | null
}

interface Stringer {
  id: string
  full_name: string
  avatar_url: string | null
}

interface PlayerRequestStatusProps {
  request: Request
  stringer: Stringer
  onAuthorizePayment?: () => void
}

export function PlayerRequestStatus({ request, stringer, onAuthorizePayment }: PlayerRequestStatusProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const supabase = createClient()

  // Fetch queue position for requests waiting to be started
  useEffect(() => {
    const fetchQueuePosition = async () => {
      if (request.status === 'accepted' && request.payment_authorized_at && !request.work_started_at) {
        try {
          const response = await fetch(`/api/requests/${request.id}/queue-position`)
          const data = await response.json()
          if (response.ok && data.queue_position) {
            setQueuePosition(data.queue_position)
          }
        } catch (error) {
          console.error('Error fetching queue position:', error)
        }
      }
    }
    fetchQueuePosition()
  }, [request.id, request.status, request.payment_authorized_at, request.work_started_at])

  // Subscribe to request updates
  useEffect(() => {
    const channel = supabase
      .channel(`request-updates:${request.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'requests',
        filter: `id=eq.${request.id}`
      }, () => {
        window.location.reload() // Refresh to get updated request
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [request.id, supabase])

  const completeRequest = async () => {
    if (!confirm('Confirm you have picked up your racket?')) return

    try {
      setIsCompleting(true)

      const response = await fetch(`/api/requests/${request.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to complete request')
      }
    } catch (error) {
      console.error('Error completing request:', error)
      alert('Failed to complete request')
    } finally {
      setIsCompleting(false)
    }
  }

  // Pending state - waiting for stringer to accept
  if (request.status === 'pending') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Waiting for Stringer to Accept
          </h3>
          <p className="text-gray-600 mb-4">
            Your request has been sent to {stringer.full_name}. You'll be notified when they accept.
          </p>
          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Stringer
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Accepted state - stringer sent quote, waiting for payment authorization
  if (request.status === 'accepted' && !request.payment_authorized_at) {
    const quotePrice = request.final_price_cents || request.estimated_price_cents || 0
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg border-2 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quote Received!</h2>
              <p className="text-amber-100 text-sm">Payment Authorization Required</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stringer Info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-amber-300"
            />
            <div>
              <p className="text-sm text-gray-600">Quote from</p>
              <p className="font-bold text-gray-900 text-lg">{stringer.full_name}</p>
            </div>
          </div>

          {/* Quote Amount */}
          <div className="mb-6 p-4 bg-white rounded-lg border-2 border-amber-300">
            <p className="text-sm text-gray-600 mb-2">{stringer.full_name} is ready to string your racket for:</p>
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {formatPrice(quotePrice)}
            </div>
            {request.estimated_completion && (
              <p className="text-xs text-gray-600">
                Estimated Completion: {new Date(request.estimated_completion).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            )}
          </div>

          {/* Escrow Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">💳 Secure Escrow Payment</p>
            <p className="text-xs text-blue-700">
              Your payment will be held securely and only released to the stringer when they complete your racket. You're protected by Stripe.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onClick={onAuthorizePayment}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Authorize Payment
            </Button>
            <Link href={`/messages?conversation=${stringer.id}`} className="block">
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {stringer.full_name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Accepted state with payment authorized - work not started yet (in queue)
  if (request.status === 'accepted' && request.payment_authorized_at && !request.work_started_at) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold">Payment Authorized</h2>
              <p className="text-green-100 text-sm">Waiting in queue</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Queue Position */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-3">
              <span className="text-3xl font-bold text-blue-600">
                #{queuePosition || '?'}
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {queuePosition === 1 ? "You're next!" : `Position ${queuePosition || '...'} in queue`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stringer.full_name} will start your racket when they're ready
            </p>
          </div>

          {/* Stringer Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-gray-900">{stringer.full_name}</p>
              <p className="text-sm text-gray-500">Your Stringer</p>
            </div>
          </div>

          {request.estimated_completion && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
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

          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message {stringer.full_name}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // In Progress - simple status (no step-by-step tasks)
  if (request.status === 'in_progress') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold">Being Strung</h2>
              <p className="text-blue-100 text-sm">Your racket is in progress</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stringer Info */}
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg mb-6">
            <img
              src={stringer.avatar_url || '/default-avatar.png'}
              alt={stringer.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-blue-300"
            />
            <div>
              <p className="font-semibold text-gray-900">{stringer.full_name}</p>
              <p className="text-sm text-blue-600">Currently working on your racket</p>
            </div>
          </div>

          {request.estimated_completion && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>
                Estimated ready: {new Date(request.estimated_completion).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              🎾 {stringer.full_name} is stringing your racket. You'll be notified when it's ready for pickup!
            </p>
          </div>

          <Link href={`/messages?conversation=${stringer.id}`}>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message {stringer.full_name}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Ready for Pickup
  if (request.status === 'ready_for_pickup') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-white">
              <h2 className="text-lg font-bold">Ready for Pickup!</h2>
              <p className="text-green-100 text-sm">Your racket is done</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Racket is Ready!
            </h3>
            <p className="text-gray-600 mb-6">
              Pick up your freshly strung racket from {stringer.full_name}
            </p>

            {/* Completion Photo */}
            {request.completion_photo_url && (
              <div className="mb-6">
                <img
                  src={request.completion_photo_url}
                  alt="Completed racket"
                  className="w-full max-w-md mx-auto rounded-lg border shadow-sm cursor-pointer"
                  onClick={() => window.open(request.completion_photo_url!, '_blank')}
                />
              </div>
            )}

            {/* Completion Notes */}
            {request.completion_notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="font-medium text-gray-900 mb-2">Stringer Notes</h4>
                <p className="text-sm text-gray-700">{request.completion_notes}</p>
              </div>
            )}

            <Button
              onClick={completeRequest}
              disabled={isCompleting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm Pickup
            </Button>

            <Link href={`/messages?conversation=${stringer.id}`}>
              <Button variant="outline" className="w-full mt-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {stringer.full_name}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Completed
  if (request.status === 'completed') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Request Completed
          </h3>
          <p className="text-gray-600 mb-6">
            Completed on {request.completed_at && new Date(request.completed_at).toLocaleDateString()}
          </p>

          {request.completion_photo_url && (
            <div className="mb-6">
              <img
                src={request.completion_photo_url}
                alt="Completed racket"
                className="w-full max-w-md mx-auto rounded-lg border shadow-sm"
              />
            </div>
          )}

          {request.completion_notes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
              <h4 className="font-medium text-gray-900 mb-2">Stringer Notes</h4>
              <p className="text-sm text-gray-700">{request.completion_notes}</p>
            </div>
          )}

          <Button variant="outline" className="w-full">
            Leave a Review
          </Button>
        </div>
      </div>
    )
  }

  return null
}
