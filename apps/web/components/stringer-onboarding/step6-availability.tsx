'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormGetValues } from 'react-hook-form'
import { StringerOnboardingData, DropoffMethodConfig } from '@stringerly/types'
import { AvailabilityScheduler } from './availability-scheduler'
import { useState } from 'react'

interface Step6AvailabilityProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
  getValues: UseFormGetValues<StringerOnboardingData>
}

export function Step6Availability({ register, errors, setValue, watch, getValues }: Step6AvailabilityProps) {
  const dropoffMethods = watch('dropoff_methods') || []
  const availability = watch('availability') || []
  const flexibleAvailability = watch('flexible_availability') || false

  const toggleDropoffMethod = (method: string) => {
    const current = dropoffMethods
    const existing = current.find((m: DropoffMethodConfig) => m.method === method)

    if (existing) {
      // Remove it
      setValue(
        'dropoff_methods',
        current.filter((m: DropoffMethodConfig) => m.method !== method)
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
    const updated = current.map((m: DropoffMethodConfig) => (m.method === method ? { ...m, details } : m))
    setValue('dropoff_methods', updated)
  }

  const isMethodEnabled = (method: string) => dropoffMethods.some((m: DropoffMethodConfig) => m.method === method)

  const getMethodDetails = (method: string) => dropoffMethods.find((m: DropoffMethodConfig) => m.method === method)?.details || ''

  return (
    <div className="space-y-6">
      {/* Dropoff Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Drop-off Instructions *
        </label>
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-300">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={isMethodEnabled('dropoff')}
              onChange={() => toggleDropoffMethod('dropoff')}
              className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm text-gray-900">Accept Drop-offs at My Location</div>
              <div className="text-xs text-gray-500">Players will drop off rackets at your address</div>

              {isMethodEnabled('dropoff') && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={getMethodDetails('dropoff')}
                    onChange={(e) => updateDropoffDetails('dropoff', e.target.value)}
                    placeholder="e.g., Side door accessible 9am-8pm daily, ring doorbell"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Provide any special instructions for players (where to park, where to place racket, etc.)
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
        {errors.dropoff_methods && <p className="mt-2 text-sm text-red-600">{errors.dropoff_methods.message}</p>}
      </div>

      {/* Flexible Availability Option */}
      <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
        <label className="flex items-start cursor-pointer">
          <input
            type="checkbox"
            {...register('flexible_availability')}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
          />
          <div className="ml-3">
            <div className="font-medium text-sm text-gray-900">Time slots don't matter to me</div>
            <div className="text-xs text-gray-600 mt-1">
              Check this if you're flexible with dropoff times and don't need to set specific availability hours.
              Players can drop off rackets at any time.
            </div>
          </div>
        </label>
      </div>

      {/* Weekly Availability */}
      {!flexibleAvailability && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Your Weekly Availability (Optional)</label>
          <AvailabilityScheduler availability={availability} onChange={(avail) => setValue('availability', avail)} />
          <p className="mt-2 text-xs text-gray-500">
            Let players know when you're typically available for dropoffs. You can always adjust individual request timing.
          </p>
        </div>
      )}

      {flexibleAvailability && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-500 text-sm">
            Since you have flexible availability, players can request dropoff at any time.
          </p>
        </div>
      )}
    </div>
  )
}
