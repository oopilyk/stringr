'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@stringerly/ui'
import { CreateRequestDialog } from '@/components/requests/create-request-dialog'
import { Star, MapPin, Clock, DollarSign, Check, MessageSquare, Grid, Award } from 'lucide-react'
import { formatPrice, formatDuration, formatTimeRange } from '@stringerly/ui'
import type { StringerSearchResult } from '@stringerly/types'

export default function StringerProfileViewPage() {
  const params = useParams()
  const router = useRouter()
  const { profile: currentUser } = useAuth()
  const supabase = createClient()
  const [stringer, setStringer] = useState<StringerSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    if (params.id) {
      loadStringerProfile(params.id as string)
      loadReviews(params.id as string)
    }
  }, [params.id])

  const loadStringerProfile = async (stringerId: string) => {
    try {
      // Try to load from database first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', stringerId)
        .single()

      if (!profileError && profileData) {
        // Load stringer settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('stringer_settings')
          .select('*')
          .eq('id', stringerId)
          .single()

        // Determine if this is a stringer or player based on settings
        const isStringerProfile = !settingsError && settingsData
        const reviewType = isStringerProfile ? 'stringer_review' : 'player_review'

        // Fetch aggregated rating from user_ratings view
        const { data: ratingData } = await supabase
          .from('user_ratings')
          .select('*')
          .eq('user_id', stringerId)
          .eq('review_type', reviewType)
          .maybeSingle()

        const rating = {
          stringer_id: stringerId,
          avg_rating: ratingData?.avg_rating || 0,
          review_count: ratingData?.review_count || 0
        }

        if (!settingsError && settingsData) {
          // User is a stringer
          setStringer({
            ...profileData,
            stringer_settings: settingsData,
            rating
          } as StringerSearchResult)
          setIsLoading(false)
          return
        } else {
          // User exists but is not a stringer - show basic profile with player rating
          setStringer({
            ...profileData,
            stringer_settings: null,
            rating
          } as any)
          setIsLoading(false)
          return
        }
      }

      // Fallback to demo data if not found in database
      const demoStringers = getSampleStringers()
      const demoStringer = demoStringers.find(s => s.id === stringerId)

      if (demoStringer) {
        setStringer(demoStringer)
      }

    } catch (error) {
      console.error('Error loading stringer:', error)

      // Try demo data on error
      const demoStringers = getSampleStringers()
      const demoStringer = demoStringers.find(s => s.id === stringerId)

      if (demoStringer) {
        setStringer(demoStringer)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadReviews = async (userId: string) => {
    try {
      // Fetch reviews for this user
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
        return
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([])
        return
      }

      // Fetch reviewer profiles separately
      const reviewerIds = reviewsData.map(r => r.reviewer_id)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds)

      if (profilesError) {
        console.error('Error fetching reviewer profiles:', profilesError)
        setReviews(reviewsData) // Still set reviews even if profiles fail
        return
      }

      // Combine reviews with reviewer profiles
      const reviewsWithProfiles = reviewsData.map(review => ({
        ...review,
        reviewer: profilesData?.find(p => p.id === review.reviewer_id)
      }))

      setReviews(reviewsWithProfiles)

      // Update the stringer's rating based on actual reviews
      if (reviewsWithProfiles.length > 0) {
        const avgRating = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0) / reviewsWithProfiles.length
        setStringer(prev => prev ? {
          ...prev,
          rating: {
            stringer_id: userId,
            avg_rating: avgRating,
            review_count: reviewsWithProfiles.length
          }
        } : null)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  // Sample stringers data (same as discover page)
  const getSampleStringers = (): StringerSearchResult[] => {
    return [
      {
        id: '1',
        full_name: 'Marco Rodriguez',
        bio: 'Professional tennis stringer with 15+ years experience. Former college player and certified Master Racquet Technician.',
        city: 'Baltimore, MD',
        lat: 39.2904,
        lng: -76.6122,
        years_experience: 15,
        certifications: ['USRSA Master', 'ERSA Certified'],
        rackets_strung_count: 2500,
        stringing_location: 'Tennis club',
        player_levels_served: ['Intermediate', 'Advanced', 'Tournament', 'Professional'],
        stringer_settings: {
          id: '1',
          base_price_cents: 2500,
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 800,
          max_daily_jobs: 8,
          pricing_notes: 'String cost not included. Natural gut available for +$15. Free grip replacement with stringing.',
          discount_bulk_jobs: 10,
          machine_brand: 'Babolat',
          machine_model: 'Star 5',
          machine_type: 'electronic',
          max_tension: 80,
          supported_racket_types: ['Tennis', 'Badminton', 'Squash'],
          accepts_player_strings: true,
          flexible_availability: false,
          dropoff_methods: [
            { method: 'dropoff' as const, enabled: true, details: 'Can meet at local tennis courts or coffee shops in Baltimore area' },
            { method: 'dropoff' as const, enabled: true, details: 'Free pickup within 10 miles, $5 fee for 10-20 miles' },
            { method: 'dropoff' as const, enabled: true, details: 'Available at Baltimore Tennis Club, 123 Court St, 9am-8pm daily' }
          ],
          services: [
            { name: 'Standard Restring', price_cents: 2500 },
            { name: 'Premium String', price_cents: 3500 },
            { name: 'Hybrid Setup', price_cents: 4000 }
          ],
          string_inventory: [
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', price_cents: 1800, quantity: 10 },
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17', price_cents: 1600, quantity: 8 },
            { brand: 'Wilson', model: 'NXT', gauge: '16', price_cents: 1200, quantity: 12 }
          ],
          availability: [
            { dow: 1, start: '17:00', end: '21:00' },
            { dow: 2, start: '17:00', end: '21:00' },
            { dow: 3, start: '17:00', end: '21:00' },
            { dow: 4, start: '17:00', end: '21:00' },
            { dow: 6, start: '09:00', end: '17:00' },
            { dow: 0, start: '09:00', end: '17:00' }
          ]
        },
        rating: {
          stringer_id: '1',
          avg_rating: 4.8,
          review_count: 127
        }
      },
      {
        id: '2',
        full_name: 'Sarah Chen',
        bio: 'Tennis coach and certified stringer specializing in high-performance strings. Quick turnaround and competitive pricing.',
        city: 'Baltimore, MD',
        lat: 39.3404,
        lng: -76.5822,
        years_experience: 10,
        certifications: ['USRSA Certified'],
        rackets_strung_count: 1800,
        stringing_location: 'Home shop',
        player_levels_served: ['Beginner', 'Intermediate', 'Advanced', 'Tournament'],
        stringer_settings: {
          id: '2',
          base_price_cents: 3000,
          turnaround_hours: 12,
          accepts_rush: true,
          rush_fee_cents: 1000,
          max_daily_jobs: 6,
          pricing_notes: 'Same-day service available! String cost separate. Premium strings in stock.',
          discount_bulk_jobs: 15,
          machine_brand: 'Gamma',
          machine_model: 'X-6FC',
          machine_type: 'crank',
          max_tension: 75,
          supported_racket_types: ['Tennis', 'Squash'],
          accepts_player_strings: true,
          flexible_availability: false,
          dropoff_methods: [
            { method: 'dropoff' as const, enabled: true, details: 'Happy to meet at local parks or tennis facilities' },
            { method: 'dropoff' as const, enabled: true, details: 'USPS Priority Mail return shipping included in price' },
            { method: 'dropoff' as const, enabled: true, details: '456 Elm Ave, secure lockbox available 24/7' }
          ],
          services: [
            { name: 'Express Restring', price_cents: 3000 },
            { name: 'Tournament Prep', price_cents: 4500 },
            { name: 'String Consultation', price_cents: 5000 }
          ],
          string_inventory: [
            { brand: 'Solinco', model: 'Tour Bite', gauge: '17', price_cents: 1400, quantity: 6 },
            { brand: 'Technifibre', model: 'Black Code', gauge: '16', price_cents: 1500, quantity: 5 }
          ],
          availability: [
            { dow: 1, start: '18:00', end: '20:00' },
            { dow: 3, start: '18:00', end: '20:00' },
            { dow: 5, start: '18:00', end: '20:00' },
            { dow: 6, start: '10:00', end: '18:00' },
            { dow: 0, start: '10:00', end: '18:00' }
          ]
        },
        rating: {
          stringer_id: '2',
          avg_rating: 4.9,
          review_count: 89
        }
      },
      {
        id: '3',
        full_name: 'David Thompson',
        bio: 'Budget-friendly stringing service. Great for recreational players. Available weekends and evenings.',
        city: 'Baltimore, MD',
        lat: 39.2704,
        lng: -76.6522,
        years_experience: 5,
        certifications: ['Self-taught'],
        rackets_strung_count: 650,
        stringing_location: 'Mobile service',
        player_levels_served: ['Beginner', 'Intermediate'],
        stringer_settings: {
          id: '3',
          base_price_cents: 2000,
          turnaround_hours: 48,
          accepts_rush: false,
          rush_fee_cents: 0,
          max_daily_jobs: 4,
          pricing_notes: 'Best rates in town! Strings available at cost. Weekend appointments preferred.',
          discount_bulk_jobs: 5,
          machine_brand: 'Prince',
          machine_model: 'Neos 1000',
          machine_type: 'drop-weight',
          max_tension: 70,
          supported_racket_types: ['Tennis', 'Badminton'],
          accepts_player_strings: true,
          flexible_availability: true,
          dropoff_methods: [
            { method: 'dropoff' as const, enabled: true, details: 'Flexible meeting locations throughout Baltimore' },
            { method: 'dropoff' as const, enabled: true, details: 'Free pickup anywhere in Baltimore city limits' }
          ],
          services: [
            { name: 'Basic Restring', price_cents: 2000 },
            { name: 'Synthetic Gut', price_cents: 2200 },
            { name: 'Multifilament', price_cents: 2800 }
          ],
          string_inventory: [
            { brand: 'Prince', model: 'Synthetic Gut', gauge: '16', price_cents: 800, quantity: 15 },
            { brand: 'Gamma', model: 'TNT2', gauge: '17', price_cents: 900, quantity: 10 }
          ],
          availability: []
        },
        rating: {
          stringer_id: '3',
          avg_rating: 4.6,
          review_count: 34
        }
      }
    ]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stringer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Stringer not found</h1>
            <Button onClick={() => router.push('/')} className="mt-4">
              Back to Discover
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const rating = stringer.rating?.avg_rating || 0
  const reviewCount = stringer.rating?.review_count || 0
  const settings = stringer.stringer_settings

  // Mock racket gallery (will be populated from database later)
  const racketImages = [
    'https://via.placeholder.com/400x400/34d399/ffffff?text=Racket+1',
    'https://via.placeholder.com/400x400/3b82f6/ffffff?text=Racket+2',
    'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Racket+3',
    'https://via.placeholder.com/400x400/f59e0b/ffffff?text=Racket+4',
    'https://via.placeholder.com/400x400/ec4899/ffffff?text=Racket+5',
    'https://via.placeholder.com/400x400/10b981/ffffff?text=Racket+6',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header - Instagram Style */}
        <div className="bg-white rounded-lg shadow p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary/10 flex items-center justify-center">
                {stringer.avatar_url ? (
                  <img
                    src={stringer.avatar_url}
                    alt={stringer.full_name || 'Stringer'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl md:text-6xl font-bold text-primary">
                    {stringer.full_name?.[0] || 'S'}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {stringer.full_name}
                  </h1>
                  {settings ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Stringer
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Player
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Row - Instagram Style */}
              <div className="flex items-center space-x-8 mb-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {stringer.rackets_strung_count || 0}
                  </div>
                  <div className="text-sm text-gray-600">rackets</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {reviewCount}
                  </div>
                  <div className="text-sm text-gray-600">reviews</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {reviewCount > 0 ? (
                      <>
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xl font-bold text-gray-900">
                          {rating.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-400">
                        N/A
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">rating</div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{stringer.city}</span>
              </div>

              {/* Bio */}
              {stringer.bio && (
                <div className="mb-4">
                  <p className="text-gray-700">{stringer.bio}</p>
                </div>
              )}

              {/* Experience & Certifications */}
              <div className="flex flex-wrap gap-2 mb-4">
                {stringer.years_experience && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    <Award className="w-4 h-4 mr-1" />
                    {stringer.years_experience}+ years
                  </span>
                )}
                {stringer.certifications?.map((cert: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    <Check className="w-4 h-4 mr-1" />
                    {cert}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {settings && (
                  <Button
                    onClick={() => router.push(`/request/new?stringer_id=${params.id}`)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Request Service
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={settings ? "border-2" : "border-2 flex-1"}
                  onClick={async () => {
                    try {
                      // Create or get conversation with this user
                      const response = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ otherUserId: params.id })
                      })

                      if (response.ok) {
                        const { conversationId } = await response.json()
                        router.push(`/messages?conversation=${conversationId}`)
                      } else {
                        console.error('Failed to create conversation')
                        router.push('/messages')
                      }
                    } catch (error) {
                      console.error('Error creating conversation:', error)
                      router.push('/messages')
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Services Card - Only show for stringers */}
        {settings && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing & Services</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-lg font-bold text-gray-900 mb-1">
                <DollarSign className="w-5 h-5" />
                <span>{formatPrice(settings.base_price_cents)}</span>
              </div>
              <p className="text-sm text-gray-600">Base price</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-lg font-bold text-gray-900 mb-1">
                <Clock className="w-5 h-5" />
                <span>{formatDuration(settings.turnaround_hours)}</span>
              </div>
              <p className="text-sm text-gray-600">Turnaround</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900 mb-1">
                {settings.accepts_rush ? '⚡ Rush Available' : '📅 Standard Only'}
              </div>
              <p className="text-sm text-gray-600">
                {settings.accepts_rush ? `+${formatPrice(settings.rush_fee_cents)}` : 'No rush'}
              </p>
            </div>
          </div>

          {/* Pricing Notes */}
          {settings.pricing_notes && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900"><span className="font-semibold">Pricing Notes:</span> {settings.pricing_notes}</p>
            </div>
          )}

          {/* Bulk Discount */}
          {settings.discount_bulk_jobs && settings.discount_bulk_jobs > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900"><span className="font-semibold">Bulk Discount:</span> {settings.discount_bulk_jobs}% off for 3+ rackets</p>
            </div>
          )}

          {/* Services List */}
          {settings.services && Array.isArray(settings.services) && settings.services.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Services Offered</h3>
              <div className="space-y-2">
                {settings.services.map((service: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-gray-700">{service.name}</span>
                    <span className="font-semibold text-gray-900">{formatPrice(service.price_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Equipment & Capabilities - Only show for stringers */}
        {settings && (settings.machine_brand || settings.machine_model || settings.max_tension || (settings.supported_racket_types && settings.supported_racket_types.length > 0)) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Equipment & Capabilities</h2>

            <div className="space-y-4">
              {/* Machine Details */}
              {(settings.machine_brand || settings.machine_model || settings.machine_type) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Stringing Machine</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    {settings.machine_brand && (
                      <p><span className="font-medium">Brand:</span> {settings.machine_brand}</p>
                    )}
                    {settings.machine_model && (
                      <p><span className="font-medium">Model:</span> {settings.machine_model}</p>
                    )}
                    {settings.machine_type && (
                      <p><span className="font-medium">Type:</span> {settings.machine_type.charAt(0).toUpperCase() + settings.machine_type.slice(1)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Max Tension */}
              {settings.max_tension && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Maximum Tension:</span> {settings.max_tension} lbs
                  </p>
                </div>
              )}

              {/* Supported Racket Types */}
              {settings.supported_racket_types && settings.supported_racket_types.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Racket Types Serviced</h3>
                  <div className="flex flex-wrap gap-2">
                    {settings.supported_racket_types.map((type: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Background Details - Only show for stringers */}
        {settings && (stringer.stringing_location || (stringer.player_levels_served && stringer.player_levels_served.length > 0)) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Background & Expertise</h2>

            <div className="space-y-4">
              {/* Stringing Location */}
              {stringer.stringing_location && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Stringing Location:</span> {stringer.stringing_location}
                  </p>
                </div>
              )}

              {/* Player Levels Served */}
              {stringer.player_levels_served && stringer.player_levels_served.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Player Levels Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {stringer.player_levels_served.map((level: string, i: number) => (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability & Logistics - Only show for stringers */}
        {settings && ((settings.dropoff_methods && settings.dropoff_methods.length > 0) || settings.max_daily_jobs || (settings.availability && settings.availability.length > 0) || settings.flexible_availability) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Availability & Logistics</h2>

            <div className="space-y-4">
              {/* Dropoff Methods */}
              {settings.dropoff_methods && settings.dropoff_methods.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Dropoff Options</h3>
                  <div className="space-y-2">
                    {settings.dropoff_methods.map((method: any, i: number) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 capitalize">
                            {method.method === 'meetup' && '🤝 Meet-up'}
                            {method.method === 'pickup' && '🚗 Pick-up'}
                            {method.method === 'ship' && '📦 Shipping'}
                            {method.method === 'dropbox' && '📮 Drop-box'}
                          </span>
                        </div>
                        {method.details && (
                          <p className="text-sm text-gray-600 mt-1">{method.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Strings Acceptance */}
              {settings.accepts_player_strings !== undefined && (
                <div className={`p-4 rounded-lg ${settings.accepts_player_strings ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${settings.accepts_player_strings ? 'text-green-900' : 'text-gray-700'}`}>
                    <span className="font-semibold">Player-Provided Strings:</span> {settings.accepts_player_strings ? '✓ Accepted' : '✗ Not accepted'}
                  </p>
                </div>
              )}

              {/* Flexible Availability or Schedule */}
              {settings.flexible_availability ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">⏰ Flexible Availability:</span> Dropoffs accepted at any time
                  </p>
                </div>
              ) : settings.availability && settings.availability.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Weekly Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {settings.availability.map((block: any, i: number) => {
                      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      return (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <span className="font-medium text-gray-900">{days[block.dow]}:</span>{' '}
                          <span className="text-gray-700">{formatTimeRange(block.start, block.end)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Max Daily Jobs */}
              {settings.max_daily_jobs && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Maximum Daily Jobs:</span> {settings.max_daily_jobs} rackets per day
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Racket Gallery - Only show for stringers */}
        {settings && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Grid className="w-5 h-5 mr-2" />
                Racket Gallery
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {racketImages.map((image, index) => (
                <div key={index} className="aspect-square relative group cursor-pointer overflow-hidden rounded-sm">
                  <img
                    src={image}
                    alt={`Racket ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* String Inventory */}
        {settings && settings.string_inventory && Array.isArray(settings.string_inventory) && settings.string_inventory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">String Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.string_inventory.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-gray-900">{item.brand} {item.model}</div>
                    <div className="text-sm text-gray-600">{item.gauge}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{formatPrice(item.price_cents)}</div>
                    <div className="text-sm text-gray-600">In stock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">
                {settings ? 'Be the first to book and review!' : 'No reviews from stringers yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/stringer/${review.reviewer_id}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                      {review.reviewer?.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.full_name || 'Reviewer'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-sm font-semibold">
                            {review.reviewer?.full_name?.[0] || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">
                        {review.reviewer?.full_name || 'Anonymous'}
                      </span>
                    </Link>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-gray-200 text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Request Dialog */}
      {stringer && stringer.stringer_settings && (
        <CreateRequestDialog
          stringer={stringer}
          isOpen={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          onSuccess={() => {
            setIsRequestDialogOpen(false)
            router.push('/dashboard')
          }}
        />
      )}
    </div>
  )
}
