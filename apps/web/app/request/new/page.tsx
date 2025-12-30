'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@stringr/ui'
import { RacketPhotoUpload } from '@/components/request/racket-photo-upload'
import { MessageSquare, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface StringInventoryItem {
  brand: string
  model: string
  gauge: string
  quantity: number
  price_cents: number
}

interface DropoffMethod {
  method: string
  details?: string
}

interface AvailabilitySlot {
  dow: number
  start: string
  end: string
}

interface StringerSettings {
  string_inventory: StringInventoryItem[]
  dropoff_methods: DropoffMethod[]
  max_tension: number
  base_price_cents: number
  turnaround_hours: number
  rush_fee_cents: number
  accepting_requests: boolean
  flexible_availability: boolean
  availability: AvailabilitySlot[]
}

function NewRequestForm() {
  const searchParams = useSearchParams()
  const stringerId = searchParams.get('stringer_id')
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()

  // Form state
  const [racketPhotoUrl, setRacketPhotoUrl] = useState('')
  const [serviceType, setServiceType] = useState('restring_only')
  const [selectedString, setSelectedString] = useState<StringInventoryItem | null>(null)
  const [tensionMains, setTensionMains] = useState(55)
  const [tensionCrosses, setTensionCrosses] = useState(55)
  const [sameTension, setSameTension] = useState(true)
  const [stringPattern, setStringPattern] = useState('existing')
  const [selectedDropoff, setSelectedDropoff] = useState<DropoffMethod | null>(null)
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<{day: string, start: string, end: string} | null>(null)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [preferredDate, setPreferredDate] = useState('')

  // Data state
  const [stringerProfile, setStringerProfile] = useState<any>(null)
  const [stringerSettings, setStringerSettings] = useState<StringerSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!stringerId) {
      setError('No stringer specified')
      setIsLoading(false)
      return
    }

    loadStringerData()
  }, [stringerId])

  const loadStringerData = async () => {
    try {
      // Load stringer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', stringerId)
        .single()

      if (profileError) throw profileError
      setStringerProfile(profileData)

      // Load stringer settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', stringerId)
        .single()

      if (settingsError) throw settingsError
      setStringerSettings(settingsData)

      // Set default string if available
      if (settingsData.string_inventory?.length > 0) {
        setSelectedString(settingsData.string_inventory[0])
      }

      // Set default dropoff if available
      if (settingsData.dropoff_methods?.length > 0) {
        setSelectedDropoff(settingsData.dropoff_methods[0])
      }
    } catch (err) {
      console.error('Error loading stringer data:', err)
      setError('Failed to load stringer information')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateEstimatedPrice = () => {
    if (!stringerSettings || !selectedString) return 0

    let total = stringerSettings.base_price_cents

    // Add string cost
    total += selectedString.price_cents

    // Add service costs
    const serviceCosts: Record<string, number> = {
      restring_only: 0,
      restring_grip: 500, // $5
      restring_grommets: 1500, // $15
      full_service: 1800, // $18
    }
    total += serviceCosts[serviceType] || 0

    // Check for rush service
    if (preferredDate && stringerSettings.turnaround_hours) {
      const minDate = new Date()
      minDate.setHours(minDate.getHours() + stringerSettings.turnaround_hours)
      const requestedDate = new Date(preferredDate)

      if (requestedDate < minDate) {
        total += stringerSettings.rush_fee_cents || 0
      }
    }

    return total
  }

  const handleNext = () => {
    // Validation
    if (!racketPhotoUrl) {
      setError('Please upload a photo of your racket')
      return
    }

    if (!selectedString) {
      setError('Please select a string')
      return
    }

    if (!selectedDropoff) {
      setError('Please select a dropoff method')
      return
    }

    if (tensionMains > (stringerSettings?.max_tension || 90) ||
        tensionCrosses > (stringerSettings?.max_tension || 90)) {
      setError(`Tension exceeds stringer's maximum of ${stringerSettings?.max_tension} lbs`)
      return
    }

    // Validate time slot if stringer doesn't have flexible availability
    if (!stringerSettings?.flexible_availability && !preferredTimeSlot && stringerSettings?.availability?.length > 0) {
      setError('Please select a preferred dropoff time slot')
      return
    }

    // Save to localStorage and navigate to review
    const requestData = {
      stringer_id: stringerId,
      racket_photo_url: racketPhotoUrl,
      service_type: serviceType,
      string_selection: selectedString,
      tension_mains_lbs: tensionMains,
      tension_crosses_lbs: tensionCrosses,
      string_pattern: stringPattern,
      dropoff_method: selectedDropoff,
      preferred_time_slot: preferredTimeSlot,
      special_instructions: specialInstructions,
      preferred_completion_date: preferredDate || null,
      estimated_price_cents: calculateEstimatedPrice(),
      stringer_name: stringerProfile?.full_name || 'Stringer',
    }

    localStorage.setItem('pending_request', JSON.stringify(requestData))
    router.push('/request/review')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </main>
      </div>
    )
  }

  if (error && !stringerSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  // Check if stringer is accepting requests
  if (stringerSettings && !stringerSettings.accepting_requests) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Not Accepting Requests</h2>
            <p className="text-gray-700 mb-4">
              This stringer is not currently accepting new requests.
            </p>
            <Link href={`/messages?stringer_id=${stringerId}`}>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Stringer
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Check if stringer has no string inventory
  if (stringerSettings && stringerSettings.string_inventory.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <AlertCircle className="w-8 h-8 text-yellow-600 mb-3" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">No Strings Available</h2>
            <p className="text-gray-700 mb-4">
              This stringer hasn't added their string inventory yet. Please message them directly to discuss string options.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              You cannot submit a request until strings are added to their inventory.
            </p>
            <Link href={`/messages?stringer_id=${stringerId}&context=request`}>
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Message Stringer
              </Button>
            </Link>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Stringing Service</h1>
          <p className="text-gray-600">
            from <span className="font-semibold">{stringerProfile?.full_name || 'Stringer'}</span>
          </p>
        </div>

        {/* Message Stringer Link */}
        <Link href={`/messages?stringer_id=${stringerId}&context=request`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <MessageSquare className="w-4 h-4 mr-2" />
            Have questions? Message {stringerProfile?.full_name?.split(' ')[0] || 'the stringer'}
          </Button>
        </Link>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Racket Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Racket Photo <span className="text-red-500">*</span>
            </label>
            <RacketPhotoUpload
              onUploadComplete={setRacketPhotoUrl}
              initialPhotoUrl={racketPhotoUrl}
            />
          </div>

          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Service Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'restring_only', label: 'Restring Only', cost: 0 },
                { value: 'restring_grip', label: 'Restring + New Grip', cost: 5 },
                { value: 'restring_grommets', label: 'Restring + Grommet Replacement', cost: 15 },
                { value: 'full_service', label: 'Full Service (Restring + Grip + Grommets)', cost: 18 },
              ].map((option) => (
                <label key={option.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="serviceType"
                    value={option.value}
                    checked={serviceType === option.value}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="mr-3"
                  />
                  <span className="flex-1">{option.label}</span>
                  {option.cost > 0 && (
                    <span className="text-sm text-gray-600">+${option.cost}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* String Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              String <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedString ? `${selectedString.brand}-${selectedString.model}-${selectedString.gauge}` : ''}
              onChange={(e) => {
                const selected = stringerSettings?.string_inventory.find(
                  s => `${s.brand}-${s.model}-${s.gauge}` === e.target.value
                )
                setSelectedString(selected || null)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {stringerSettings?.string_inventory.map((string, idx) => (
                <option key={idx} value={`${string.brand}-${string.model}-${string.gauge}`}>
                  {string.brand} {string.model} {string.gauge} - ${(string.price_cents / 100).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Don't see your preferred string?{' '}
              <Link href={`/messages?stringer_id=${stringerId}`} className="text-primary hover:underline">
                Ask the stringer
              </Link>
            </p>
          </div>

          {/* Tension */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Desired Tension
            </label>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sameTension}
                  onChange={(e) => {
                    setSameTension(e.target.checked)
                    if (e.target.checked) setTensionCrosses(tensionMains)
                  }}
                  className="mr-2"
                />
                <span className="text-sm">Same tension mains & crosses</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Mains</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={tensionMains}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setTensionMains(value)
                    if (sameTension) setTensionCrosses(value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Crosses</label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={tensionCrosses}
                  onChange={(e) => setTensionCrosses(parseInt(e.target.value))}
                  disabled={sameTension}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Typical range: 50-65 lbs. Max for this stringer: {stringerSettings?.max_tension} lbs
            </p>
            {(tensionMains > (stringerSettings?.max_tension || 90) || tensionCrosses > (stringerSettings?.max_tension || 90)) && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Tension exceeds stringer's maximum
              </p>
            )}
          </div>

          {/* String Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              String Pattern
            </label>
            <div className="space-y-2">
              {[
                { value: 'existing', label: 'Keep existing pattern' },
                { value: 'two_piece', label: 'Change to 2-piece' },
                { value: 'one_piece', label: 'Change to 1-piece' },
                { value: 'ask_stringer', label: 'Not sure - ask the stringer' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="stringPattern"
                    value={option.value}
                    checked={stringPattern === option.value}
                    onChange={(e) => setStringPattern(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dropoff Method */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Dropoff Method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {stringerSettings?.dropoff_methods.map((method, idx) => (
                <label key={idx} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dropoff"
                    checked={selectedDropoff?.method === method.method}
                    onChange={() => setSelectedDropoff(method)}
                    className="mr-3 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{method.method.replace(/_/g, ' ')}</div>
                    {method.details && (
                      <div className="text-sm text-gray-600 mt-1">{method.details}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Time Slot */}
          {stringerSettings?.flexible_availability ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ This stringer has flexible availability - you can drop off at any time that works for you!
              </p>
            </div>
          ) : stringerSettings?.availability && stringerSettings.availability.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Preferred Dropoff Time {!stringerSettings?.flexible_availability && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, dow) => {
                  const daySlots = stringerSettings.availability.filter(slot => slot.dow === dow)
                  if (daySlots.length === 0) return null

                  return (
                    <div key={dow}>
                      <div className="font-medium text-sm text-gray-700 mb-1">{day}</div>
                      <div className="space-y-1 ml-4">
                        {daySlots.map((slot, idx) => (
                          <label key={idx} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="timeSlot"
                              checked={preferredTimeSlot?.day === day && preferredTimeSlot?.start === slot.start && preferredTimeSlot?.end === slot.end}
                              onChange={() => setPreferredTimeSlot({ day, start: slot.start, end: slot.end })}
                              className="mr-3"
                            />
                            <span className="text-sm">
                              {slot.start} - {slot.end}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select your preferred dropoff time. The stringer will confirm availability.
              </p>
            </div>
          ) : null}

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Any specific requests? E.g., 'Please check grommet condition'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {specialInstructions.length} / 1000 characters
            </p>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Preferred Completion Date (Optional)
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Standard turnaround: {stringerSettings?.turnaround_hours} hours
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              Review Request
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewRequestForm />
    </Suspense>
  )
}
