'use client'

import { useState } from 'react'
import { Button, formatPrice } from '@stringerly/ui'
import { X, Calendar, AlertTriangle, Package, DollarSign } from 'lucide-react'

interface AcceptJobModalProps {
  request: {
    id: string
    string_selection: {
      brand: string
      model: string
      gauge: string
    }
    tension_mains_lbs: number
    tension_crosses_lbs: number
    estimated_price_cents: number
  }
  onAccept: (data: {
    confirmed_string_brand: string
    confirmed_string_model: string
    confirmed_tension_mains_lbs: number
    confirmed_tension_crosses_lbs: number
    estimated_completion: string | null
    string_issue_notes?: string
    racket_count: number
    final_price_cents: number
  }) => Promise<void>
  onCancel: () => void
  isAccepting: boolean
}

export function AcceptJobModal({ request, onAccept, onCancel, isAccepting }: AcceptJobModalProps) {
  const [confirmedStringBrand, setConfirmedStringBrand] = useState(request.string_selection.brand)
  const [confirmedStringModel, setConfirmedStringModel] = useState(request.string_selection.model)
  const [confirmedTensionMains, setConfirmedTensionMains] = useState(request.tension_mains_lbs)
  const [confirmedTensionCrosses, setConfirmedTensionCrosses] = useState(request.tension_crosses_lbs)
  const [estimatedHours, setEstimatedHours] = useState('24')
  const [stringIssue, setStringIssue] = useState(false)
  const [stringIssueNotes, setStringIssueNotes] = useState('')
  const [racketCount, setRacketCount] = useState(1)
  const [finalPrice, setFinalPrice] = useState((request.estimated_price_cents / 100).toFixed(2))

  const hasChanges =
    confirmedStringBrand !== request.string_selection.brand ||
    confirmedStringModel !== request.string_selection.model ||
    confirmedTensionMains !== request.tension_mains_lbs ||
    confirmedTensionCrosses !== request.tension_crosses_lbs

  const handleSubmit = async () => {
    const estimatedCompletion = estimatedHours
      ? new Date(Date.now() + parseInt(estimatedHours) * 60 * 60 * 1000).toISOString()
      : null

    await onAccept({
      confirmed_string_brand: confirmedStringBrand,
      confirmed_string_model: confirmedStringModel,
      confirmed_tension_mains_lbs: confirmedTensionMains,
      confirmed_tension_crosses_lbs: confirmedTensionCrosses,
      estimated_completion: estimatedCompletion,
      string_issue_notes: stringIssue ? stringIssueNotes : undefined,
      racket_count: racketCount,
      final_price_cents: Math.round(parseFloat(finalPrice) * 100)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Accept Job & Send Quote</h2>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isAccepting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Racket Count */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Package className="w-4 h-4" />
              Number of Rackets
            </label>
            <select
              value={racketCount}
              onChange={(e) => {
                const count = parseInt(e.target.value)
                setRacketCount(count)
                // Auto-update price based on racket count
                const perRacketPrice = request.estimated_price_cents / 100
                setFinalPrice((perRacketPrice * count).toFixed(2))
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isAccepting}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num} racket{num > 1 ? 's' : ''}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How many rackets will you be stringing for this request?
            </p>
          </div>

          {/* Final Price Quote */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <DollarSign className="w-4 h-4" />
              Your Quote (Total Price) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                step="0.01"
                min="1"
                className="w-full pl-8 pr-3 py-3 border-2 border-green-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={isAccepting}
                required
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Player's estimated price: <span className="font-semibold">{formatPrice(request.estimated_price_cents * racketCount)}</span>
            </p>
            <p className="text-xs text-green-700 mt-1">
              This is the price the player will pay. Make sure it covers all {racketCount} racket{racketCount > 1 ? 's' : ''}.
            </p>
          </div>

          {/* String Details */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Confirm String Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  String Brand
                </label>
                <input
                  type="text"
                  value={confirmedStringBrand}
                  onChange={(e) => setConfirmedStringBrand(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isAccepting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  String Model
                </label>
                <input
                  type="text"
                  value={confirmedStringModel}
                  onChange={(e) => setConfirmedStringModel(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isAccepting}
                />
              </div>
            </div>
          </div>

          {/* Tension */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3">Confirm Tension</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mains (lbs)
                </label>
                <input
                  type="number"
                  value={confirmedTensionMains}
                  onChange={(e) => setConfirmedTensionMains(parseInt(e.target.value))}
                  min="30"
                  max="80"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isAccepting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Crosses (lbs)
                </label>
                <input
                  type="number"
                  value={confirmedTensionCrosses}
                  onChange={(e) => setConfirmedTensionCrosses(parseInt(e.target.value))}
                  min="30"
                  max="80"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isAccepting}
                />
              </div>
            </div>
          </div>

          {/* Changes Warning */}
          {hasChanges && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">String/Tension Changes Detected</p>
                <p className="text-xs text-yellow-700 mt-1">
                  The player will be notified of these changes. Make sure to explain why in the notes below.
                </p>
              </div>
            </div>
          )}

          {/* String Issue Toggle */}
          <div className="border rounded-lg p-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={stringIssue}
                onChange={(e) => setStringIssue(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                disabled={isAccepting}
              />
              <span className="text-sm font-medium text-gray-700">
                Report string or equipment issue
              </span>
            </label>

            {stringIssue && (
              <div className="mt-3">
                <textarea
                  value={stringIssueNotes}
                  onChange={(e) => setStringIssueNotes(e.target.value)}
                  placeholder="Explain the issue (e.g., requested string not available, wrong gauge provided, etc.)"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  disabled={isAccepting}
                  required
                />
              </div>
            )}
          </div>

          {/* Estimated Completion */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4" />
              Estimated Completion Time
            </label>
            <select
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isAccepting}
            >
              <option value="">No estimate</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="8">8 hours (same day)</option>
              <option value="24">24 hours (next day)</option>
              <option value="48">48 hours (2 days)</option>
              <option value="72">72 hours (3 days)</option>
              <option value="168">1 week</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              When do you expect to complete this job?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isAccepting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isAccepting || (stringIssue && !stringIssueNotes.trim()) || !finalPrice || parseFloat(finalPrice) <= 0}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isAccepting ? 'Sending Quote...' : 'Send Quote to Player'}
          </Button>
        </div>
      </div>
    </div>
  )
}
