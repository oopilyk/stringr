/**
 * Input formatting utilities for consistent data entry
 */

/**
 * Format phone number to (XXX) XXX-XXXX format
 * Accepts various input formats and normalizes them
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '')

  // Limit to 10 digits
  const limited = cleaned.substring(0, 10)

  // Format as (XXX) XXX-XXXX
  if (limited.length === 0) return ''
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Get raw phone number without formatting (for database storage)
 */
export function getRawPhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

/**
 * Validate that phone number has exactly 10 digits
 */
export function isValidPhoneNumber(formatted: string): boolean {
  const raw = getRawPhoneNumber(formatted)
  return raw.length === 10
}

/**
 * Format email to lowercase and trim whitespace
 */
export function formatEmail(value: string): string {
  return value.toLowerCase().trim()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Format city name - capitalize first letter of each word
 * During input: preserves trailing spaces to allow typing
 * For final values: use formatCityNameFinal to trim
 */
export function formatCityName(value: string): string {
  // Don't apply formatting while typing - just return as-is
  return value
}

/**
 * Format city name for final submission - capitalize and trim
 */
export function formatCityNameFinal(value: string): string {
  return value
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Format full name - capitalize first letter of each word
 * During input: preserves trailing spaces to allow typing
 * For final values: use formatFullNameFinal to trim
 */
export function formatFullName(value: string): string {
  // Don't apply formatting while typing - just return as-is
  return value
}

/**
 * Format full name for final submission - capitalize and trim
 */
export function formatFullNameFinal(value: string): string {
  return value
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Limit string length
 */
export function limitLength(value: string, maxLength: number): string {
  return value.substring(0, maxLength)
}

/**
 * Format currency input (dollars and cents)
 */
export function formatCurrency(value: string): string {
  // Remove all non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '')

  // Ensure only one decimal point
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }

  // Limit to 2 decimal places
  if (parts.length === 2) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 2)
  }

  return cleaned
}

/**
 * Format ZIP code to XXXXX or XXXXX-XXXX format
 */
export function formatZipCode(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const limited = cleaned.substring(0, 9)

  if (limited.length === 0) return ''
  if (limited.length <= 5) return limited
  return `${limited.slice(0, 5)}-${limited.slice(5)}`
}
