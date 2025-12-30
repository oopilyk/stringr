'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { StringerOnboardingData } from '@stringr/types'
import { useOnboardingAutosave } from '@/lib/hooks/use-onboarding-autosave'
import { getOnboardingProgress, clearOnboardingProgress } from '@/lib/utils/onboarding-storage'
import { ProgressIndicator } from '@/components/stringer-onboarding/progress-indicator'
import { Step1Credentials } from '@/components/stringer-onboarding/step1-credentials'
import { Step2Background } from '@/components/stringer-onboarding/step2-background'
import { Step3Equipment } from '@/components/stringer-onboarding/step3-equipment'
import { Step4Pricing } from '@/components/stringer-onboarding/step4-pricing'
import { Step5Inventory } from '@/components/stringer-onboarding/step5-inventory'
import { Step6Availability } from '@/components/stringer-onboarding/step6-availability'
import { Step7Review } from '@/components/stringer-onboarding/step7-review'
import { Button, Card, CardContent } from '@stringr/ui'

const STEP_TITLES = [
  '',
  'Credentials & Location',
  'Background & Experience',
  'Equipment & Capabilities',
  'Pricing & Turnaround',
  'String Inventory',
  'Availability & Preferences',
  'Review & Submit',
]

export default function StringerSignupPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<StringerOnboardingData>({
    defaultValues: {
      base_price_cents: 2500,
      turnaround_hours: 24,
      accepts_rush: true,
      rush_fee_cents: 500,
      max_daily_jobs: 5,
      accepts_player_strings: true,
      string_inventory: [],
      dropoff_methods: [],
      availability: [],
    },
  })

  // Load saved progress on mount and URL params
  useEffect(() => {
    // Check URL params first (from /auth/signup)
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const passwordParam = params.get('password')
    const fullNameParam = params.get('full_name')

    if (emailParam) setValue('email', emailParam)
    if (passwordParam) setValue('password', passwordParam)
    if (fullNameParam) setValue('full_name', fullNameParam)

    // Then load saved progress
    const saved = getOnboardingProgress()
    if (saved) {
      Object.keys(saved).forEach((key) => {
        if (key !== '_meta') {
          setValue(key as any, saved[key])
        }
      })
      if (saved._meta?.lastStep && saved._meta.lastStep > 1) {
        // If they've already created an account, start at their last step
        setCurrentStep(saved._meta.lastStep)
      }
    }
  }, [setValue])

  // Autosave hook
  const { clearProgress } = useOnboardingAutosave({
    watch,
    currentStep,
    userId: userId ?? undefined,
    debounceMs: 2000,
  })

  const handleNext = async () => {
    // For Step 1, validate and create account
    if (currentStep === 1) {
      const isValid = await trigger(['email', 'password', 'full_name', 'phone', 'city'])
      if (!isValid) {
        setMessage('Please fix errors before continuing')
        return
      }
      await createUserAccount()
    } else {
      // For other steps, just move forward (all fields are optional)
      setCurrentStep((prev) => Math.min(prev + 1, 7))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const jumpToStep = (step: number) => {
    setCurrentStep(step)
  }

  const createUserAccount = async () => {
    const data = getValues()
    setIsSubmitting(true)
    setMessage('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setMessage(`Error: ${authError.message}`)
        setIsSubmitting(false)
        return
      }

      if (authData.user) {
        setUserId(authData.user.id)

        // Create initial profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: data.full_name,
          phone: data.phone,
          city: data.city,
          lat: data.lat,
          lng: data.lng,
          role: 'stringer',
        })

        // Create initial stringer_settings
        await supabase.from('stringer_settings').insert({
          id: authData.user.id,
          onboarding_step: 2,
          base_price_cents: data.base_price_cents,
          turnaround_hours: data.turnaround_hours,
          accepts_rush: data.accepts_rush,
          rush_fee_cents: data.rush_fee_cents,
          max_daily_jobs: data.max_daily_jobs,
        })

        setCurrentStep(2)
        setMessage('Account created successfully!')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    setMessage('')

    try {
      // Final update to mark onboarding complete
      await supabase
        .from('stringer_settings')
        .update({
          onboarding_step: 7,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId)

      // Clear saved progress
      clearProgress()

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setMessage('Failed to complete onboarding')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAndExit = () => {
    // Progress is already autosaved
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Join Stringr as a Stringer</h1>
          <p className="mt-2 text-sm text-gray-600">Complete your professional profile to start earning</p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={7} />

        {/* Main Card */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{STEP_TITLES[currentStep]}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of 7
                {currentStep > 1 && ' - All fields optional unless marked with *'}
              </p>
            </div>

            {/* Step Content */}
            <form onSubmit={handleSubmit(currentStep === 7 ? handleFinalSubmit : handleNext)}>
              {currentStep === 1 && <Step1Credentials register={register} errors={errors} setValue={setValue} watch={watch} />}
              {currentStep === 2 && <Step2Background register={register} errors={errors} setValue={setValue} watch={watch} />}
              {currentStep === 3 && <Step3Equipment register={register} errors={errors} setValue={setValue} watch={watch} />}
              {currentStep === 4 && <Step4Pricing register={register} errors={errors} setValue={setValue} watch={watch} />}
              {currentStep === 5 && <Step5Inventory register={register} errors={errors} setValue={setValue} watch={watch} getValues={getValues} />}
              {currentStep === 6 && <Step6Availability register={register} errors={errors} setValue={setValue} watch={watch} getValues={getValues} />}
              {currentStep === 7 && <Step7Review getValues={getValues} jumpToStep={jumpToStep} />}

              {/* Navigation */}
              <div className="flex justify-between pt-6 mt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={currentStep === 1 ? () => router.push('/auth/signin') : handleBack}
                  disabled={isSubmitting}
                >
                  Back
                </Button>

                <div className="ml-auto flex gap-2">
                  {currentStep > 1 && currentStep < 7 && (
                    <Button type="button" variant="outline" onClick={handleSaveAndExit} disabled={isSubmitting}>
                      Save & Exit
                    </Button>
                  )}
                  {currentStep < 7 ? (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : currentStep === 1 ? 'Create Account & Continue' : 'Next'}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </div>

              {message && (
                <div
                  className={`mt-4 text-sm ${message.startsWith('Error') || message.startsWith('Failed') ? 'text-red-600' : 'text-green-600'}`}
                >
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {currentStep > 1 ? 'Your progress is automatically saved. You can exit and return anytime.' : 'Already have an account? '}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => router.push('/auth/signin')}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
