'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData } from '@rally-strings/types'
import { MapPin, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

interface Step1CredentialsProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

export function Step1Credentials({ register, errors, setValue, watch }: Step1CredentialsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)

  const password = watch('password')

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    if (pwd.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (pwd.length < 12) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
      return { score: 3, label: 'Strong', color: 'bg-green-500' }
    return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  }

  const passwordStrength = getPasswordStrength(password || '')

  const useCurrentLocation = () => {
    setLoadingLocation(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setValue('lat', latitude)
          setValue('lng', longitude)

          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            )
            const data = await response.json()
            const city =
              data.address?.city || data.address?.town || data.address?.village || data.address?.county || ''
            if (city) {
              setValue('city', city)
            }
          } catch (error) {
            console.error('Failed to reverse geocode:', error)
          }
          setLoadingLocation(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLoadingLocation(false)
          alert('Unable to get your location. Please enter your city manually.')
        }
      )
    } else {
      setLoadingLocation(false)
      alert('Geolocation is not supported by your browser.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="your.email@example.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {password && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{passwordStrength.label}</span>
            </div>
          </div>
        )}
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <input
          id="full_name"
          type="text"
          {...register('full_name', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="John Doe"
        />
        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone', {
            required: 'Phone number is required',
            pattern: { value: /^[\d\s\-\(\)\+]+$/, message: 'Invalid phone number' },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      {/* City with geolocation */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          City / Location *
        </label>
        <div className="flex gap-2">
          <input
            id="city"
            type="text"
            {...register('city', {
              required: 'City is required',
              minLength: { value: 2, message: 'City must be at least 2 characters' },
            })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="San Francisco"
          />
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loadingLocation}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        <p className="mt-1 text-xs text-gray-500">Players will use this to find stringers near them</p>
      </div>
    </div>
  )
}
