'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@stringr/ui'
import { CreateRequestDialog } from '@/components/requests/create-request-dialog'
import { Star, MapPin, Clock, DollarSign, Check, MessageSquare, Grid, Award } from 'lucide-react'
import { formatPrice, formatDuration } from '@stringr/ui'
import type { StringerSearchResult } from '@stringr/types'

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
        stringer_settings: {
          id: '1',
          base_price_cents: 2500,
          turnaround_hours: 24,
          accepts_rush: true,
          rush_fee_cents: 800,
          max_daily_jobs: 8,
          services: [
            { name: 'Standard Restring', price_cents: 2500 },
            { name: 'Premium String', price_cents: 3500 },
            { name: 'Hybrid Setup', price_cents: 4000 }
          ],
          string_inventory: [
            { brand: 'Luxilon', model: 'ALU Power', gauge: '16L', price_cents: 1800 },
            { brand: 'Babolat', model: 'RPM Blast', gauge: '17', price_cents: 1600 },
            { brand: 'Wilson', model: 'NXT', gauge: '16', price_cents: 1200 }
          ],
          availability: []
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
        stringer_settings: {
          id: '2',
          base_price_cents: 3000,
          turnaround_hours: 12,
          accepts_rush: true,
          rush_fee_cents: 1000,
          max_daily_jobs: 6,
          services: [
            { name: 'Express Restring', price_cents: 3000 },
            { name: 'Tournament Prep', price_cents: 4500 },
            { name: 'String Consultation', price_cents: 5000 }
          ],
          string_inventory: [
            { brand: 'Solinco', model: 'Tour Bite', gauge: '17', price_cents: 1400 },
            { brand: 'Technifibre', model: 'Black Code', gauge: '16', price_cents: 1500 }
          ],
          availability: []
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
        certifications: [],
        rackets_strung_count: 650,
        stringer_settings: {
          id: '3',
          base_price_cents: 2000,
          turnaround_hours: 48,
          accepts_rush: false,
          rush_fee_cents: 0,
          max_daily_jobs: 4,
          services: [
            { name: 'Basic Restring', price_cents: 2000 },
            { name: 'Synthetic Gut', price_cents: 2200 },
            { name: 'Multifilament', price_cents: 2800 }
          ],
          string_inventory: [
            { brand: 'Prince', model: 'Synthetic Gut', gauge: '16', price_cents: 800 },
            { brand: 'Gamma', model: 'TNT2', gauge: '17', price_cents: 900 }
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
                  onClick={() => router.push(`/messages?stringer_id=${params.id}`)}
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
