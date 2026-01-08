'use client'

import { DollarSign, TrendingUp, Clock } from 'lucide-react'

interface EarningsBreakdownProps {
  quotedPriceCents: number
  platformFeeCents?: number
  stringerEarningsCents?: number
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  paymentAuthorizedAt?: string | null
  paymentCapturedAt?: string | null
}

export function EarningsBreakdown({
  quotedPriceCents,
  platformFeeCents,
  stringerEarningsCents,
  paymentStatus,
  paymentAuthorizedAt,
  paymentCapturedAt,
}: EarningsBreakdownProps) {
  // Calculate if not provided
  const platformFee = platformFeeCents ?? Math.round(quotedPriceCents * 0.12)
  const stringerEarnings = stringerEarningsCents ?? (quotedPriceCents - platformFee)

  // Estimate Stripe fees (2.9% + $0.30)
  const stripeFeeCents = Math.round(quotedPriceCents * 0.029) + 30
  const netEarnings = stringerEarnings - stripeFeeCents

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  const getStatusBadge = () => {
    if (paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <DollarSign className="w-3 h-3 mr-1" />
          Paid
        </span>
      )
    }
    if (paymentAuthorizedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Authorized - Pending Completion
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        Awaiting Payment
        </span>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Earnings Breakdown</span>
        {getStatusBadge()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Job Price</span>
          <span className="font-medium">{formatCurrency(quotedPriceCents)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform Fee (12%)</span>
          <span className="text-red-600">-{formatCurrency(platformFee)}</span>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
          <span className="text-gray-600">Your Earnings</span>
          <span className="font-semibold text-green-600">{formatCurrency(stringerEarnings)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>Stripe Processing (~{((stripeFeeCents / quotedPriceCents) * 100).toFixed(1)}%)</span>
          <span>-{formatCurrency(stripeFeeCents)}</span>
        </div>

        <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Net to Your Bank</span>
          <span className="text-green-700">{formatCurrency(netEarnings)}</span>
        </div>
      </div>

      {paymentStatus === 'paid' && paymentCapturedAt && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-green-700">
            <strong>Paid:</strong> {new Date(paymentCapturedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Funds will be transferred to your bank account within 2-3 business days.
          </p>
        </div>
      )}

      {paymentAuthorizedAt && paymentStatus !== 'paid' && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            Payment authorized on {new Date(paymentAuthorizedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}. Waiting for player to approve completed work.
          </p>
        </div>
      )}
    </div>
  )
}
