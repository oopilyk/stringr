'use client'

import { useState } from 'react'
import { Button } from '@stringerly/ui'
import { Edit2, Check, X } from 'lucide-react'
import { formatPhoneNumber, formatEmail, formatCityName, formatFullName } from '@/lib/utils/input-formatters'

interface InlineEditFieldProps {
  label: string
  value: string
  fieldName: string
  type?: 'text' | 'textarea' | 'tel' | 'email'
  onSave: (fieldName: string, value: string) => Promise<void>
  placeholder?: string
  maxLength?: number
}

export function InlineEditField({
  label,
  value,
  fieldName,
  type = 'text',
  onSave,
  placeholder,
  maxLength
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (newValue: string) => {
    // Apply formatting based on field type and name
    let formatted = newValue

    if (type === 'tel' || fieldName === 'phone') {
      formatted = formatPhoneNumber(newValue)
    } else if (type === 'email') {
      formatted = formatEmail(newValue)
    } else if (fieldName === 'city') {
      formatted = formatCityName(newValue)
    } else if (fieldName === 'full_name') {
      formatted = formatFullName(newValue)
    }

    setEditValue(formatted)
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(fieldName, editValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
  }

  if (!isEditing) {
    return (
      <div className="group">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <div className="text-gray-900">
              {value || <span className="text-gray-400 italic">Not set</span>}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={editValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={maxLength || 1000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isSaving}
        />
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength || (type === 'tel' ? 14 : 100)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          disabled={isSaving}
        />
      )}
      {maxLength && type === 'textarea' && (
        <p className="text-xs text-gray-500 mt-1">{editValue.length} / {maxLength}</p>
      )}
      <div className="flex gap-2 mt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-4 h-4 mr-1" />
              Save
            </>
          )}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isSaving}
          variant="outline"
          size="sm"
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  )
}
