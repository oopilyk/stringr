'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData, CERTIFICATIONS, PLAYER_LEVELS, STRINGING_LOCATIONS } from '@stringr/types'
import { useState } from 'react'

interface Step2BackgroundProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

export function Step2Background({ register, errors, setValue, watch }: Step2BackgroundProps) {
  const certifications = watch('certifications') || []
  const playerLevels = watch('player_levels_served') || []
  const bio = watch('bio') || ''

  const toggleCertification = (cert: string) => {
    const current = certifications
    if (current.includes(cert)) {
      setValue(
        'certifications',
        current.filter((c) => c !== cert)
      )
    } else {
      setValue('certifications', [...current, cert])
    }
  }

  const togglePlayerLevel = (level: string) => {
    const current = playerLevels
    if (current.includes(level)) {
      setValue(
        'player_levels_served',
        current.filter((l) => l !== level)
      )
    } else {
      setValue('player_levels_served', [...current, level])
    }
  }

  return (
    <div className="space-y-6">
      {/* Years of Experience */}
      <div>
        <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
          Years Stringing Rackets
        </label>
        <select
          id="years_experience"
          {...register('years_experience', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        >
          <option value="">Select...</option>
          <option value="0">Less than 1 year</option>
          <option value="1">1-2 years</option>
          <option value="3">3-5 years</option>
          <option value="6">5-10 years</option>
          <option value="11">10+ years</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">Help players understand your experience level</p>
      </div>

      {/* Rackets Strung */}
      <div>
        <label htmlFor="rackets_strung_count" className="block text-sm font-medium text-gray-700 mb-1">
          Approximate Number of Rackets Strung
        </label>
        <input
          id="rackets_strung_count"
          type="number"
          {...register('rackets_strung_count', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="500"
          min="0"
        />
        <p className="mt-1 text-xs text-gray-500">Best estimate of your total career count</p>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Certifications & Training</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CERTIFICATIONS.map((cert) => (
            <label
              key={cert}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                certifications.includes(cert)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={certifications.includes(cert)}
                onChange={() => toggleCertification(cert)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm">{cert}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Select all that apply</p>
      </div>

      {/* Stringing Location */}
      <div>
        <label htmlFor="stringing_location" className="block text-sm font-medium text-gray-700 mb-1">
          Where do you string?
        </label>
        <select
          id="stringing_location"
          {...register('stringing_location')}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        >
          <option value="">Select...</option>
          {STRINGING_LOCATIONS.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Player Levels Served */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Player Levels You Serve</label>
        <div className="flex flex-wrap gap-2">
          {PLAYER_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => togglePlayerLevel(level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                playerLevels.includes(level)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Select all player levels you're comfortable working with</p>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          Professional Bio
        </label>
        <textarea
          id="bio"
          {...register('bio', { maxLength: { value: 1000, message: 'Bio must be less than 1000 characters' } })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="Tell players about your experience, specialties, and what makes you great at stringing..."
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">This will appear on your profile</p>
          <p className="text-xs text-gray-500">{bio.length} / 1000</p>
        </div>
        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
      </div>
    </div>
  )
}
