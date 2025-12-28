// Local storage utilities for onboarding progress
const STORAGE_KEY = 'stringer-onboarding'

export function saveOnboardingProgress(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save onboarding progress', error)
  }
}

export function getOnboardingProgress() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Failed to load onboarding progress', error)
    return null
  }
}

export function clearOnboardingProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear onboarding progress', error)
  }
}
