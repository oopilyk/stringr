'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData } from '@rally-strings/types'
import { PricingPreview } from './pricing-preview'
import { useState, useEffect } from 'react'

interface Step4PricingProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

export function Step4Pricing({ register, errors, setValue, watch }: Step4PricingProps) {
  const basePrice = watch('base_price_cents') || 2500
  const turnaroundHours = watch('turnaround_hours') || 24
  const acceptsRush = watch('accepts_rush') || false
  const rushFee = watch('rush_fee_cents') || 500
  const bulkDiscount = watch('discount_bulk_jobs') || 0
  const pricingNotes = watch('pricing_notes') || ''

  const [basePriceDollars, setBasePriceDollars] = useState((basePrice / 100).toFixed(2))

  useEffect(() => {
    setBasePriceDollars((basePrice / 100).toFixed(2))
  }, [basePrice])

  const handleSliderChange = (value: number) => {
    setValue('base_price_cents', value)
    setBasePriceDollars((value / 100).toFixed(2))
  }

  const handleInputChange = (value: string) => {
    setBasePriceDollars(value)
    const cents = Math.round(parseFloat(value || '0') * 100)
    setValue('base_price_cents', cents)
  }

  return (
    <div className="space-y-6">
      {/* Base Price */}
      <div>
        <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-1">
          Base Labor Price * <span className="text-2xl font-bold text-primary ml-2">${basePriceDollars}</span>
        </label>
        <div className="space-y-3">
          <input
            id="base_price_slider"
            type="range"
            min="1000"
            max="10000"
            step="100"
            value={basePrice}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>$10</span>
            <span>$100</span>
          </div>
          <input
            id="base_price_input"
            type="number"
            step="0.50"
            value={basePriceDollars}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="25.00"
          />
        </div>
        {errors.base_price_cents && <p className="mt-1 text-sm text-red-600">{errors.base_price_cents.message}</p>}
        <p className="mt-1 text-xs text-gray-500">Labor only. String costs are typically added separately.</p>
      </div>

      {/* Turnaround Time */}
      <div>
        <label htmlFor="turnaround_hours" className="block text-sm font-medium text-gray-700 mb-1">
          Typical Turnaround Time *
        </label>
        <select
          id="turnaround_hours"
          {...register('turnaround_hours', { required: 'Turnaround time is required', valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        >
          <option value="">Select...</option>
          <option value="6">6 hours (same day)</option>
          <option value="12">12 hours (same day)</option>
          <option value="24">24 hours (next day)</option>
          <option value="48">48 hours (2 days)</option>
          <option value="72">72 hours (3 days)</option>
          <option value="168">1 week</option>
        </select>
        {errors.turnaround_hours && <p className="mt-1 text-sm text-red-600">{errors.turnaround_hours.message}</p>}
      </div>

      {/* Accept Rush Orders */}
      <div className="flex items-start">
        <input
          id="accepts_rush"
          type="checkbox"
          {...register('accepts_rush')}
          className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
        />
        <label htmlFor="accepts_rush" className="ml-3">
          <span className="block text-sm font-medium text-gray-900">Accept Rush Orders</span>
          <span className="block text-xs text-gray-500">Offer faster turnaround for an additional fee</span>
        </label>
      </div>

      {/* Rush Fee */}
      {acceptsRush && (
        <div>
          <label htmlFor="rush_fee_cents" className="block text-sm font-medium text-gray-700 mb-1">
            Rush Fee
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <input
              id="rush_fee_cents"
              type="number"
              step="0.50"
              value={(rushFee / 100).toFixed(2)}
              onChange={(e) => setValue('rush_fee_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="5.00"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Additional fee for rush service</p>
        </div>
      )}

      {/* Bulk Discount */}
      <div>
        <label htmlFor="discount_bulk_jobs" className="block text-sm font-medium text-gray-700 mb-1">
          Bulk Discount (3+ rackets)
        </label>
        <div className="flex items-center gap-3">
          <input
            id="discount_bulk_jobs"
            type="number"
            {...register('discount_bulk_jobs', { valueAsNumber: true })}
            className="w-24 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="0"
            min="0"
            max="50"
          />
          <span className="text-gray-700">% off</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Optional discount for customers bringing multiple rackets</p>
      </div>

      {/* Pricing Notes */}
      <div>
        <label htmlFor="pricing_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Pricing Notes (Optional)
        </label>
        <textarea
          id="pricing_notes"
          {...register('pricing_notes', { maxLength: { value: 500, message: 'Notes must be less than 500 characters' } })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="e.g., String cost not included. Natural gut +$10. Free grip replacement with each stringing."
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">Additional pricing details players should know</p>
          <p className="text-xs text-gray-500">{pricingNotes.length} / 500</p>
        </div>
        {errors.pricing_notes && <p className="mt-1 text-sm text-red-600">{errors.pricing_notes.message}</p>}
      </div>

      {/* Live Preview */}
      <div>
        <PricingPreview
          basePrice={basePrice}
          rushFee={rushFee}
          acceptsRush={acceptsRush}
          bulkDiscount={bulkDiscount}
          turnaroundHours={turnaroundHours}
        />
      </div>
    </div>
  )
}
