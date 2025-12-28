'use client'

import { formatPrice } from '@stringr/ui'

interface PricingPreviewProps {
  basePrice: number // in cents
  rushFee: number
  acceptsRush: boolean
  bulkDiscount?: number
  turnaroundHours: number
}

export function PricingPreview({ basePrice, rushFee, acceptsRush, bulkDiscount = 0, turnaroundHours }: PricingPreviewProps) {
  const rushTotal = basePrice + rushFee
  const bulkPrice = basePrice * (1 - bulkDiscount / 100)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Pricing Preview</h3>

      <div className="space-y-3">
        {/* Standard Service */}
        <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
          <div>
            <div className="font-medium text-gray-900">Standard Service</div>
            <div className="text-sm text-gray-600">{turnaroundHours}h turnaround</div>
          </div>
          <div className="text-xl font-bold text-primary">{formatPrice(basePrice)}</div>
        </div>

        {/* Rush Service */}
        {acceptsRush && (
          <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
            <div>
              <div className="font-medium text-gray-900">Rush Service</div>
              <div className="text-sm text-gray-600">
                Base {formatPrice(basePrice)} + Rush {formatPrice(rushFee)}
              </div>
            </div>
            <div className="text-xl font-bold text-orange-600">{formatPrice(rushTotal)}</div>
          </div>
        )}

        {/* Bulk Discount */}
        {bulkDiscount > 0 && (
          <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
            <div>
              <div className="font-medium text-gray-900">3+ Rackets</div>
              <div className="text-sm text-gray-600">{bulkDiscount}% discount applied</div>
            </div>
            <div className="text-xl font-bold text-green-600">{formatPrice(Math.round(bulkPrice))}</div>
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-600 italic">Players will see these prices when requesting your services</div>
    </div>
  )
}
