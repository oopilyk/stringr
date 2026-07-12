'use client'

import { useState } from 'react'
import { Button } from '@stringerly/ui'
import { X, AlertTriangle, Loader2, Flag } from 'lucide-react'

interface ReportUserModalProps {
  reportedUserId: string
  reportedUserName: string
  requestId?: string | null
  onClose: () => void
  onSuccess?: () => void
}

const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior', description: 'Rude, unprofessional, or disrespectful conduct' },
  { value: 'no_show', label: 'No Show', description: 'Failed to show up for scheduled pickup/dropoff' },
  { value: 'scam_fraud', label: 'Scam or Fraud', description: 'Attempted to deceive or defraud' },
  { value: 'harassment', label: 'Harassment', description: 'Unwanted contact, threats, or intimidation' },
  { value: 'quality_issues', label: 'Quality Issues', description: 'Work quality does not match expectations or agreement' },
  { value: 'communication_issues', label: 'Communication Issues', description: 'Unresponsive or misleading communication' },
  { value: 'other', label: 'Other', description: 'Other issue not listed above' },
] as const

export function ReportUserModal({
  reportedUserId,
  reportedUserName,
  requestId,
  onClose,
  onSuccess
}: ReportUserModalProps) {
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for your report')
      return
    }

    if (description.trim().length < 20) {
      setError('Please provide more details (at least 20 characters)')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          request_id: requestId || null,
          reason,
          description: description.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        onSuccess?.()
        // Auto-close after showing success message
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Failed to submit report')
      }
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flag className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Report Submitted</h3>
          <p className="text-gray-600">
            Thank you for your report. Our team will review it and take appropriate action.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Report User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User being reported */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Reporting</p>
            <p className="font-semibold text-gray-900">{reportedUserName}</p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Report <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    reason === r.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{r.label}</p>
                    <p className="text-sm text-gray-600">{r.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the Issue <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about what happened. Be as specific as possible..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/2000 characters (minimum 20)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> False reports may result in action against your account.
              Reports are reviewed by our team and kept confidential.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-3 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || description.trim().length < 20}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
