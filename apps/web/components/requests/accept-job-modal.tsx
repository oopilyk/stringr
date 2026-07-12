'use client'

import { useState } from 'react'
import { Button, formatPrice } from '@stringerly/ui'
import { X, Calendar, AlertTriangle, DollarSign, Check } from 'lucide-react'

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
    is_rush?: boolean
    preferred_completion_date?: string
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
  const [finalPrice, setFinalPrice] = useState((request.estimated_price_cents / 100).toFixed(2))
  const [rushConfirmed, setRushConfirmed] = useState(false)

  const hasChanges =
    confirmedStringBrand !== request.string_selection.brand ||
    confirmedStringModel !== request.string_selection.model ||
    confirmedTensionMains !== request.tension_mains_lbs ||
    confirmedTensionCrosses !== request.tension_crosses_lbs

  const handleSubmit = async () => {
    let estimatedCompletion: string | null = null

    if (request.is_rush && request.preferred_completion_date) {
      // For rush orders, use the player's requested completion date
      // But if that date is in the past, use today instead
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [year, month, day] = request.preferred_completion_date.split('-').map(Number)
      const preferredDate = new Date(year, month - 1, day)

      // Use the later of: preferred date or today
      const deadlineDate = preferredDate < today ? today : preferredDate
      deadlineDate.setHours(23, 59, 59, 0)
      estimatedCompletion = deadlineDate.toISOString()
    } else if (estimatedHours) {
      // For non-rush orders, calculate based on selected hours
      estimatedCompletion = new Date(Date.now() + parseInt(estimatedHours) * 60 * 60 * 1000).toISOString()
    }

    await onAccept({
      confirmed_string_brand: confirmedStringBrand,
      confirmed_string_model: confirmedStringModel,
      confirmed_tension_mains_lbs: confirmedTensionMains,
      confirmed_tension_crosses_lbs: confirmedTensionCrosses,
      estimated_completion: estimatedCompletion,
      string_issue_notes: stringIssue ? stringIssueNotes : undefined,
      racket_count: 1,
      final_price_cents: Math.round(parseFloat(finalPrice) * 100)
    })
  }

  // Format the rush deadline with exact time - use today if the original deadline has passed
  const getRushDeadline = () => {
    if (!request.preferred_completion_date) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parse the preferred date
    const [year, month, day] = request.preferred_completion_date.split('-').map(Number)
    const preferredDate = new Date(year, month - 1, day)

    // If the preferred date is in the past, use today
    const deadlineDate = preferredDate < today ? today : preferredDate
    // Set to end of day (11:59 PM)
    deadlineDate.setHours(23, 59, 0, 0)

    return deadlineDate.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const rushDeadline = getRushDeadline()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`sticky top-0 px-6 py-4 flex items-center justify-between ${
          request.is_rush
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
          <div className="flex items-center gap-3">
            {request.is_rush && <span className="text-2xl">⚡</span>}
            <h2 className="text-xl font-bold text-white">
              {request.is_rush ? 'Accept Rush Order' : 'Accept Job & Send Quote'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isAccepting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Details Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>

            {/* String Details */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <h4 className="font-medium text-gray-700 mb-3">String</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Brand</label>
                  <input
                    type="text"
                    value={confirmedStringBrand}
                    onChange={(e) => setConfirmedStringBrand(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    disabled={isAccepting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Model</label>
                  <input
                    type="text"
                    value={confirmedStringModel}
                    onChange={(e) => setConfirmedStringModel(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    disabled={isAccepting}
                  />
                </div>
              </div>
            </div>

            {/* Tension */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">Tension</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mains (lbs)</label>
                  <input
                    type="number"
                    value={confirmedTensionMains}
                    onChange={(e) => setConfirmedTensionMains(parseInt(e.target.value))}
                    min="30"
                    max="80"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    disabled={isAccepting}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Crosses (lbs)</label>
                  <input
                    type="number"
                    value={confirmedTensionCrosses}
                    onChange={(e) => setConfirmedTensionCrosses(parseInt(e.target.value))}
                    min="30"
                    max="80"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    disabled={isAccepting}
                  />
                </div>
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
                  The player will be notified of these changes.
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
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  rows={3}
                  disabled={isAccepting}
                  required
                />
              </div>
            )}
          </div>

          {/* Completion Time Section - Different for Rush vs Non-Rush */}
          {request.is_rush ? (
            // Rush Order Confirmation
            <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚡</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-2">Rush Order Commitment</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    By accepting this rush order, you confirm that you can complete this racket by:
                  </p>
                  <p className="text-lg font-bold text-amber-900 mb-3">
                    {rushDeadline || 'As soon as possible'}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rushConfirmed}
                      onChange={(e) => setRushConfirmed(e.target.checked)}
                      className="w-5 h-5 text-amber-600 rounded focus:ring-2 focus:ring-amber-500"
                      disabled={isAccepting}
                    />
                    <span className="text-sm font-medium text-amber-900">
                      I confirm I can meet this deadline
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            // Non-Rush: Minimum Completion Time
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
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="8">8 hours (same day)</option>
                <option value="24">24 hours (next day)</option>
                <option value="48">48 hours (2 days)</option>
                <option value="72">72 hours (3 days)</option>
                <option value="168">1 week</option>
              </select>
              {estimatedHours && (
                <p className="text-sm text-green-700 mt-2 font-medium">
                  Ready by: {new Date(Date.now() + parseInt(estimatedHours) * 60 * 60 * 1000).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              )}
            </div>
          )}

          {/* Price Quote - At the bottom */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <DollarSign className="w-4 h-4" />
              Your Quote <span className="text-red-500">*</span>
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
              Player's estimated price: <span className="font-semibold">{formatPrice(request.estimated_price_cents)}</span>
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
            disabled={
              isAccepting ||
              (stringIssue && !stringIssueNotes.trim()) ||
              !finalPrice ||
              parseFloat(finalPrice) <= 0 ||
              (request.is_rush && !rushConfirmed)
            }
            className={`flex-1 text-white ${
              request.is_rush
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isAccepting ? 'Sending Quote...' : request.is_rush ? 'Accept Rush Order' : 'Send Quote to Player'}
          </Button>
        </div>
      </div>
    </div>
  )
}
