import Stripe from 'stripe'

// Lazy-load Stripe instance to avoid requiring env vars at build time
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Export stripe for backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const stripeInstance = getStripe()
    const value = stripeInstance[prop as keyof Stripe]
    return typeof value === 'function' ? value.bind(stripeInstance) : value
  },
})

// Platform fee percentage (12%)
export const PLATFORM_FEE_PERCENT = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT || '12', 10)

/**
 * Calculate platform fee and stringer earnings from a quoted price
 */
export function calculatePaymentBreakdown(quotedPriceCents: number) {
  const platformFeeCents = Math.round(quotedPriceCents * (PLATFORM_FEE_PERCENT / 100))
  const stringerEarningsCents = quotedPriceCents - platformFeeCents

  return {
    quotedPriceCents,
    platformFeeCents,
    stringerEarningsCents,
    platformFeePercent: PLATFORM_FEE_PERCENT,
  }
}

/**
 * Create a Stripe Connect account link for stringer onboarding
 */
export async function createConnectAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink
}

/**
 * Create a Stripe Connected Account for a stringer
 */
export async function createConnectedAccount(email: string, country: string = 'US') {
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  })

  return account
}

/**
 * Retrieve account details to check onboarding status
 */
export async function getConnectedAccountDetails(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    email: account.email,
  }
}

/**
 * Create a payment intent with application fee (escrow hold)
 * This authorizes the payment but doesn't capture it yet
 */
export async function createPaymentIntent(
  amountCents: number,
  stringerStripeAccountId: string,
  requestId: string,
  metadata?: Record<string, string>
) {
  const { platformFeeCents, stringerEarningsCents } = calculatePaymentBreakdown(amountCents)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: stringerStripeAccountId,
    },
    capture_method: 'manual', // Important: Hold the payment, don't capture yet
    metadata: {
      request_id: requestId,
      platform_fee_cents: platformFeeCents.toString(),
      stringer_earnings_cents: stringerEarningsCents.toString(),
      ...metadata,
    },
  })

  return paymentIntent
}

/**
 * Authorize payment with a payment method (wrapper for createPaymentIntent + confirm)
 * Used when player authorizes payment for an accepted quote
 */
export async function authorizePayment(params: {
  amount_cents: number
  stringer_account_id: string
  request_id: string
  payment_method_id: string
  player_id?: string
  description?: string
}) {
  const { platformFeeCents, stringerEarningsCents } = calculatePaymentBreakdown(params.amount_cents)

  // Create and confirm payment intent in one step
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount_cents,
    currency: 'usd',
    payment_method: params.payment_method_id,
    confirm: true,
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: params.stringer_account_id,
    },
    capture_method: 'manual', // Hold the payment, don't capture yet
    description: params.description || `Stringing service for request ${params.request_id}`,
    metadata: {
      request_id: params.request_id,
      player_id: params.player_id || '',
      platform_fee_cents: platformFeeCents.toString(),
      stringer_earnings_cents: stringerEarningsCents.toString(),
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/request/${params.request_id}`,
  })

  return {
    payment_intent_id: paymentIntent.id,
    status: paymentIntent.status,
    platform_fee_cents: platformFeeCents,
    stringer_earnings_cents: stringerEarningsCents,
  }
}

/**
 * Capture a previously authorized payment intent
 * This happens when the player approves the completed work
 */
export async function capturePaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId)
  return paymentIntent
}

/**
 * Alias for capturePaymentIntent (for backward compatibility)
 */
export async function capturePayment(paymentIntentId: string) {
  return capturePaymentIntent(paymentIntentId)
}

/**
 * Cancel a payment intent (refund the hold)
 * This happens if the job is cancelled
 */
export async function cancelPaymentIntent(paymentIntentId: string, reason?: string) {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: reason as any,
  })
  return paymentIntent
}

/**
 * Create a refund for a captured payment
 */
export async function createRefund(paymentIntentId: string, amountCents?: number, reason?: string) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents, // Partial refund if specified, otherwise full refund
    reason: reason as any,
  })
  return refund
}
