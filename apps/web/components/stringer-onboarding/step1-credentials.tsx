'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData } from '@stringerly/types'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { formatPhoneNumber, formatEmail, formatFullName } from '@/lib/utils/input-formatters'
import { LocationAutocomplete } from '@/components/common/location-autocomplete'

interface Step1CredentialsProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

export function Step1Credentials({ register, errors, setValue, watch }: Step1CredentialsProps) {
  const [showPassword, setShowPassword] = useState(false)

  const password = watch('password')
  const phone = watch('phone')
  const email = watch('email')
  const city = watch('city')
  const fullName = watch('full_name')

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    if (pwd.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (pwd.length < 12) return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
      return { score: 3, label: 'Strong', color: 'bg-green-500' }
    return { score: 2, label: 'Fair', color: 'bg-yellow-500' }
  }

  const passwordStrength = getPasswordStrength(password || '')

  const handleLocationChange = (cityName: string, lat?: number, lng?: number) => {
    setValue('city', cityName)
    if (lat !== undefined && lng !== undefined) {
      setValue('lat', lat)
      setValue('lng', lng)
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
          value={email || ''}
          onChange={(e) => setValue('email', formatEmail(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="your.email@example.com"
          maxLength={100}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        <p className="mt-1 text-xs text-gray-500">Will be automatically converted to lowercase</p>
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
          value={fullName || ''}
          onChange={(e) => setValue('full_name', formatFullName(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="John Doe"
          maxLength={100}
        />
        {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
        <p className="mt-1 text-xs text-gray-500">First letter of each word will be capitalized</p>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          value={phone || ''}
          onChange={(e) => setValue('phone', formatPhoneNumber(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="(555) 123-4567"
          maxLength={14}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        <p className="mt-1 text-xs text-gray-500">Format: (XXX) XXX-XXXX</p>
      </div>

      {/* City with autocomplete */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
          City / Location *
        </label>
        <LocationAutocomplete
          value={city || ''}
          onChange={handleLocationChange}
          placeholder="Baltimore, MD"
          error={errors.city?.message}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Start typing to search for your location. Players will use this to find stringers near them.
        </p>
      </div>
    </div>
  )
}
