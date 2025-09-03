import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`
  }
  return `${km.toFixed(1)}km`
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
