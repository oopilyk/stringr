'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { useForm } from 'react-hook-form'
import { Navigation } from '@/components/layout/navigation'
import { MapPin, Save, Plus, Trash2, DollarSign, Clock, Star, EyeOff, AlertTriangle, Shield, Upload, CheckCircle } from 'lucide-react'

interface ProfileForm {
  full_name: string
  bio: string
  phone: string
  city: string
  lat?: number
  lng?: number
}

interface ServiceProviderForm extends ProfileForm {
  base_price_cents: number
  turnaround_hours: number
  accepts_rush: boolean
  rush_fee_cents: number
  max_daily_jobs: number
  services: { name: string; price_cents: number }[]
}

export default function MyProfilePage() {
  const { profile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [serviceProviderSettings, setServiceProviderSettings] = useState<any>(null)
  const [isServiceProvider, setIsServiceProvider] = useState(false)
  const [showServiceProviderForm, setShowServiceProviderForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const basicForm = useForm<ProfileForm>()
  const serviceForm = useForm<ServiceProviderForm>({
    defaultValues: {
      services: [{ name: '', price_cents: 2500 }] // Initialize with one empty service
    }
  })

  const services = serviceForm.watch('services') || []
  const acceptsRush = serviceForm.watch('accepts_rush')

  // Load user data
  useEffect(() => {
    if (profile?.id) {
      loadUserData()
    }
  }, [profile?.id])

  const loadUserData = async () => {
    if (!profile?.id) return

    try {
      // Populate basic form
      basicForm.setValue('full_name', profile.full_name || '')
      basicForm.setValue('bio', profile.bio || '')
      basicForm.setValue('phone', profile.phone || '')
      basicForm.setValue('city', profile.city || '')
      basicForm.setValue('lat', profile.lat)
      basicForm.setValue('lng', profile.lng)

      // Check if user has service provider settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('stringer_settings')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (settingsData) {
        setServiceProviderSettings(settingsData)
        setIsServiceProvider(true)
        
        // Populate service form
        serviceForm.setValue('full_name', profile.full_name || '')
        serviceForm.setValue('bio', profile.bio || '')
        serviceForm.setValue('phone', profile.phone || '')
        serviceForm.setValue('city', profile.city || '')
        serviceForm.setValue('lat', profile.lat)
        serviceForm.setValue('lng', profile.lng)
        serviceForm.setValue('base_price_cents', settingsData.base_price_cents)
        serviceForm.setValue('turnaround_hours', settingsData.turnaround_hours)
        serviceForm.setValue('accepts_rush', settingsData.accepts_rush)
        serviceForm.setValue('rush_fee_cents', settingsData.rush_fee_cents)
        serviceForm.setValue('max_daily_jobs', settingsData.max_daily_jobs)
        serviceForm.setValue('services', settingsData.services || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          if (isServiceProvider) {
            serviceForm.setValue('lat', lat)
            serviceForm.setValue('lng', lng)
          } else {
            basicForm.setValue('lat', lat)
            basicForm.setValue('lng', lng)
          }
          
          setMessage('Location detected successfully!')
          setTimeout(() => setMessage(''), 3000)
        },
        (error) => {
          setMessage('Unable to detect location. Please enter your city manually.')
          setTimeout(() => setMessage(''), 5000)
        }
      )
    }
  }

  const addService = () => {
    const currentServices = serviceForm.getValues('services') || []
    serviceForm.setValue('services', [...currentServices, { name: '', price_cents: 2500 }])
  }

  const removeService = (index: number) => {
    const currentServices = serviceForm.getValues('services') || []
    serviceForm.setValue('services', currentServices.filter((_, i) => i !== index))
  }

  const handleBasicProfileUpdate = async (data: ProfileForm) => {
    if (!profile?.id) return

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase
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

      if (error) {
        setMessage(`Error: ${error.message}`)
        return
      }

      setMessage('Profile updated successfully!')
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceProviderUpdate = async (data: ServiceProviderForm) => {
    if (!profile?.id) return

    // Validate that at least one service has a name
    const validServices = data.services?.filter(service => service.name.trim()) || []
    if (validServices.length === 0) {
      setMessage('Please add at least one service with a name')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      // Update profile and set role to stringer
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: data.full_name,
          bio: data.bio,
          phone: data.phone,
          city: data.city,
          lat: data.lat,
          lng: data.lng,
          role: 'stringer' // Set role to stringer when providing services
        })

      if (profileError) {
        setMessage(`Profile error: ${profileError.message}`)
        return
      }

      // Upsert service provider settings
      const { error: settingsError } = await supabase
        .from('stringer_settings')
        .upsert({
          id: profile.id,
          base_price_cents: data.base_price_cents,
          turnaround_hours: data.turnaround_hours,
          accepts_rush: data.accepts_rush,
          rush_fee_cents: data.rush_fee_cents,
          max_daily_jobs: data.max_daily_jobs,
          services: validServices,
          verification_status: isServiceProvider ? undefined : 'pending' // Only set for new providers
        })

      if (settingsError) {
        setMessage(`Settings error: ${settingsError.message}`)
        return
      }

      setIsServiceProvider(true)
      setMessage('Service provider profile updated successfully! You are now discoverable by users.')
      
      // Reload data
      loadUserData()
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStopProviding = async () => {
    if (!profile?.id) return

    const confirmed = window.confirm(
      'Are you sure you want to stop providing services? Users will no longer be able to find you in searches.'
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
        setMessage(`Error: ${error.message}`)
        return
      }

      setIsServiceProvider(false)
      setServiceProviderSettings(null)
      setShowServiceProviderForm(false)
      setMessage('You are no longer listed as a service provider.')
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!profile) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your personal information and service provider settings
          </p>
        </div>

        {/* Service Provider Status */}
        {isServiceProvider && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">Service Provider Active</h3>
                    <p className="text-sm text-green-700">
                      {serviceProviderSettings?.is_verified 
                        ? "Verified - You're discoverable in searches"
                        : "Pending verification - Your listing will be reviewed"
                      }
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleStopProviding}
                  disabled={isDeleting}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Removing...' : 'Stop Providing'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Become Service Provider CTA */}
        {!isServiceProvider && !showServiceProviderForm && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-blue-800">Become a Service Provider</h3>
                    <p className="text-sm text-blue-700">
                      Offer tennis stringing services and earn money from your skills
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowServiceProviderForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Providing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Forms */}
        {!isServiceProvider && !showServiceProviderForm ? (
          /* Basic Profile Form */
          <form onSubmit={basicForm.handleSubmit(handleBasicProfileUpdate)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Your personal profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      {...basicForm.register('full_name', { required: 'Name is required' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      {...basicForm.register('phone')}
                      type="tel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    {...basicForm.register('bio')}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Tell us about yourself..."
                  />
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
                    {...basicForm.register('city')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="e.g., Baltimore, MD"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Update Profile'}
              </Button>
            </div>
          </form>
        ) : (
          /* Service Provider Form - reuse the existing stringer-profile form structure */
          <div>
            <form onSubmit={serviceForm.handleSubmit(handleServiceProviderUpdate)} className="space-y-8">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    This information will be visible to users looking for services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        {...serviceForm.register('full_name', { required: 'Name is required' })}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                          serviceForm.formState.errors.full_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {serviceForm.formState.errors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{serviceForm.formState.errors.full_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        {...serviceForm.register('phone', { required: 'Phone is required' })}
                        type="tel"
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                          serviceForm.formState.errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {serviceForm.formState.errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{serviceForm.formState.errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      {...serviceForm.register('bio', { required: 'Bio is required' })}
                      rows={3}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                        serviceForm.formState.errors.bio ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Tell users about your experience, certifications, and specialties..."
                    />
                    {serviceForm.formState.errors.bio && (
                      <p className="mt-1 text-sm text-red-600">{serviceForm.formState.errors.bio.message}</p>
                    )}
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
                      {...serviceForm.register('city', { required: 'City is required' })}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                        serviceForm.formState.errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Baltimore, MD"
                    />
                    {serviceForm.formState.errors.city && (
                      <p className="mt-1 text-sm text-red-600">{serviceForm.formState.errors.city.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Settings</CardTitle>
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
                          {...serviceForm.register('base_price_cents', { 
                            required: 'Base price is required',
                            min: { value: 1000, message: 'Minimum $10' }
                          })}
                          type="number"
                          step="100"
                          min="1000"
                          className={`pl-10 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary ${
                            serviceForm.formState.errors.base_price_cents ? 'border-red-300' : 'border-gray-300'
                          }`}
                          onChange={(e) => serviceForm.setValue('base_price_cents', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Price in cents (e.g., 2500 = $25.00)</p>
                      {serviceForm.formState.errors.base_price_cents && (
                        <p className="mt-1 text-sm text-red-600">{serviceForm.formState.errors.base_price_cents.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Turnaround Time</label>
                      <div className="mt-1 relative">
                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <select
                          {...serviceForm.register('turnaround_hours', { required: 'Turnaround time is required' })}
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
                        {...serviceForm.register('max_daily_jobs', { required: 'Max daily jobs is required' })}
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
                        {...serviceForm.register('accepts_rush')}
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
                          {...serviceForm.register('rush_fee_cents', { 
                            min: { value: 0, message: 'Cannot be negative' }
                          })}
                          type="number"
                          step="100"
                          min="0"
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          onChange={(e) => serviceForm.setValue('rush_fee_cents', parseInt(e.target.value) || 0)}
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
                            serviceForm.setValue('services', newServices)
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
                              serviceForm.setValue('services', newServices)
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

              <div className="flex justify-between">
                {!isServiceProvider && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowServiceProviderForm(false)}
                  >
                    Cancel
                  </Button>
                )}
                
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : isServiceProvider ? 'Update Services' : 'Start Providing Services'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {message && (
          <div className={`mt-4 text-sm ${message.startsWith('Error') || message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}
      </main>
    </div>
  )
}
