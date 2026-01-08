'use client'

import { useState } from 'react'
import { Button } from '@stringerly/ui'
import { AlertCircle, DollarSign, Loader2 } from 'lucide-react'
import { PaymentAuthorizationModal } from './payment-authorization-modal'

interface PaymentRequiredBannerProps {
  requestId: string
  quotedPriceCents: number
  stringerName: string
  onPaymentAuthorized: () => void
}

export function PaymentRequiredBanner({
  requestId,
  quotedPriceCents,
  stringerName,
  onPaymentAuthorized,
}: PaymentRequiredBannerProps) {
  const [showModal, setShowModal] = useState(false)

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Payment Authorization Required
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              {stringerName} has accepted your stringing request! To confirm the job and allow them to start work, please authorize payment of{' '}
              <strong>{formatCurrency(quotedPriceCents)}</strong>.
            </p>
            <div className="bg-yellow-100 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>We'll place a hold on your card for {formatCurrency(quotedPriceCents)}</li>
                <li>Your stringer will begin working on your racket</li>
                <li>You won't be charged until you approve the completed work</li>
                <li>If there's an issue, you can dispute before payment is captured</li>
              </ul>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Authorize Payment - {formatCurrency(quotedPriceCents)}
            </Button>
          </div>
        </div>
      </div>

      <PaymentAuthorizationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requestId={requestId}
        quotedPriceCents={quotedPriceCents}
        stringerName={stringerName}
        onSuccess={() => {
          setShowModal(false)
          onPaymentAuthorized()
        }}
      />
    </>
  )
}
