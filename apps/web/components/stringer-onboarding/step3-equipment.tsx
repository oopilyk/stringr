'use client'

import { FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { StringerOnboardingData, MACHINE_BRANDS, RACKET_TYPES } from '@stringerly/types'
import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'

interface Step3EquipmentProps {
  errors: FieldErrors<StringerOnboardingData>
  setValue: UseFormSetValue<StringerOnboardingData>
  watch: UseFormWatch<StringerOnboardingData>
}

interface Machine {
  brand: string
  model: string
  type: 'drop-weight' | 'electronic' | 'crank' | undefined
  max_tension: number
}

export function Step3Equipment({ errors, setValue, watch }: Step3EquipmentProps) {
  const supportedRacketTypes = watch('supported_racket_types') || []
  const [machines, setMachines] = useState<Machine[]>([])
  const [isAddingMachine, setIsAddingMachine] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentMachine, setCurrentMachine] = useState<Machine>({
    brand: '',
    model: '',
    type: undefined,
    max_tension: 70
  })
  const [showOtherBrand, setShowOtherBrand] = useState(false)

  const handleAddMachine = () => {
    setIsAddingMachine(true)
    setEditingIndex(null)
    setCurrentMachine({
      brand: '',
      model: '',
      type: undefined,
      max_tension: 70
    })
    setShowOtherBrand(false)
  }

  const handleEditMachine = (index: number) => {
    const machine = machines[index]
    setCurrentMachine(machine)
    setEditingIndex(index)
    setIsAddingMachine(true)
    setShowOtherBrand(!MACHINE_BRANDS.includes(machine.brand as any) && machine.brand !== '')
  }

  const handleSaveMachine = () => {
    if (!currentMachine.brand || !currentMachine.type) {
      alert('Please fill in at least the brand and type')
      return
    }

    const updatedMachines = editingIndex !== null
      ? machines.map((m, i) => (i === editingIndex ? currentMachine : m))
      : [...machines, currentMachine]

    setMachines(updatedMachines)

    // Update form values - store the primary machine info
    if (updatedMachines.length > 0) {
      const primaryMachine = updatedMachines[0]
      setValue('machine_brand', primaryMachine.brand)
      setValue('machine_model', primaryMachine.model)
      setValue('machine_type', primaryMachine.type)
      setValue('max_tension', primaryMachine.max_tension)
    }

    setIsAddingMachine(false)
    setEditingIndex(null)
    setCurrentMachine({
      brand: '',
      model: '',
      type: undefined,
      max_tension: 70
    })
  }

  const handleDeleteMachine = (index: number) => {
    const updatedMachines = machines.filter((_, i) => i !== index)
    setMachines(updatedMachines)

    // Update form with new primary machine if exists
    if (updatedMachines.length > 0) {
      const primaryMachine = updatedMachines[0]
      setValue('machine_brand', primaryMachine.brand)
      setValue('machine_model', primaryMachine.model)
      setValue('machine_type', primaryMachine.type)
      setValue('max_tension', primaryMachine.max_tension)
    }
  }

  const handleCancelAdd = () => {
    setIsAddingMachine(false)
    setEditingIndex(null)
    setCurrentMachine({
      brand: '',
      model: '',
      type: undefined,
      max_tension: 70
    })
  }

  const handleBrandChange = (brand: string) => {
    setCurrentMachine({ ...currentMachine, brand })
    setShowOtherBrand(brand === 'Other')
  }

  const toggleRacketType = (type: string) => {
    const current = supportedRacketTypes
    if (current.includes(type)) {
      setValue(
        'supported_racket_types',
        current.filter((t: string) => t !== type)
      )
    } else {
      setValue('supported_racket_types', [...current, type])
    }
  }

  return (
    <div className="space-y-6">
      {/* Stringing Machines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Stringing Machines
        </label>

        {/* List of added machines */}
        {machines.length > 0 && (
          <div className="space-y-2 mb-4">
            {machines.map((machine, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-white"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {machine.brand} {machine.model && `- ${machine.model}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {machine.type?.replace('-', ' ') || 'Unknown type'} • Max {machine.max_tension} lbs
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditMachine(index)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMachine(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Machine Button */}
        {!isAddingMachine && (
          <button
            type="button"
            onClick={handleAddMachine}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Stringing Machine</span>
          </button>
        )}

        {/* Machine Form */}
        {isAddingMachine && (
          <div className="border-2 border-primary rounded-lg p-4 bg-blue-50 space-y-4">
            <h3 className="font-medium text-gray-900">
              {editingIndex !== null ? 'Edit Machine' : 'Add Machine'}
            </h3>

            {/* Brand */}
            <div>
              <label htmlFor="machine_brand_input" className="block text-sm font-medium text-gray-700 mb-1">
                Machine Brand *
              </label>
              <select
                id="machine_brand_input"
                value={showOtherBrand && currentMachine.brand && !MACHINE_BRANDS.includes(currentMachine.brand as any) ? 'Other' : currentMachine.brand || ''}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select...</option>
                {MACHINE_BRANDS.map((brand: string) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            {/* Other Brand */}
            {showOtherBrand && (
              <div>
                <label htmlFor="machine_brand_other_input" className="block text-sm font-medium text-gray-700 mb-1">
                  Specify Brand
                </label>
                <input
                  id="machine_brand_other_input"
                  type="text"
                  value={currentMachine.brand && currentMachine.brand !== 'Other' ? currentMachine.brand : ''}
                  onChange={(e) => setCurrentMachine({ ...currentMachine, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter brand name"
                />
              </div>
            )}

            {/* Model */}
            <div>
              <label htmlFor="machine_model_input" className="block text-sm font-medium text-gray-700 mb-1">
                Machine Model
              </label>
              <input
                id="machine_model_input"
                type="text"
                value={currentMachine.model}
                onChange={(e) => setCurrentMachine({ ...currentMachine, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., X-6FC, Progression II"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Machine Type *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'drop-weight', label: 'Drop-weight', description: 'Traditional gravity-based' },
                  { value: 'electronic', label: 'Electronic', description: 'Digital tension control' },
                  { value: 'crank', label: 'Crank', description: 'Manual lever system' },
                ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                      currentMachine.type === type.value
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      checked={currentMachine.type === type.value}
                      onChange={(e) => setCurrentMachine({ ...currentMachine, type: e.target.value as any })}
                      className="sr-only"
                    />
                    <span className="font-medium text-sm">{type.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{type.description}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max Tension */}
            <div>
              <label htmlFor="machine_max_tension_input" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Tension (lbs)
              </label>
              <input
                id="machine_max_tension_input"
                type="number"
                value={currentMachine.max_tension}
                onChange={(e) => setCurrentMachine({ ...currentMachine, max_tension: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="70"
                min="40"
                max="100"
              />
              <p className="mt-1 text-xs text-gray-500">Typical range: 40-70 lbs</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveMachine}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                {editingIndex !== null ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Supported Racket Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Racket Types You Can String</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RACKET_TYPES.map((type: string) => (
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
    </div>
  )
}
