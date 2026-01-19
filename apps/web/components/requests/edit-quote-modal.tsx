'use client'

import { useState } from 'react'
import { Button, formatPrice } from '@stringerly/ui'
import { X, DollarSign, Loader2 } from 'lucide-react'

interface EditQuoteModalProps {
  request: {
    id: string
    final_price_cents: number
    estimated_price_cents: number
  }
  playerName: string
  onSave: (newPriceCents: number) => Promise<void>
  onCancel: () => void
}

export function EditQuoteModal({ request, playerName, onSave, onCancel }: EditQuoteModalProps) {
  const [finalPrice, setFinalPrice] = useState(((request.final_price_cents || request.estimated_price_cents) / 100).toFixed(2))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const currentPriceCents = request.final_price_cents || request.estimated_price_cents
  const newPriceCents = Math.round(parseFloat(finalPrice) * 100)
  const hasChanged = newPriceCents !== currentPriceCents

  const handleSubmit = async () => {
    if (!finalPrice || parseFloat(finalPrice) < 1) {
      setError('Price must be at least $1.00')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await onSave(newPriceCents)
    } catch (err: any) {
      setError(err.message || 'Failed to update quote')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-white">Edit Quote</h2>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Quote Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Current quote for {playerName}</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(currentPriceCents)}</p>
          </div>

          {/* New Price Input */}
          <div className="border-2 border-amber-200 rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <DollarSign className="w-4 h-4" />
              New Quote Price <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                step="0.01"
                min="1"
                className="w-full pl-8 pr-3 py-3 border-2 border-amber-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                disabled={isSaving}
                required
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Original estimated price: <span className="font-semibold">{formatPrice(request.estimated_price_cents)}</span>
            </p>
          </div>

          {/* Change Summary */}
          {hasChanged && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {newPriceCents > currentPriceCents
                  ? `Increasing quote by ${formatPrice(newPriceCents - currentPriceCents)}`
                  : `Decreasing quote by ${formatPrice(currentPriceCents - newPriceCents)}`
                }
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 border-t rounded-b-xl">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || !hasChanged || !finalPrice || parseFloat(finalPrice) < 1}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Quote'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
