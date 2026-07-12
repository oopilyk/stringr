'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@stringerly/ui'
import { Check, Loader2, Camera, Clock, ChevronRight, X, MessageSquare, Edit, AlertTriangle, CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@stringerly/ui'
import { EditQuoteModal } from './edit-quote-modal'

interface Request {
  id: string
  status: string
  estimated_completion: string | null
  work_started_at: string | null
  ready_at: string | null
  estimated_price_cents: number
  final_price_cents?: number | null
  payment_intent_id?: string | null
  payment_authorized_at?: string | null
  player_id: string
  service_type: string
  racket_photo_url: string
  string_selection: {
    brand: string
    model: string
  }
  tension_mains_lbs: number
  tension_crosses_lbs: number
  completion_photo_url?: string | null
  // Pickup window fields
  pickup_deadline?: string | null
  extension_requested_at?: string | null
  extension_request_reason?: string | null
  extension_approved?: boolean | null
}

interface Profile {
  full_name: string
  avatar_url?: string
  city?: string
}

interface ActiveJobCardProps {
  request: Request
  player: Profile
}

export function ActiveJobCard({ request, player }: ActiveJobCardProps) {
  const [isMarkingReady, setIsMarkingReady] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState(request.completion_photo_url || '')
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false)
  const [currentFinalPrice, setCurrentFinalPrice] = useState(request.final_price_cents || request.estimated_price_cents)
  const [isRespondingToExtension, setIsRespondingToExtension] = useState(false)
  const [extensionResponseReason, setExtensionResponseReason] = useState('')

  // Extension request status
  const hasExtensionPending = request.extension_requested_at && request.extension_approved === null

  const handleRespondToExtension = async (approved: boolean) => {
    setIsRespondingToExtension(true)
    try {
      const response = await fetch(`/api/requests/${request.id}/respond-extension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          reason: extensionResponseReason.trim() || undefined
        })
      })

      if (response.ok) {
        setExtensionResponseReason('')
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to respond to extension request')
      }
    } catch (error) {
      console.error('Error responding to extension:', error)
      alert('Failed to respond to extension request')
    } finally {
      setIsRespondingToExtension(false)
    }
  }

  const supabase = createClient()
  const router = useRouter()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingPhoto(true)

      // Upload to Supabase Storage
      const fileName = `completion-${request.id}-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage
        .from('request-photos')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('request-photos')
        .getPublicUrl(fileName)

      setCompletionPhotoUrl(publicUrl)
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove this photo?')) return
    setCompletionPhotoUrl('')
  }

  const markReady = async () => {
    if (!completionPhotoUrl) {
      alert('Please upload a completion photo first')
      return
    }

    try {
      setIsMarkingReady(true)

      const response = await fetch(`/api/requests/${request.id}/mark-ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completion_photo_url: completionPhotoUrl
        })
      })

      if (response.ok) {
        alert('Marked as ready for pickup!')
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to mark ready')
      }
    } catch (error) {
      console.error('Error marking ready:', error)
      alert('Failed to mark ready')
    } finally {
      setIsMarkingReady(false)
    }
  }

  // Determine status display
  const isReadyForPickup = request.status === 'ready_for_pickup'
  const isQuotePending = request.status === 'accepted' && !request.payment_authorized_at
  const statusText = isReadyForPickup ? 'Ready for Pickup' :
                     isQuotePending ? 'Awaiting Payment' :
                     request.status === 'accepted' ? 'Accepted' : 'In Progress'
  const headerColor = isReadyForPickup ? 'from-green-600 to-emerald-600' :
                      isQuotePending ? 'from-amber-500 to-orange-500' : 'from-blue-600 to-indigo-600'
  const bgColor = isReadyForPickup ? 'from-green-50 to-emerald-50' :
                  isQuotePending ? 'from-amber-50 to-orange-50' : 'from-blue-50 to-indigo-50'
  const borderColor = isReadyForPickup ? 'border-green-200' :
                      isQuotePending ? 'border-amber-200' : 'border-blue-200'
  const iconColor = isReadyForPickup ? 'text-green-600' :
                    isQuotePending ? 'text-amber-600' : 'text-blue-600'


  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-xl shadow-lg border-2 ${borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerColor} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              {isReadyForPickup ? (
                <Check className={`w-6 h-6 ${iconColor}`} />
              ) : isQuotePending ? (
                <Clock className={`w-6 h-6 ${iconColor}`} />
              ) : (
                <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isReadyForPickup ? 'Job Complete' : isQuotePending ? 'Quote Sent' : 'Active Job'}
              </h2>
              <p className={`${isReadyForPickup ? 'text-green-100' : isQuotePending ? 'text-amber-100' : 'text-blue-100'} text-sm`}>{statusText}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {formatPrice(currentFinalPrice)}
            </div>
            <p className="text-blue-100 text-xs">{currentFinalPrice !== request.estimated_price_cents ? 'Final Quote' : 'Estimated'}</p>
          </div>
        </div>
      </div>

      {/* Player Info */}
      <div className="p-6 border-b border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={player.avatar_url || '/default-avatar.png'}
              alt={player.full_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-300"
            />
            <div>
              <p className="font-semibold text-gray-900">{player.full_name}</p>
              <p className="text-sm text-gray-600">
                {request.string_selection?.brand} {request.string_selection?.model} • {request.tension_mains_lbs}/{request.tension_crosses_lbs} lbs
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/messages?player_id=${request.player_id}`)}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/request/${request.id}`)}
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {request.estimated_completion && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Due: {new Date(request.estimated_completion).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
        )}
      </div>

      {/* Quote Pending - Waiting for Player Payment */}
      {isQuotePending && (
        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-b-2 border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Waiting for Player to Authorize Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your quote of <span className="font-semibold text-amber-700">{formatPrice(currentFinalPrice)}</span> has been sent to {player.full_name}.
                Once they authorize payment, you can start the job.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/request/${request.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Player
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditQuoteModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ready for Pickup Section */}
      {isReadyForPickup && (
        <div className="p-6 border-t border-green-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Job Complete!</span>
            </div>
            <p className="text-sm text-green-700">
              This racket is ready for {player.full_name} to pick up. Waiting for player confirmation.
            </p>
          </div>

          {/* Pickup Deadline Info */}
          {request.pickup_deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <CalendarClock className="w-4 h-4" />
              <span>Pickup deadline: {new Date(request.pickup_deadline).toLocaleString()}</span>
            </div>
          )}

          {/* Extension Request Banner */}
          {hasExtensionPending && (
            <div className="mb-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Extension Request from {player.full_name}</p>
                  <p className="text-sm text-amber-700 mb-3">
                    "{request.extension_request_reason}"
                  </p>

                  <div className="space-y-2">
                    <textarea
                      value={extensionResponseReason}
                      onChange={(e) => setExtensionResponseReason(e.target.value)}
                      placeholder="Optional: Add a note with your response..."
                      className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespondToExtension(true)}
                        disabled={isRespondingToExtension}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                        size="sm"
                      >
                        {isRespondingToExtension ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Approve (+24h)
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRespondToExtension(false)}
                        disabled={isRespondingToExtension}
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-sm"
                        size="sm"
                      >
                        {isRespondingToExtension ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Deny
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {request.ready_at && (
            <p className="text-sm text-gray-600 mb-4">
              Marked ready: {new Date(request.ready_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/request/${request.id}`)}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* In Progress - Show completion section */}
      {!isReadyForPickup && !isQuotePending && (
        <div className="p-6 bg-gradient-to-br from-white to-blue-50">
          {/* Photo Upload Section */}
          {!completionPhotoUrl ? (
            <div className="mb-4 p-4 bg-white border-2 border-blue-300 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Upload Completion Photo</h3>
                  <p className="text-sm text-gray-600">
                    Take a photo of the finished racket before marking as complete
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                id="photo-upload"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <label htmlFor="photo-upload">
                <Button
                  className="w-full cursor-pointer"
                  disabled={uploadingPhoto}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('photo-upload')?.click()
                  }}
                >
                  {uploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </label>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-800">Completion photo uploaded!</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <img
                    src={completionPhotoUrl}
                    alt="Completion"
                    className="w-full max-h-48 object-contain rounded-lg bg-white cursor-pointer border border-green-200"
                    onClick={() => window.open(completionPhotoUrl, '_blank')}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="change-photo-upload"
                  />
                  <label htmlFor="change-photo-upload">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      disabled={uploadingPhoto}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('change-photo-upload')?.click()
                      }}
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Change Photo
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={markReady}
            disabled={!completionPhotoUrl || isMarkingReady}
          >
            {isMarkingReady ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Mark Complete & Ready for Pickup
          </Button>
        </div>
      )}

      {/* Edit Quote Modal */}
      {showEditQuoteModal && (
        <EditQuoteModal
          request={{
            id: request.id,
            final_price_cents: currentFinalPrice,
            estimated_price_cents: request.estimated_price_cents
          }}
          playerName={player.full_name}
          onSave={async (newPriceCents) => {
            const response = await fetch(`/api/requests/${request.id}/update-quote`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ final_price_cents: newPriceCents })
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || 'Failed to update quote')
            }

            setCurrentFinalPrice(newPriceCents)
            setShowEditQuoteModal(false)
          }}
          onCancel={() => setShowEditQuoteModal(false)}
        />
      )}
    </div>
  )
}
