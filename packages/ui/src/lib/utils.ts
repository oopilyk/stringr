import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatPriceValue(cents: number): string {
  return `${(cents / 100).toFixed(2)}`
}

// Convert kilometers to miles and format for display
export function formatDistance(km: number): string {
  const miles = km * 0.621371 // Convert km to miles
  if (miles < 0.1) {
    // Show in feet if less than 0.1 miles (528 feet)
    const feet = Math.round(miles * 5280)
    return `${feet} ft`
  }
  return `${miles.toFixed(1)} mi`
}

// Convert 24-hour time to 12-hour AM/PM format
export function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

// Format time range in 12-hour format
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12Hour(start)} - ${formatTime12Hour(end)}`
}

export function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}min`
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  if (remainingHours === 0) {
    return `${days}d`
  }
  return `${days}d ${remainingHours}h`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'requested':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'accepted':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'in_progress':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'ready':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'canceled':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function formatStatusText(status: string): string {
  switch (status) {
    case 'requested':
      return 'Requested'
    case 'accepted':
      return 'Accepted'
    case 'in_progress':
      return 'In Progress'
    case 'ready':
      return 'Ready'
    case 'completed':
      return 'Completed'
    case 'canceled':
      return 'Canceled'
    default:
      return status
  }
}
