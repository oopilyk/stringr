'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormGetValues } from 'react-hook-form'
import { StringerOnboardingData, DropoffMethodConfig } from '@stringr/types'
import { AvailabilityScheduler } from './availability-scheduler'
import { useState } from 'react'

interface Step6AvailabilityProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
  getValues: UseFormGetValues<StringerOnboardingData>
}

const DROPOFF_METHODS = [
  {
    method: 'meetup' as const,
    label: 'Meet-up',
    description: 'Meet player at agreed location',
    placeholder: 'e.g., Tennis courts, coffee shops, parking lots',
  },
  {
    method: 'pickup' as const,
    label: 'Pick-up',
    description: 'Pick up from player location',
    placeholder: 'e.g., Within 10 miles, $5 fee for distances over 5 miles',
  },
  {
    method: 'ship' as const,
    label: 'Shipping',
    description: 'Player ships racket to you',
    placeholder: 'e.g., Return shipping included, USPS Priority Mail',
  },
  {
    method: 'dropbox' as const,
    label: 'Drop-box',
    description: 'Drop-off at your location',
    placeholder: 'e.g., 123 Main St, accessible 9am-5pm weekdays',
  },
]

export function Step6Availability({ register, errors, setValue, watch, getValues }: Step6AvailabilityProps) {
  const dropoffMethods = watch('dropoff_methods') || []
  const availability = watch('availability') || []
  const maxDailyJobs = watch('max_daily_jobs') || 5

  const toggleDropoffMethod = (method: string) => {
    const current = dropoffMethods
    const existing = current.find((m) => m.method === method)

    if (existing) {
      // Remove it
      setValue(
        'dropoff_methods',
        current.filter((m) => m.method !== method)
      )
    } else {
      // Add it
      setValue('dropoff_methods', [
        ...current,
        { method: method as any, enabled: true, details: '' } as DropoffMethodConfig,
      ])
    }
  }

  const updateDropoffDetails = (method: string, details: string) => {
    const current = dropoffMethods
    const updated = current.map((m) => (m.method === method ? { ...m, details } : m))
    setValue('dropoff_methods', updated)
  }

  const isMethodEnabled = (method: string) => dropoffMethods.some((m) => m.method === method)

  const getMethodDetails = (method: string) => dropoffMethods.find((m) => m.method === method)?.details || ''

  return (
    <div className="space-y-6">
      {/* Dropoff Methods */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How can players get rackets to you? *
        </label>
        <div className="space-y-3">
          {DROPOFF_METHODS.map((methodConfig) => (
            <div
              key={methodConfig.method}
              className={`border rounded-lg p-4 transition-colors ${
                isMethodEnabled(methodConfig.method) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'
              }`}
            >
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMethodEnabled(methodConfig.method)}
                  onChange={() => toggleDropoffMethod(methodConfig.method)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-sm text-gray-900">{methodConfig.label}</div>
                  <div className="text-xs text-gray-500">{methodConfig.description}</div>

                  {isMethodEnabled(methodConfig.method) && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={getMethodDetails(methodConfig.method)}
                        onChange={(e) => updateDropoffDetails(methodConfig.method, e.target.value)}
                        placeholder={methodConfig.placeholder}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
        {errors.dropoff_methods && <p className="mt-2 text-sm text-red-600">{errors.dropoff_methods.message}</p>}
      </div>

      {/* Weekly Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Your Weekly Availability (Optional)</label>
        <AvailabilityScheduler availability={availability} onChange={(avail) => setValue('availability', avail)} />
        <p className="mt-2 text-xs text-gray-500">
          Let players know when you're typically available. You can always adjust individual request timing.
        </p>
      </div>

      {/* Max Daily Jobs */}
      <div>
        <label htmlFor="max_daily_jobs" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Jobs Per Day *
        </label>
        <input
          id="max_daily_jobs"
          type="number"
          {...register('max_daily_jobs', {
            required: 'Maximum daily jobs is required',
            valueAsNumber: true,
            min: { value: 1, message: 'Must be at least 1' },
            max: { value: 50, message: 'Must be 50 or less' },
          })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="5"
          min="1"
          max="50"
        />
        {errors.max_daily_jobs && <p className="mt-1 text-sm text-red-600">{errors.max_daily_jobs.message}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Prevents overbooking. You won't receive more than this many requests per day.
        </p>
      </div>
    </div>
  )
}
