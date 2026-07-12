'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout/navigation'
import { Button } from '@stringerly/ui'
import { StatusBadge, formatPrice } from '@stringerly/ui'
import {
  ChevronLeft,
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Receipt,
  Shield,
  ArrowRight,
  Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'

interface PaymentDetails {
  request_id: string
  player_id: string
  stringer_id: string
  status: string
  payment_intent_id: string | null
  payment_authorized_at: string | null
  payment_captured_at: string | null
  final_price_cents: number
  tip_cents: number | null
  platform_fee_cents: number | null
  stringer_earnings_cents: number | null
  stringer: {
    full_name: string
    avatar_url?: string
  }
  player: {
    full_name: string
  }
  service_type: string
  created_at: string
  completed_at: string | null
  accepted_at: string | null
}

const serviceTypeLabels: Record<string, string> = {
  restring_only: 'Restring Only',
  restring_grip: 'Restring + Grip Replacement',
  restring_grommets: 'Restring + Grommet Replacement',
  full_service: 'Full Service (Restring + Grip + Grommets)',
}

export default function PaymentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!params.id || !user?.id) return

      try {
        // First, get the request data
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select('*')
          .eq('id', params.id)
          .single()

        if (requestError) throw requestError

        // Verify user has access to this payment info (either player or stringer)
        if (!requestData || (requestData.player_id !== user.id && requestData.stringer_id !== user.id)) {
          setError('You do not have permission to view this payment')
          return
        }

        // Fetch player profile
        const { data: playerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', requestData.player_id)
          .single()

        // Fetch stringer profile
        const { data: stringerProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', requestData.stringer_id)
          .single()

        // Combine the data
        const paymentData: PaymentDetails = {
          request_id: requestData.id,
          player_id: requestData.player_id,
          stringer_id: requestData.stringer_id,
          status: requestData.status,
          payment_intent_id: requestData.payment_intent_id,
          payment_authorized_at: requestData.payment_authorized_at,
          payment_captured_at: requestData.payment_captured_at,
          final_price_cents: requestData.final_price_cents,
          tip_cents: requestData.tip_cents,
          platform_fee_cents: requestData.platform_fee_cents,
          stringer_earnings_cents: requestData.stringer_earnings_cents,
          service_type: requestData.service_type,
          created_at: requestData.created_at,
          completed_at: requestData.completed_at,
          accepted_at: requestData.accepted_at,
          player: {
            full_name: playerProfile?.full_name || 'Unknown Player'
          },
          stringer: {
            full_name: stringerProfile?.full_name || 'Unknown Stringer',
            avatar_url: stringerProfile?.avatar_url
          }
        }

        setPayment(paymentData)
      } catch (err: any) {
        console.error('Error fetching payment details:', err)
        setError(err.message || 'Failed to load payment details')
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [params.id, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Payment details not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate the player's total (stringer price + 5% app tax + tip)
  const appTaxCents = Math.round(payment.final_price_cents * 0.05)
  const playerTotalCents = payment.final_price_cents + appTaxCents + (payment.tip_cents || 0)

  // Determine if current user is the player or stringer
  const isPlayer = user?.id === payment.player_id
  const isStringer = user?.id === payment.stringer_id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/request/${params.id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Request
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
              <p className="text-sm text-gray-600">Transaction information for your stringing service</p>
            </div>
          </div>
        </div>

        {/* Payment Status Banner */}
        <div className={`mb-6 rounded-lg p-6 ${
          payment.payment_captured_at
            ? 'bg-green-50 border-2 border-green-300'
            : payment.payment_authorized_at
            ? 'bg-blue-50 border-2 border-blue-300'
            : 'bg-gray-50 border-2 border-gray-300'
        }`}>
          <div className="flex items-start gap-4">
            {payment.payment_captured_at ? (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : payment.payment_authorized_at ? (
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
            ) : (
              <Info className="w-8 h-8 text-gray-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                payment.payment_captured_at
                  ? 'text-green-900'
                  : payment.payment_authorized_at
                  ? 'text-blue-900'
                  : 'text-gray-900'
              }`}>
                {payment.payment_captured_at
                  ? 'Payment Completed'
                  : payment.payment_authorized_at
                  ? 'Payment Authorized (Pending Capture)'
                  : 'Payment Pending'}
              </h3>
              <p className={`text-sm ${
                payment.payment_captured_at
                  ? 'text-green-700'
                  : payment.payment_authorized_at
                  ? 'text-blue-700'
                  : 'text-gray-700'
              }`}>
                {payment.payment_captured_at
                  ? `Payment was successfully processed on ${new Date(payment.payment_captured_at).toLocaleDateString()}`
                  : payment.payment_authorized_at
                  ? 'Payment is authorized and will be captured when you confirm job completion'
                  : 'Payment has not been authorized yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Amount Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Breakdown
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">Service</p>
                      <p className="font-medium text-gray-900">
                        {serviceTypeLabels[payment.service_type] || payment.service_type}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(payment.final_price_cents)}
                    </p>
                  </div>

                  {payment.tip_cents && payment.tip_cents > 0 && (
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600">Tip</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatPrice(payment.tip_cents)}
                      </p>
                    </div>
                  )}

                  {/* Service Fee (5% app tax) - shown to player */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">Service Fee (5%)</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(appTaxCents)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-lg font-bold text-gray-900">Total Paid</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(playerTotalCents)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stringer Earnings Breakdown - only shown to stringer */}
            {isStringer && payment.platform_fee_cents && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Earnings</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Job Price</p>
                    <p className="font-medium text-gray-900">{formatPrice(payment.final_price_cents)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">Service Fee (12%)</p>
                    <p className="font-medium text-red-600">-{formatPrice(payment.platform_fee_cents)}</p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <p className="font-semibold text-gray-900">Your Earnings</p>
                    <p className="font-semibold text-green-600">
                      {formatPrice(payment.stringer_earnings_cents || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payment Timeline
              </h3>
              <div className="space-y-4">
                {payment.created_at && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Request Created</p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {payment.accepted_at && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-400"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Quote Accepted</p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.accepted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {payment.payment_authorized_at && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Authorized</p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.payment_authorized_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {payment.payment_captured_at && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                      <p className="text-xs text-gray-600">
                        {new Date(payment.payment_captured_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Transaction Info */}
          <div className="space-y-6">
            {/* Service Provider */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Service Provider</h3>
              <div className="flex items-center gap-3">
                <img
                  src={payment.stringer.avatar_url || '/default-avatar.png'}
                  alt={payment.stringer.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">{payment.stringer.full_name}</p>
                  <p className="text-sm text-gray-600">Professional Stringer</p>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Secure Payment</h3>
                  <p className="text-sm text-blue-800">
                    Your payment is processed securely through Stripe. Your payment information is never stored on our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Escrow Info */}
            {payment.payment_authorized_at && !payment.payment_captured_at && (
              <div className="bg-green-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Payment Protection</h3>
                    <p className="text-sm text-green-800">
                      Your payment is held in escrow and will only be released to the stringer after you confirm the completed work.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Link href={`/request/${params.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Request Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
