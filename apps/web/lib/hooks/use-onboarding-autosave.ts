import { useEffect, useRef } from 'react'
import { UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData } from '@rally-strings/types'
import { saveOnboardingProgress, getOnboardingProgress, clearOnboardingProgress } from '@/lib/utils/onboarding-storage'
import { createClient } from '@/lib/supabase'

interface UseOnboardingAutosaveOptions {
  watch: UseFormWatch<StringerOnboardingData>
  currentStep: number
  userId?: string
  debounceMs?: number
}

export function useOnboardingAutosave({
  watch,
  currentStep,
  userId,
  debounceMs = 2000,
}: UseOnboardingAutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const subscription = watch((formData) => {
      // Debounce autosave
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        const dataToSave = {
          ...formData,
          _meta: {
            lastStep: currentStep,
            lastSaved: new Date().toISOString(),
          },
        }

        // Save to localStorage (always)
        saveOnboardingProgress(dataToSave)

        // Save to database (if user created - Step 2+)
        if (userId) {
          saveToDatabase(userId, formData as StringerOnboardingData, currentStep)
        }
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [watch, currentStep, userId, debounceMs])

  return {
    loadProgress: () => getOnboardingProgress(),
    clearProgress: () => clearOnboardingProgress(),
  }
}

async function saveToDatabase(
  userId: string,
  data: StringerOnboardingData,
  step: number
) {
  const supabase = createClient()

  try {
    // Update profiles table
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: data.full_name,
        phone: data.phone,
        city: data.city,
        lat: data.lat,
        lng: data.lng,
        bio: data.bio,
        years_experience: data.years_experience,
        rackets_strung_count: data.rackets_strung_count,
        certifications: data.certifications,
        stringing_location: data.stringing_location,
        player_levels_served: data.player_levels_served,
      })

    // Update stringer_settings table
    await supabase
      .from('stringer_settings')
      .upsert({
        id: userId,
        base_price_cents: data.base_price_cents,
        turnaround_hours: data.turnaround_hours,
        accepts_rush: data.accepts_rush,
        rush_fee_cents: data.rush_fee_cents,
        max_daily_jobs: data.max_daily_jobs,
        machine_brand: data.machine_brand,
        machine_model: data.machine_model,
        machine_type: data.machine_type,
        supported_racket_types: data.supported_racket_types,
        max_tension: data.max_tension,
        string_inventory: data.string_inventory || [],
        dropoff_methods: data.dropoff_methods || [],
        pricing_notes: data.pricing_notes,
        accepts_player_strings: data.accepts_player_strings,
        discount_bulk_jobs: data.discount_bulk_jobs,
        availability: data.availability || [],
        onboarding_step: step,
      })
  } catch (error) {
    console.error('Failed to autosave to database:', error)
  }
}
