'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@rally-strings/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rally-strings/ui'
import { useForm } from 'react-hook-form'
import { STRING_PRESETS } from '@rally-strings/types'

interface StringerSignupForm {
  email: string
  full_name: string
  phone: string
  city: string
  bio: string
  base_price_cents: number
  turnaround_hours: number
  accepts_rush: boolean
  rush_fee_cents: number
  max_daily_jobs: number
  services: { name: string; price_cents: number }[]
}

export default function StringerSignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1) // 1: Basic Info, 2: Business Details, 3: Services
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues
  } = useForm<StringerSignupForm>({
    defaultValues: {
      base_price_cents: 2500,
      turnaround_hours: 24,
      accepts_rush: true,
      rush_fee_cents: 500,
      max_daily_jobs: 5,
      services: [
        { name: 'Standard Restring', price_cents: 2500 },
        { name: 'Premium String', price_cents: 3500 }
      ]
    }
  })

  const services = watch('services')
  const acceptsRush = watch('accepts_rush')

  const addService = () => {
    const currentServices = getValues('services')
    setValue('services', [...currentServices, { name: '', price_cents: 2500 }])
  }

  const removeService = (index: number) => {
    const currentServices = getValues('services')
    setValue('services', currentServices.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const onSubmit = async (data: StringerSignupForm) => {
    setIsLoading(true)
    setMessage('')

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: 'temp_password_' + Math.random().toString(36).substring(7), // Temporary password
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'stringer'
          }
        }
      })

      if (authError) {
        setMessage(`Error: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            role: 'stringer',
            full_name: data.full_name,
            phone: data.phone,
            city: data.city,
            bio: data.bio
          })

        if (profileError) {
          setMessage(`Profile error: ${profileError.message}`)
          return
        }

        // Create stringer settings
        const { error: settingsError } = await supabase
          .from('stringer_settings')
          .insert({
            id: authData.user.id,
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

        setMessage('Registration successful! Check your email to verify your account.')
        // Don't redirect immediately, let them check email first
      }
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Join Stringr as a Stringer</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start earning by providing professional stringing services
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center space-x-4 mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNumber
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNumber}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Business Details'}
              {step === 3 && 'Services & Pricing'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Tell us about yourself'}
              {step === 2 && 'Set up your stringing business'}
              {step === 3 && 'Configure your services and rates'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      {...register('email', { required: 'Email is required' })}
                      type="email"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      {...register('full_name', { required: 'Name is required' })}
                      type="text"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    {errors.city && <p className="text-red-600 text-sm">{errors.city.message}</p>}
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
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Price</label>
                      <div className="mt-1 relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          {...register('base_price_cents', { 
                            required: 'Base price is required',
                            min: { value: 1000, message: 'Minimum $10' },
                            max: { value: 10000, message: 'Maximum $100' }
                          })}
                          type="number"
                          step="100"
                          min="1000"
                          max="10000"
                          className="pl-8 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          onChange={(e) => setValue('base_price_cents', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Price in cents (e.g., 2500 = $25.00)</p>
                      {errors.base_price_cents && <p className="text-red-600 text-sm">{errors.base_price_cents.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Turnaround Time</label>
                      <select
                        {...register('turnaround_hours', { required: 'Turnaround time is required' })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
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
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          {...register('rush_fee_cents', { 
                            min: { value: 0, message: 'Cannot be negative' },
                            max: { value: 2000, message: 'Maximum $20' }
                          })}
                          type="number"
                          step="100"
                          min="0"
                          max="2000"
                          className="pl-8 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          onChange={(e) => setValue('rush_fee_cents', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Additional fee for rush orders</p>
                    </div>
                  )}

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
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                    {services.map((service, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          placeholder="Service name"
                          value={service.name}
                          onChange={(e) => {
                            const newServices = [...services]
                            newServices[index].name = e.target.value
                            setValue('services', newServices)
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={service.price_cents}
                            onChange={(e) => {
                              const newServices = [...services]
                              newServices[index].price_cents = parseInt(e.target.value) || 0
                              setValue('services', newServices)
                            }}
                            className="pl-8 w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          />
                        </div>
                        {services.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeService(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                      className="mt-2"
                    >
                      Add Service
                    </Button>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
                
                <div className="ml-auto">
                  {step < 3 ? (
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </div>

              {message && (
                <div className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/signin')}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
