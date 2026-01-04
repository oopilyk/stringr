'use client'

import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormGetValues } from 'react-hook-form'
import { StringerOnboardingData } from '@stringerly/types'
import { StringInventoryManager } from './string-inventory-manager'

interface Step5InventoryProps {
  register: UseFormRegister<StringerOnboardingData>
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
  getValues: UseFormGetValues<StringerOnboardingData>
}

export function Step5Inventory({ register, errors, setValue, watch, getValues }: Step5InventoryProps) {
  const stringInventory = watch('string_inventory') || []
  const acceptsPlayerStrings = watch('accepts_player_strings')

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">String Inventory Management</h3>
        <p className="text-sm text-blue-700">
          Add strings you keep in stock so players can see what's available and pricing. This helps them make informed
          decisions when requesting your services.
        </p>
      </div>

      {/* String Inventory Manager */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Your String Inventory</label>
        <StringInventoryManager
          inventory={stringInventory}
          onChange={(inventory) => setValue('string_inventory', inventory)}
        />
      </div>

      {/* Accept Player-Provided Strings */}
      <div className="border-t pt-6">
        <div className="flex items-start">
          <input
            id="accepts_player_strings"
            type="checkbox"
            {...register('accepts_player_strings')}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
          />
          <label htmlFor="accepts_player_strings" className="ml-3">
            <span className="block text-sm font-medium text-gray-900">Accept Player-Provided Strings</span>
            <span className="block text-xs text-gray-500">
              Allow players to bring their own strings for you to install
            </span>
          </label>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Why track inventory?</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Players can see what strings you have available</li>
          <li>• Set transparent pricing upfront to avoid surprises</li>
          <li>• Manage your stock levels and know when to reorder</li>
          <li>• Show your professionalism and organization</li>
        </ul>
      </div>
    </div>
  )
}
