'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Button, formatTimeRange } from '@stringerly/ui'
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
  accepts_rush?: boolean
  rush_fee_cents: number
  rush_turnaround_hours?: number
  accepting_requests: boolean
  flexible_availability: boolean
  availability: AvailabilitySlot[]
  accepts_player_strings?: boolean
}

function NewRequestForm() {
  const searchParams = useSearchParams()
  const stringerId = searchParams.get('stringer_id')
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()

  // Form state
  const [racketPhotoUrl, setRacketPhotoUrl] = useState('')
  const serviceType = 'restring_only' // MVP: Only support pure restringing
  const [selectedString, setSelectedString] = useState<StringInventoryItem | null>(null)
  const [selectedStringCrosses, setSelectedStringCrosses] = useState<StringInventoryItem | null>(null)
  const [sameString, setSameString] = useState(false)
  const [playerProvidedStringMains, setPlayerProvidedStringMains] = useState(false)
  const [playerProvidedStringCrosses, setPlayerProvidedStringCrosses] = useState(false)
  const [tensionMains, setTensionMains] = useState(55)
  const [tensionCrosses, setTensionCrosses] = useState(55)
  const [sameTension, setSameTension] = useState(false)
  const [stringPattern, setStringPattern] = useState<'existing' | 'two_piece' | 'one_piece' | 'ask_stringer'>('existing')
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

      // MVP: Auto-select the first (and only) dropoff method
      // For MVP, we only support drop-off, so always auto-select it
      if (settingsData.dropoff_methods?.length > 0) {
        setSelectedDropoff(settingsData.dropoff_methods[0])
      } else {
        // If stringer hasn't configured dropoff methods, default to drop-off
        setSelectedDropoff({ method: 'Drop-off', details: '' })
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

    // Add mains string cost (half price if using different crosses string)
    if (sameString) {
      total += selectedString.price_cents
    } else {
      total += selectedString.price_cents / 2
    }

    // Add crosses string cost (half price)
    if (!sameString && selectedStringCrosses) {
      total += selectedStringCrosses.price_cents / 2
    }

    // MVP: No additional service costs - restring only

    // Check for rush service - use rush_turnaround_hours or default to 24 hours
    if (preferredDate && stringerSettings.accepts_rush) {
      const rushHours = Number(stringerSettings.rush_turnaround_hours) || 24

      // Calculate the rush threshold date (just the date, ignoring time)
      const rushThreshold = new Date(Date.now() + rushHours * 60 * 60 * 1000)
      const rushThresholdDate = rushThreshold.toISOString().split('T')[0]

      // Compare dates only - if preferred date is on or before rush threshold date, it's rush
      if (preferredDate <= rushThresholdDate) {
        total += stringerSettings.rush_fee_cents || 0
      }
    }

    return total
  }

  const isRushOrder = () => {
    if (!preferredDate || !stringerSettings?.accepts_rush) return false

    // Use rush_turnaround_hours or default to 24 hours
    const rushHours = Number(stringerSettings.rush_turnaround_hours) || 24

    // Calculate the rush threshold date (just the date, ignoring time)
    const rushThreshold = new Date(Date.now() + rushHours * 60 * 60 * 1000)
    const rushThresholdDate = rushThreshold.toISOString().split('T')[0]

    // Compare dates only - if preferred date is on or before rush threshold date, it's rush
    return preferredDate <= rushThresholdDate
  }

  const handleNext = () => {
    // Validation
    if (!racketPhotoUrl) {
      setError('Please upload a photo of your racket')
      return
    }

    if (!selectedString) {
      setError('Please select a string for mains')
      return
    }

    if (!sameString && !selectedStringCrosses) {
      setError('Please select a string for crosses')
      return
    }

    // MVP: Dropoff method is auto-selected, so no need to validate
    // if (!selectedDropoff) {
    //   setError('Please select a dropoff method')
    //   return
    // }

    if (tensionMains > (stringerSettings?.max_tension || 90) ||
        tensionCrosses > (stringerSettings?.max_tension || 90)) {
      setError(`Tension exceeds stringer's maximum of ${stringerSettings?.max_tension} lbs`)
      return
    }

    // Validate time slot if stringer doesn't have flexible availability
    if (!stringerSettings?.flexible_availability && !preferredTimeSlot && (stringerSettings?.availability?.length ?? 0) > 0) {
      setError('Please select a preferred dropoff time slot')
      return
    }

    // Save to localStorage and navigate to review
    const rushOrder = isRushOrder()
    const requestData = {
      stringer_id: stringerId,
      racket_photo_url: racketPhotoUrl,
      service_type: serviceType,
      string_selection: selectedString,
      string_selection_crosses: sameString ? selectedString : selectedStringCrosses,
      is_hybrid: !sameString,
      same_string: sameString,
      tension_mains_lbs: tensionMains,
      tension_crosses_lbs: tensionCrosses,
      string_pattern: stringPattern,
      dropoff_method: selectedDropoff,
      preferred_time_slot: preferredTimeSlot,
      special_instructions: specialInstructions || null,
      preferred_completion_date: preferredDate || null,
      estimated_price_cents: calculateEstimatedPrice(),
      stringer_name: stringerProfile?.full_name || 'Stringer',
      // Rush order data
      is_rush: rushOrder,
      rush_fee_cents: rushOrder ? (stringerSettings?.rush_fee_cents || 0) : 0,
      base_price_cents: stringerSettings?.base_price_cents || 0,
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

          {/* Same String Checkbox */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={sameString}
                onChange={(e) => {
                  setSameString(e.target.checked)
                  if (e.target.checked) {
                    // When same string is checked, copy mains to crosses
                    setSelectedStringCrosses(selectedString)
                    setPlayerProvidedStringCrosses(playerProvidedStringMains)
                  }
                }}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Use same string for mains and crosses</span>
            </label>
          </div>

          {/* Mains String Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Mains String <span className="text-red-500">*</span>
            </label>
            <select
              value={
                playerProvidedStringMains
                  ? 'player_provided'
                  : selectedString
                    ? `${selectedString.brand}-${selectedString.model}-${selectedString.gauge}`
                    : ''
              }
              onChange={(e) => {
                const selected = stringerSettings?.string_inventory.find(
                  s => `${s.brand}-${s.model}-${s.gauge}` === e.target.value
                )
                setSelectedString(selected || null)
                // If same string is checked, update crosses too
                if (sameString) {
                  setSelectedStringCrosses(selected || null)
                }
              }}
              disabled={playerProvidedStringMains}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select mains string...</option>
              {playerProvidedStringMains && (
                <option value="player_provided">Player Provided String</option>
              )}
              {stringerSettings?.string_inventory.map((string, idx) => (
                <option key={idx} value={`${string.brand}-${string.model}-${string.gauge}`}>
                  {string.brand} {string.model} {string.gauge} - ${sameString ? (string.price_cents / 100).toFixed(2) : (string.price_cents / 200).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Don't see your preferred string?{' '}
              <Link href={`/messages?stringer_id=${stringerId}`} className="text-primary hover:underline">
                Ask the stringer
              </Link>
            </p>

            {/* Player-Provided Mains String Checkbox */}
            {stringerSettings?.accepts_player_strings && (
              <div className="mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={playerProvidedStringMains}
                    onChange={(e) => {
                      setPlayerProvidedStringMains(e.target.checked)
                      if (e.target.checked) {
                        setSelectedString({ brand: 'Player Provided', model: 'N/A', gauge: 'N/A', quantity: 0, price_cents: 0 })
                        if (sameString) {
                          setPlayerProvidedStringCrosses(true)
                          setSelectedStringCrosses({ brand: 'Player Provided', model: 'N/A', gauge: 'N/A', quantity: 0, price_cents: 0 })
                        }
                      } else {
                        setSelectedString(null)
                        if (sameString) {
                          setPlayerProvidedStringCrosses(false)
                          setSelectedStringCrosses(null)
                        }
                      }
                    }}
                    className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    {sameString ? "I'll bring my own string (no charge)" : "I'll bring my own mains string (no charge)"}
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Crosses String Selection */}
          {!sameString && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Crosses String <span className="text-red-500">*</span>
              </label>
              <select
                value={
                  playerProvidedStringCrosses
                    ? 'player_provided'
                    : selectedStringCrosses
                      ? `${selectedStringCrosses.brand}-${selectedStringCrosses.model}-${selectedStringCrosses.gauge}`
                      : ''
                }
                onChange={(e) => {
                  const selected = stringerSettings?.string_inventory.find(
                    s => `${s.brand}-${s.model}-${s.gauge}` === e.target.value
                  )
                  setSelectedStringCrosses(selected || null)
                }}
                disabled={playerProvidedStringCrosses}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select crosses string...</option>
                {playerProvidedStringCrosses && (
                  <option value="player_provided">Player Provided String</option>
                )}
                {stringerSettings?.string_inventory.map((string, idx) => (
                  <option key={idx} value={`${string.brand}-${string.model}-${string.gauge}`}>
                    {string.brand} {string.model} {string.gauge} - ${(string.price_cents / 200).toFixed(2)}
                  </option>
                ))}
              </select>

              {/* Player-Provided Crosses String Checkbox */}
              {stringerSettings?.accepts_player_strings && (
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={playerProvidedStringCrosses}
                      onChange={(e) => {
                        setPlayerProvidedStringCrosses(e.target.checked)
                        if (e.target.checked) {
                          setSelectedStringCrosses({ brand: 'Player Provided', model: 'N/A', gauge: 'N/A', quantity: 0, price_cents: 0 })
                        } else {
                          setSelectedStringCrosses(null)
                        }
                      }}
                      className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">I'll bring my own crosses string (no charge)</span>
                  </label>
                </div>
              )}
            </div>
          )}

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

          {/* Dropoff Method */}
          {stringerSettings?.dropoff_methods && stringerSettings.dropoff_methods.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Drop-off Method <span className="text-red-500">*</span>
              </label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={true}
                    readOnly
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {stringerSettings.dropoff_methods[0].method}
                    </p>
                    {stringerSettings.dropoff_methods[0].details && (
                      <p className="text-sm text-gray-700 mt-1">
                        {stringerSettings.dropoff_methods[0].details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                              {formatTimeRange(slot.start, slot.end)}
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

          {/* Completion Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              When do you need it done?
            </label>

            {/* Turnaround Options */}
            <div className="space-y-3">
              {/* Standard Option */}
              <button
                type="button"
                onClick={() => {
                  // Set date to standard turnaround time
                  const standardDate = new Date()
                  standardDate.setHours(standardDate.getHours() + (stringerSettings?.turnaround_hours || 96))
                  setPreferredDate(standardDate.toISOString().split('T')[0])
                }}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  preferredDate && !isRushOrder()
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      preferredDate && !isRushOrder() ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className="text-lg">📅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Standard Turnaround</p>
                      <p className="text-sm text-gray-500">
                        Ready within {stringerSettings?.turnaround_hours || 96} hours
                        {stringerSettings?.turnaround_hours && (
                          <span className="text-gray-400"> (~{Math.ceil((stringerSettings.turnaround_hours) / 24)} days)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">Included</p>
                    <p className="text-xs text-gray-500">No extra fee</p>
                  </div>
                </div>
              </button>

              {/* Rush Option - Show if stringer accepts rush (default to 24hr threshold if not configured) */}
              {stringerSettings?.accepts_rush && (
                <button
                  type="button"
                  onClick={() => {
                    // Set date based on rush turnaround hours
                    const rushHours = Number(stringerSettings?.rush_turnaround_hours) || 24
                    const rushDate = new Date(Date.now() + rushHours * 60 * 60 * 1000)
                    setPreferredDate(rushDate.toISOString().split('T')[0])
                  }}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    isRushOrder()
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isRushOrder() ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        <span className="text-lg">⚡</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Rush Order</p>
                        <p className="text-sm text-gray-500">
                          Ready within {stringerSettings.rush_turnaround_hours || 24} hours
                          {(stringerSettings.rush_turnaround_hours || 24) < 24 && (
                            <span className="text-amber-600 font-medium"> (Same day)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">
                        +${((stringerSettings?.rush_fee_cents || 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Rush fee</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Flexible / No Rush Option */}
              <button
                type="button"
                onClick={() => setPreferredDate('')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  !preferredDate
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      !preferredDate ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <span className="text-lg">🤝</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">I'm Flexible</p>
                      <p className="text-sm text-gray-500">
                        Let the stringer work at their pace
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">Included</p>
                    <p className="text-xs text-gray-500">No extra fee</p>
                  </div>
                </div>
              </button>

              {/* Custom Date Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const customDateInput = document.getElementById('custom-date-input')
                    if (customDateInput) customDateInput.focus()
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Or choose a specific date...
                </button>
                <input
                  id="custom-date-input"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Rush Order Summary */}
            {isRushOrder() && stringerSettings?.rush_fee_cents && (
              <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">Rush Order Confirmed</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your request will be prioritized and placed at the top of the stringr's queue. 
                      Rush fee of <span className="font-bold">${(stringerSettings.rush_fee_cents / 100).toFixed(2)}</span> added.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
