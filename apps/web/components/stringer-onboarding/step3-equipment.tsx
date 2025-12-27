'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData, MACHINE_BRANDS, RACKET_TYPES } from '@rally-strings/types'
import { useState } from 'react'

interface Step3EquipmentProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

export function Step3Equipment({ register, errors, setValue, watch }: Step3EquipmentProps) {
  const machineBrand = watch('machine_brand')
  const machineType = watch('machine_type')
  const supportedRacketTypes = watch('supported_racket_types') || []

  const [showOtherBrand, setShowOtherBrand] = useState(machineBrand === 'Other' || !MACHINE_BRANDS.includes(machineBrand as any))

  const handleBrandChange = (brand: string) => {
    setValue('machine_brand', brand)
    setShowOtherBrand(brand === 'Other')
  }

  const toggleRacketType = (type: string) => {
    const current = supportedRacketTypes
    if (current.includes(type)) {
      setValue(
        'supported_racket_types',
        current.filter((t) => t !== type)
      )
    } else {
      setValue('supported_racket_types', [...current, type])
    }
  }

  return (
    <div className="space-y-6">
      {/* Machine Brand */}
      <div>
        <label htmlFor="machine_brand" className="block text-sm font-medium text-gray-700 mb-1">
          Stringing Machine Brand
        </label>
        <select
          id="machine_brand"
          value={showOtherBrand && machineBrand && !MACHINE_BRANDS.includes(machineBrand as any) ? 'Other' : machineBrand || ''}
          onChange={(e) => handleBrandChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
        >
          <option value="">Select...</option>
          {MACHINE_BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* Other Brand Input */}
      {showOtherBrand && (
        <div>
          <label htmlFor="machine_brand_other" className="block text-sm font-medium text-gray-700 mb-1">
            Specify Machine Brand
          </label>
          <input
            id="machine_brand_other"
            type="text"
            value={machineBrand && machineBrand !== 'Other' ? machineBrand : ''}
            onChange={(e) => setValue('machine_brand', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
            placeholder="Enter brand name"
          />
        </div>
      )}

      {/* Machine Model */}
      <div>
        <label htmlFor="machine_model" className="block text-sm font-medium text-gray-700 mb-1">
          Machine Model
        </label>
        <input
          id="machine_model"
          type="text"
          {...register('machine_model')}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="e.g., X-6FC, Progression II"
        />
        <p className="mt-1 text-xs text-gray-500">Optional but helps build trust with players</p>
      </div>

      {/* Machine Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Machine Type</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'drop-weight', label: 'Drop-weight', description: 'Traditional gravity-based' },
            { value: 'electronic', label: 'Electronic', description: 'Digital tension control' },
            { value: 'crank', label: 'Crank', description: 'Manual lever system' },
          ].map((type) => (
            <label
              key={type.value}
              className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors ${
                machineType === type.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                value={type.value}
                {...register('machine_type')}
                className="sr-only"
              />
              <span className="font-medium text-sm">{type.label}</span>
              <span className="text-xs text-gray-500 mt-1">{type.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Supported Racket Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Racket Types You Can String</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RACKET_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                supportedRacketTypes.includes(type)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={supportedRacketTypes.includes(type)}
                onChange={() => toggleRacketType(type)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="ml-2 text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Tension */}
      <div>
        <label htmlFor="max_tension" className="block text-sm font-medium text-gray-700 mb-1">
          Maximum Tension (lbs)
        </label>
        <input
          id="max_tension"
          type="number"
          {...register('max_tension', { valueAsNumber: true })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          placeholder="70"
          min="40"
          max="100"
        />
        <p className="mt-1 text-xs text-gray-500">Typical range: 40-70 lbs. High performance machines can go higher.</p>
      </div>
    </div>
  )
}
