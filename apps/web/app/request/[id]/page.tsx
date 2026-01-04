'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@stringerly/ui'
import { StatusBadge, formatPrice, formatTimeRange } from '@stringerly/ui'
import { ChevronLeft, Calendar, Clock, MapPin, MessageSquare, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { StringingProgressPanel } from '@/components/requests/stringing-progress-panel'
import { PlayerRequestStatus } from '@/components/requests/player-request-status'
import { AcceptJobModal } from '@/components/requests/accept-job-modal'
import { RequestStatus } from '@stringerly/types'

interface Request {
  id: string
  created_at: string
  status: RequestStatus
  player_id: string
  stringer_id: string
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
  } | null
  special_instructions?: string | null
  preferred_completion_date?: string | null
  estimated_price_cents: number
  final_price_cents?: number | null
  tip_cents?: number
  completion_photo_url: string | null
  completed_at: string | null
  estimated_completion: string | null
  work_started_at: string | null
  ready_at: string | null
  accepted_at: string | null
  completion_notes: string | null
  player?: {
    full_name: string
    avatar_url?: string
    city?: string
  }
  stringer?: {
    full_name: string
  }
}

const serviceTypeLabels: Record<string, string> = {
  restring_only: 'Restring Only',
  restring_grip: 'Restring + Grip Replacement',
  restring_grommets: 'Restring + Grommet Replacement',
  full_service: 'Full Service (Restring + Grip + Grommets)',
}

const stringPatternLabels: Record<string, string> = {
  existing: 'Keep Existing Pattern',
  two_piece: 'Two-Piece Pattern',
  one_piece: 'One-Piece Pattern',
  ask_stringer: 'Ask Stringer for Recommendation',
}

export default function RequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)

  useEffect(() => {
    const fetchRequest = async () => {
      if (!params.id || !user?.id) return

      try {
        // First, fetch the request
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', params.id)
          .single()

        if (requestError) throw requestError

        // Then fetch the player profile
        const { data: playerProfile, error: playerError } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, city')
          .eq('id', requestData.player_id)
          .single()

        if (playerError) {
          console.error('Error fetching player profile:', playerError)
        }

        // Fetch the stringer profile
        const { data: stringerProfile, error: stringerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', requestData.stringer_id)
          .single()

        if (stringerError) {
          console.error('Error fetching stringer profile:', stringerError)
        }

        setRequest({
          ...requestData,
          player: playerProfile || undefined,
          stringer: stringerProfile || undefined,
        })
      } catch (err) {
        console.error('Error fetching request:', err)
        setError('Failed to load request details')
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [params.id, user?.id, supabase])

  const handleAccept = async (acceptData: any) => {
    try {
      setIsAccepting(true)

      const response = await fetch(`/api/requests/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(acceptData)
      })

      if (response.ok) {
        // Force a full page reload to ensure dashboard updates with new data
        window.location.href = '/dashboard'
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to accept request')
      }
    } catch (error) {
      console.error('Error accepting request:', error)
      alert('Failed to accept request')
    } finally {
      setIsAccepting(false)
      setShowAcceptModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading request details...</div>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error || 'Request not found'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isStringer = user?.id === request.stringer_id
  const isPlayer = user?.id === request.player_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* Player Avatar */}
              <Link href={`/stringer/${request.player_id}`}>
                <img
                  src={request.player?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt={request.player?.full_name || 'Player'}
                  className="w-20 h-20 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                />
              </Link>

              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <StatusBadge status={request.status} />
                  <h1 className="text-2xl font-bold text-gray-900">
                    {serviceTypeLabels[request.service_type]}
                  </h1>
                </div>
                <p className="text-gray-600">
                  Request from{' '}
                  <Link
                    href={`/stringer/${request.player_id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {request.player?.full_name}
                  </Link>
                  {request.player?.city && (
                    <span className="text-gray-500"> • {request.player.city}</span>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on {new Date(request.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="text-right">
              {request.status === ('completed' as RequestStatus) ? (
                <>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice((request.final_price_cents || request.estimated_price_cents) + (request.tip_cents || 0))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total Earned</p>
                </>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(request.final_price_cents || request.estimated_price_cents)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Estimated Price</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos Section - Show both for completed requests */}
            {request.status === ('completed' as RequestStatus) && request.completion_photo_url ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Before & After</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Original Racket</p>
                    <img
                      src={request.racket_photo_url}
                      alt="Original Racket"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Strung Racket</p>
                    <img
                      src={request.completion_photo_url}
                      alt="Strung Racket"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Racket Photo</h2>
                <img
                  src={request.racket_photo_url}
                  alt="Racket"
                  className="w-full h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {/* String Specifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">String Specifications</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">String</p>
                  <p className="font-semibold text-gray-900">
                    {request.string_selection.brand} {request.string_selection.model}
                  </p>
                  <p className="text-sm text-gray-600">{request.string_selection.gauge}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">String Cost</p>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(request.string_selection.price_cents)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Tension - Mains</p>
                  <p className="font-semibold text-gray-900">{request.tension_mains_lbs} lbs</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Tension - Crosses</p>
                  <p className="font-semibold text-gray-900">{request.tension_crosses_lbs} lbs</p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-1">String Pattern</p>
                  <p className="font-semibold text-gray-900">
                    {stringPatternLabels[request.string_pattern]}
                  </p>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {request.special_instructions && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Special Instructions</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.special_instructions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary - Only for completed requests */}
            {request.status === ('completed' as RequestStatus) && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-md p-6 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">Financial Summary</h2>
                </div>

                <div className="space-y-4">
                  {/* Job Price */}
                  <div className="flex justify-between items-center pb-3 border-b border-green-200">
                    <span className="text-sm text-gray-600">Job Price</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatPrice(request.final_price_cents || request.estimated_price_cents)}
                    </span>
                  </div>

                  {/* Tip */}
                  {request.tip_cents && request.tip_cents > 0 ? (
                    <div className="flex justify-between items-center pb-3 border-b border-green-200">
                      <span className="text-sm text-gray-600">Tip</span>
                      <span className="text-lg font-semibold text-green-600">
                        +{formatPrice(request.tip_cents)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pb-3 border-b border-green-200">
                      <span className="text-sm text-gray-400">No Tip</span>
                      <span className="text-lg font-semibold text-gray-400">
                        {formatPrice(0)}
                      </span>
                    </div>
                  )}

                  {/* Total Earned */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-semibold text-gray-900">Total Earned</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPrice((request.final_price_cents || request.estimated_price_cents) + (request.tip_cents || 0))}
                    </span>
                  </div>

                  {/* Completion Date */}
                  {request.completed_at && (
                    <div className="pt-3 border-t border-green-200">
                      <p className="text-xs text-gray-500">Completed on</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {new Date(request.completed_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dropoff Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Dropoff Details</h2>

              <div className="space-y-4">
                {request.dropoff_method?.details && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Drop-off Instructions</p>
                      <p className="text-sm text-gray-600 mt-1">{request.dropoff_method.details}</p>
                    </div>
                  </div>
                )}

                {request.preferred_time_slot && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Preferred Time</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {request.preferred_time_slot.day}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTimeRange(request.preferred_time_slot.start, request.preferred_time_slot.end)}
                      </p>
                    </div>
                  </div>
                )}

                {request.preferred_completion_date && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Preferred Completion</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(request.preferred_completion_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions - Only show for pending requests */}
            {isStringer && request.status === ('pending' as RequestStatus) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setShowAcceptModal(true)}
                    disabled={isAccepting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Request
                  </Button>
                  <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline Request
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Player
                  </Button>
                </div>
              </div>
            )}

            {/* Stringing Workflow Progress - Show for accepted/in_progress requests (stringer view) */}
            {isStringer && ['accepted', 'in_progress', 'ready_for_pickup'].includes(request.status) && (
              <StringingProgressPanel request={request} isStringer={true} />
            )}

            {/* Player View - Show workflow progress for players */}
            {isPlayer && ['accepted', 'in_progress', 'ready_for_pickup'].includes(request.status) && request.player && request.stringer && (
              <PlayerRequestStatus
                request={request}
                stringer={{ id: request.stringer_id, full_name: request.stringer.full_name, avatar_url: null }}
              />
            )}

            {(isPlayer || (isStringer && request.status !== ('pending' as RequestStatus))) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Accept Job Modal */}
      {showAcceptModal && request && (
        <AcceptJobModal
          request={request}
          onAccept={handleAccept}
          onCancel={() => setShowAcceptModal(false)}
          isAccepting={isAccepting}
        />
      )}
    </div>
  )
}
