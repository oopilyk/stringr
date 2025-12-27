'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Navigation } from '@/components/layout/navigation'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileStats } from '@/components/profile/profile-stats'
import { InfoSectionCard } from '@/components/profile/info-section-card'
import { InlineEditField } from '@/components/profile/inline-edit-field'
import { Phone, Mail, MapPin, Briefcase, Wrench, DollarSign, Package, Calendar } from 'lucide-react'
import { formatPrice } from '@rally-strings/ui'

export default function MyProfilePage() {
  const { profile, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (profile?.id) {
      loadProfileData()
    }
  }, [profile?.id])

  const loadProfileData = async () => {
    if (!profile?.id) return

    setIsLoadingData(true)
    try {
      // Load stringer settings if they exist
      const { data: settingsData } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (settingsData) {
        setSettings(settingsData)
      }

      // Load reviews for rating calculation
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('stringer_id', profile.id)

      if (reviewsData) {
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleAvatarChange = async (url: string) => {
    // Avatar URL is already updated in the database by the AvatarUpload component
    // Invalidate the profile query to refetch the data
    setMessage('Profile picture updated successfully!')
    await queryClient.invalidateQueries({ queryKey: ['profile', profile?.id] })
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInlineFieldSave = async (fieldName: string, value: string) => {
    if (!profile?.id) {
      console.error('No profile ID - not authenticated')
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ [fieldName]: value })
      .eq('id', profile.id)
      .select()

    if (error) {
      console.error('Save error:', error)
      throw new Error(error.message)
    }

    // Invalidate the profile query to refetch the updated data
    await queryClient.invalidateQueries({ queryKey: ['profile', profile.id] })

    setMessage(`${fieldName.replace('_', ' ')} updated successfully!`)
    setTimeout(() => setMessage(''), 3000)
  }

  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-600">Please log in to view your profile</div>
        </main>
      </div>
    )
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const isStringer = !!settings

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md">
            {message}
          </div>
        )}

        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          averageRating={averageRating}
          reviewCount={reviews.length}
          isOwnProfile={true}
          onAvatarChange={handleAvatarChange}
        />

        {/* Stats (Stringers Only) */}
        {isStringer && <ProfileStats profile={profile} />}

        {/* Contact Information */}
        <InfoSectionCard
          title="Contact Information"
          icon={<Mail className="w-5 h-5 text-primary" />}
          collapsible={true}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="text-gray-900">{profile.email}</div>
            </div>

            <InlineEditField
              label="Phone"
              value={profile.phone || ''}
              fieldName="phone"
              type="tel"
              placeholder="Enter your phone number"
              onSave={handleInlineFieldSave}
            />

            <InlineEditField
              label="Full Name"
              value={profile.full_name || ''}
              fieldName="full_name"
              placeholder="Enter your full name"
              onSave={handleInlineFieldSave}
            />

            <InlineEditField
              label="Bio"
              value={profile.bio || ''}
              fieldName="bio"
              type="textarea"
              placeholder="Tell us about yourself..."
              onSave={handleInlineFieldSave}
            />

            <InlineEditField
              label="City"
              value={profile.city || ''}
              fieldName="city"
              placeholder="e.g., Baltimore, MD"
              onSave={handleInlineFieldSave}
            />
          </div>
        </InfoSectionCard>

        {/* Stringer-Specific Sections */}
        {isStringer && (
          <>
            {/* Background & Experience */}
            <InfoSectionCard
              title="Background & Experience"
              icon={<Briefcase className="w-5 h-5 text-primary" />}
              editLink="/my-profile/edit?section=background"
              defaultOpen={false}
            >
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Years Experience</dt>
                  <dd className="font-medium text-gray-900">
                    {profile.years_experience ? `${profile.years_experience}+ years` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rackets Strung</dt>
                  <dd className="font-medium text-gray-900">{profile.rackets_strung_count || '—'}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-gray-500">Certifications</dt>
                  <dd className="font-medium text-gray-900">
                    {profile.certifications && profile.certifications.length > 0
                      ? profile.certifications.join(', ')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Stringing Location</dt>
                  <dd className="font-medium text-gray-900">{profile.stringing_location || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Player Levels Served</dt>
                  <dd className="font-medium text-gray-900">
                    {profile.player_levels_served && profile.player_levels_served.length > 0
                      ? profile.player_levels_served.join(', ')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </InfoSectionCard>

            {/* Equipment & Capabilities */}
            <InfoSectionCard
              title="Equipment & Capabilities"
              icon={<Wrench className="w-5 h-5 text-primary" />}
              editLink="/my-profile/edit?section=equipment"
              defaultOpen={false}
            >
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Machine Brand</dt>
                  <dd className="font-medium text-gray-900">{settings.machine_brand || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Machine Model</dt>
                  <dd className="font-medium text-gray-900">{settings.machine_model || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Machine Type</dt>
                  <dd className="font-medium text-gray-900 capitalize">
                    {settings.machine_type?.replace('-', ' ') || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Max Tension</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.max_tension ? `${settings.max_tension} lbs` : '—'}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-gray-500">Supported Racket Types</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.supported_racket_types && settings.supported_racket_types.length > 0
                      ? settings.supported_racket_types.join(', ')
                      : '—'}
                  </dd>
                </div>
              </dl>
            </InfoSectionCard>

            {/* Pricing & Services */}
            <InfoSectionCard
              title="Pricing & Services"
              icon={<DollarSign className="w-5 h-5 text-primary" />}
              editLink="/my-profile/edit?section=pricing"
              defaultOpen={false}
            >
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Base Price</dt>
                  <dd className="font-medium text-gray-900 text-lg text-primary">
                    {formatPrice(settings.base_price_cents || 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Turnaround Time</dt>
                  <dd className="font-medium text-gray-900">{settings.turnaround_hours || 0}h</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rush Service</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.accepts_rush ? `Yes (+${formatPrice(settings.rush_fee_cents || 0)})` : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Bulk Discount</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.discount_bulk_jobs ? `${settings.discount_bulk_jobs}%` : '—'}
                  </dd>
                </div>
                {settings.pricing_notes && (
                  <div className="md:col-span-2">
                    <dt className="text-gray-500">Pricing Notes</dt>
                    <dd className="font-medium text-gray-900">{settings.pricing_notes}</dd>
                  </div>
                )}
              </dl>
            </InfoSectionCard>

            {/* String Inventory */}
            <InfoSectionCard
              title="String Inventory"
              icon={<Package className="w-5 h-5 text-primary" />}
              editLink="/my-profile/edit?section=inventory"
              defaultOpen={false}
            >
              {settings.string_inventory && settings.string_inventory.length > 0 ? (
                <div className="space-y-2">
                  {settings.string_inventory.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="font-medium text-sm">
                        {item.brand} {item.model} ({item.gauge})
                      </span>
                      <span className="text-gray-600 text-sm">
                        Qty: {item.quantity} • {formatPrice(item.price_cents)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm">
                      <span className="text-gray-500">Accept player-provided strings:</span>{' '}
                      <span className="font-medium">{settings.accepts_player_strings ? 'Yes' : 'No'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No string inventory added yet</p>
              )}
            </InfoSectionCard>

            {/* Availability */}
            <InfoSectionCard
              title="Availability & Preferences"
              icon={<Calendar className="w-5 h-5 text-primary" />}
              editLink="/my-profile/edit?section=availability"
              defaultOpen={false}
            >
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Dropoff Methods</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.dropoff_methods && settings.dropoff_methods.length > 0
                      ? settings.dropoff_methods.map((m: any) => m.method).join(', ')
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Weekly Availability</dt>
                  <dd className="font-medium text-gray-900">
                    {settings.availability && settings.availability.length > 0
                      ? `${settings.availability.length} time slots configured`
                      : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Max Daily Jobs</dt>
                  <dd className="font-medium text-gray-900">{settings.max_daily_jobs || '—'}</dd>
                </div>
              </dl>
            </InfoSectionCard>
          </>
        )}
      </main>
    </div>
  )
}
