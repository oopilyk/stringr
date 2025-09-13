'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { useForm } from 'react-hook-form'
import { Navigation } from '@/components/layout/navigation'
import { MapPin, Save, Plus, Trash2, DollarSign, Clock, Star, EyeOff, AlertTriangle } from 'lucide-react'
import type { StringerSettings } from '@rally-strings/types'

interface StringerProfileForm {
  // Profile data
  full_name: string
  bio: string
  phone: string
  city: string
  lat?: number
  lng?: number
  
  // Settings data
  base_price_cents: number
  turnaround_hours: number
  accepts_rush: boolean
  rush_fee_cents: number
  max_daily_jobs: number
  services: { name: string; price_cents: number }[]
}

export default function StringerProfilePage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [settings, setSettings] = useState<StringerSettings | null>(null)
  const [isListed, setIsListed] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<StringerProfileForm>()

  const services = watch('services') || []
  const acceptsRush = watch('accepts_rush')

  // Redirect if not a stringer
  useEffect(() => {
    if (profile && profile.role !== 'stringer') {
      router.push('/')
    }
  }, [profile, router])

  // Load existing data
  useEffect(() => {
    if (profile?.id) {
      loadStringerData()
    }
  }, [profile?.id])

  const loadStringerData = async () => {
    if (!profile?.id) return

    try {
      // Load stringer settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading settings:', settingsError)
        return
      }

      if (settingsData) {
        setSettings(settingsData)
        setIsListed(true)
        
        // Populate form with existing data
        setValue('full_name', profile.full_name || '')
        setValue('bio', profile.bio || '')
        setValue('phone', profile.phone || '')
        setValue('city', profile.city || '')
        setValue('lat', profile.lat)
        setValue('lng', profile.lng)
        setValue('base_price_cents', settingsData.base_price_cents)
        setValue('turnaround_hours', settingsData.turnaround_hours)
        setValue('accepts_rush', settingsData.accepts_rush)
        setValue('rush_fee_cents', settingsData.rush_fee_cents)
        setValue('max_daily_jobs', settingsData.max_daily_jobs)
        setValue('services', settingsData.services || [])
      } else {
        // No settings yet, set defaults
        setValue('full_name', profile.full_name || '')
        setValue('bio', profile.bio || '')
        setValue('phone', profile.phone || '')
        setValue('city', profile.city || '')
        setValue('base_price_cents', 2500)
        setValue('turnaround_hours', 24)
        setValue('accepts_rush', true)
        setValue('rush_fee_cents', 500)
        setValue('max_daily_jobs', 5)
        setValue('services', [
          { name: 'Standard Restring', price_cents: 2500 },
          { name: 'Premium String', price_cents: 3500 }
        ])
      }
    } catch (error) {
      console.error('Error loading stringer data:', error)
    }
  }

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('lat', position.coords.latitude)
          setValue('lng', position.coords.longitude)
          setMessage('Location detected successfully!')
          setTimeout(() => setMessage(''), 3000)
        },
        (error) => {
          setMessage('Unable to detect location. Please enter your city manually.')
          setTimeout(() => setMessage(''), 5000)
        }
      )
    } else {
      setMessage('Geolocation is not supported by this browser.')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const addService = () => {
    const currentServices = getValues('services')
    setValue('services', [...currentServices, { name: '', price_cents: 2500 }])
  }

  const removeService = (index: number) => {
    const currentServices = getValues('services')
    setValue('services', currentServices.filter((_, i) => i !== index))
  }

  const handleUnlist = async () => {
    if (!profile?.id) return

    const confirmed = window.confirm(
      'Are you sure you want to unlist yourself? Players will no longer be able to find you in searches until you list yourself again.'
    )

    if (!confirmed) return

    setIsDeleting(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('stringer_settings')
        .delete()
        .eq('id', profile.id)

      if (error) {
        setMessage(`Error unlisting: ${error.message}`)
        return
      }

      setIsListed(false)
      setSettings(null)
      setMessage('You have been unlisted successfully. You can list yourself again anytime.')
    } catch (error) {
      setMessage('An unexpected error occurred while unlisting')
    } finally {
      setIsDeleting(false)
    }
  }

  const onSubmit = async (data: StringerProfileForm) => {
    if (!profile?.id) return

    setIsLoading(true)
    setMessage('')

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          bio: data.bio,
          phone: data.phone,
          city: data.city,
          lat: data.lat,
          lng: data.lng
        })
        .eq('id', profile.id)

      if (profileError) {
        setMessage(`Profile error: ${profileError.message}`)
        return
      }

      // Upsert stringer settings
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .upsert({
          id: profile.id,
          base_price_cents: data.base_price_cents,
          turnaround_hours: data.turnaround_hours,
          accepts_rush: data.accepts_rush,
          rush_fee_cents: data.rush_fee_cents,
          max_daily_jobs: data.max_daily_jobs,
          services: data.services
        })

      if (settingsError) {
        setMessage(`Settings error: ${settingsError.message}`)
        return
      }

      setIsListed(true)
      setMessage('Profile updated successfully! You are now discoverable by players.')
      
      // Refresh data
      loadStringerData()
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  if (profile.role !== 'stringer') {
    return <div>Access denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Stringer Profile</h1>
          <p className="mt-2 text-gray-600">
            {isListed 
              ? "Manage your listing and update your business information"
              : "Complete your profile to start appearing in player searches"
            }
          </p>
          
          <div className="mt-4">
            {isListed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-green-600">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">Your profile is live and discoverable!</span>
                </div>
                <Button
                  onClick={handleUnlist}
                  disabled={isDeleting}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Unlisting...' : 'Unlist Me'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  You are not currently listed. Complete your profile to go live.
                </span>
              </div>
            )}
          </div>
        </div>

        {!isListed && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">You are currently unlisted</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Players cannot find you in searches or book appointments with you. 
                    Complete and save your profile below to become discoverable again.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                This information will be visible to players
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    {...register('full_name', { required: 'Name is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  {errors.full_name && <p className="text-red-600 text-sm">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    {...register('phone', { required: 'Phone is required' })}
                    type="tel"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  {errors.phone && <p className="text-red-600 text-sm">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  {...register('bio', { required: 'Bio is required' })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Tell players about your experience, certifications, and specialties..."
                />
                {errors.bio && <p className="text-red-600 text-sm">{errors.bio.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLocationDetection}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Detect Location
                  </Button>
                </div>
                <input
                  {...register('city', { required: 'City is required' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="e.g., Baltimore, MD"
                />
                {errors.city && <p className="text-red-600 text-sm">{errors.city.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Configure your pricing and availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Price</label>
                  <div className="mt-1 relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      {...register('base_price_cents', { 
                        required: 'Base price is required',
                        min: { value: 1000, message: 'Minimum $10' }
                      })}
                      type="number"
                      step="100"
                      min="1000"
                      className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      onChange={(e) => setValue('base_price_cents', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Price in cents (e.g., 2500 = $25.00)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Turnaround Time</label>
                  <div className="mt-1 relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      {...register('turnaround_hours', { required: 'Turnaround time is required' })}
                      className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={72}>72 hours</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Daily Jobs</label>
                  <select
                    {...register('max_daily_jobs', { required: 'Max daily jobs is required' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  >
                    <option value={2}>2 jobs</option>
                    <option value={3}>3 jobs</option>
                    <option value={5}>5 jobs</option>
                    <option value={8}>8 jobs</option>
                    <option value={10}>10 jobs</option>
                    <option value={15}>15 jobs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    {...register('accepts_rush')}
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Accept rush orders</span>
                </label>
              </div>

              {acceptsRush && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rush Fee</label>
                  <div className="mt-1 relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      {...register('rush_fee_cents', { 
                        min: { value: 0, message: 'Cannot be negative' }
                      })}
                      type="number"
                      step="100"
                      min="0"
                      className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      onChange={(e) => setValue('rush_fee_cents', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Additional fee for rush orders</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>
                List the different services you provide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Service name (e.g., Standard Restring)"
                      value={service.name}
                      onChange={(e) => {
                        const newServices = [...services]
                        newServices[index].name = e.target.value
                        setValue('services', newServices)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="Price (cents)"
                        value={service.price_cents}
                        onChange={(e) => {
                          const newServices = [...services]
                          newServices[index].price_cents = parseInt(e.target.value) || 0
                          setValue('services', newServices)
                        }}
                        className="pl-10 w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    {services.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeService(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addService}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="px-8">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : isListed ? 'Update Profile' : 'Go Live & List Me'}
            </Button>
          </div>

          {message && (
            <div className={`text-sm ${message.startsWith('Error') || message.startsWith('Profile error') || message.startsWith('Settings error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
