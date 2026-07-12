import { StringerOnboardingData } from '@stringerly/types'

export function calculateProfileCompleteness(data: StringerOnboardingData): number {
  let score = 0

  // Step 1: Basic Info (15%)
  if (data.full_name) score += 3
  if (data.phone) score += 3
  if (data.city) score += 3
  if (data.lat && data.lng) score += 3
  if (data.bio) score += 3

  // Step 2: Background (15%)
  if (data.years_experience !== undefined && data.years_experience !== null) score += 5
  if (data.rackets_strung_count !== undefined && data.rackets_strung_count !== null) score += 5
  if (data.certifications && data.certifications.length > 0) score += 2.5
  if (data.player_levels_served && data.player_levels_served.length > 0) score += 2.5

  // Step 3: Equipment (15%)
  if (data.machine_brand) score += 3
  if (data.machine_model) score += 3
  if (data.machine_type) score += 3
  if (data.supported_racket_types && data.supported_racket_types.length > 0) score += 3
  if (data.max_tension) score += 3

  // Step 4: Pricing (20%)
  if (data.base_price_cents > 0) score += 5
  if (data.turnaround_hours > 0) score += 5
  if (data.accepts_rush !== undefined) score += 5
  // Only require rush_fee if accepts_rush is true, otherwise give points automatically
  if (data.accepts_rush === false || (data.accepts_rush && data.rush_fee_cents !== undefined)) score += 5

  // Step 5: Inventory (15%)
  if (data.string_inventory && data.string_inventory.length > 0) score += 15

  // Step 6: Availability (20%)
  if (data.dropoff_methods && data.dropoff_methods.length > 0) score += 10
  // Give points for either having availability blocks OR having flexible_availability checked
  if ((data.availability && data.availability.length > 0) || data.flexible_availability) score += 10

  return Math.min(score, 100)
}

export function getCompletenessMessage(percentage: number): string {
  if (percentage >= 90) return 'Excellent! Your profile is complete.'
  if (percentage >= 70) return 'Good progress! A few more details will boost your visibility.'
  if (percentage >= 50) return "You're halfway there. Keep going!"
  return "Let's build your profile to attract more clients."
}

export function getCompletionColor(percentage: number): string {
  if (percentage >= 90) return 'text-green-600'
  if (percentage >= 70) return 'text-blue-600'
  if (percentage >= 50) return 'text-yellow-600'
  return 'text-gray-600'
}
