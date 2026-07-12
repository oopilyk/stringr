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

// Fee percentages
// Stringer fee: percentage taken from stringer's listed price (default 12%)
export const STRINGER_FEE_PERCENT = parseInt(process.env.STRIPE_STRINGER_FEE_PERCENT || '12', 10)
// Player app tax: percentage added to player's total (default 5%)
export const PLAYER_APP_TAX_PERCENT = parseInt(process.env.STRIPE_PLAYER_APP_TAX_PERCENT || '5', 10)

// Legacy export for backward compatibility
export const PLATFORM_FEE_PERCENT = STRINGER_FEE_PERCENT

/**
 * Calculate payment breakdown from stringer's listed price
 *
 * New fee structure:
 * - Stringer lists their price (e.g., $25)
 * - Player pays: Listed price + app tax (e.g., $25 + 5% = $26.25)
 * - Stringer gets: Listed price - stringer fee (e.g., $25 - 12% = $22)
 * - Platform gets: App tax + stringer fee (e.g., $1.25 + $3 = $4.25)
 */
export function calculatePaymentBreakdown(stringerPriceCents: number) {
  // Calculate fees
  const stringerFeeCents = Math.round(stringerPriceCents * (STRINGER_FEE_PERCENT / 100))
  const playerAppTaxCents = Math.round(stringerPriceCents * (PLAYER_APP_TAX_PERCENT / 100))

  // What each party pays/receives
  const playerTotalCents = stringerPriceCents + playerAppTaxCents
  const stringerEarningsCents = stringerPriceCents - stringerFeeCents
  const platformFeeCents = stringerFeeCents + playerAppTaxCents

  return {
    // What stringer listed
    stringerPriceCents,
    // What player pays (stringer price + app tax)
    playerTotalCents,
    // What stringer receives (their price - fee)
    stringerEarningsCents,
    // Total platform revenue (stringer fee + player app tax)
    platformFeeCents,
    // Individual fee components
    stringerFeeCents,
    playerAppTaxCents,
    // Fee percentages
    stringerFeePercent: STRINGER_FEE_PERCENT,
    playerAppTaxPercent: PLAYER_APP_TAX_PERCENT,
    // Legacy field for backward compatibility
    quotedPriceCents: stringerPriceCents,
    platformFeePercent: STRINGER_FEE_PERCENT,
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
 *
 * @param stringerPriceCents - The price the stringer listed (NOT the total player pays)
 */
export async function createPaymentIntent(
  stringerPriceCents: number,
  stringerStripeAccountId: string,
  requestId: string,
  metadata?: Record<string, string>
) {
  const breakdown = calculatePaymentBreakdown(stringerPriceCents)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: breakdown.playerTotalCents, // Player pays stringer price + app tax
    currency: 'usd',
    application_fee_amount: breakdown.platformFeeCents, // Platform keeps stringer fee + app tax
    transfer_data: {
      destination: stringerStripeAccountId,
    },
    capture_method: 'manual', // Important: Hold the payment, don't capture yet
    metadata: {
      request_id: requestId,
      stringer_price_cents: breakdown.stringerPriceCents.toString(),
      player_total_cents: breakdown.playerTotalCents.toString(),
      platform_fee_cents: breakdown.platformFeeCents.toString(),
      stringer_earnings_cents: breakdown.stringerEarningsCents.toString(),
      stringer_fee_cents: breakdown.stringerFeeCents.toString(),
      player_app_tax_cents: breakdown.playerAppTaxCents.toString(),
      ...metadata,
    },
  })

  return paymentIntent
}

/**
 * Authorize payment with a payment method (wrapper for createPaymentIntent + confirm)
 * Used when player authorizes payment for an accepted quote
 *
 * @param stringer_price_cents - The price the stringer listed (NOT the total player pays)
 */
export async function authorizePayment(params: {
  stringer_price_cents: number
  stringer_account_id: string
  request_id: string
  payment_method_id: string
  player_id?: string
  cardholder_name?: string
  description?: string
}) {
  const breakdown = calculatePaymentBreakdown(params.stringer_price_cents)

  // Create and confirm payment intent in one step
  const paymentIntent = await stripe.paymentIntents.create({
    amount: breakdown.playerTotalCents, // Player pays stringer price + app tax
    currency: 'usd',
    payment_method: params.payment_method_id,
    confirm: true,
    application_fee_amount: breakdown.platformFeeCents, // Platform keeps stringer fee + app tax
    transfer_data: {
      destination: params.stringer_account_id,
    },
    capture_method: 'manual', // Hold the payment, don't capture yet
    description: params.description || 'Stringerly - Racket Stringing Service',
    metadata: {
      request_id: params.request_id,
      player_id: params.player_id || '',
      cardholder_name: params.cardholder_name || '',
      stringer_price_cents: breakdown.stringerPriceCents.toString(),
      player_total_cents: breakdown.playerTotalCents.toString(),
      platform_fee_cents: breakdown.platformFeeCents.toString(),
      stringer_earnings_cents: breakdown.stringerEarningsCents.toString(),
      stringer_fee_cents: breakdown.stringerFeeCents.toString(),
      player_app_tax_cents: breakdown.playerAppTaxCents.toString(),
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/request/${params.request_id}`,
  })

  return {
    payment_intent_id: paymentIntent.id,
    status: paymentIntent.status,
    stringer_price_cents: breakdown.stringerPriceCents,
    player_total_cents: breakdown.playerTotalCents,
    platform_fee_cents: breakdown.platformFeeCents,
    stringer_earnings_cents: breakdown.stringerEarningsCents,
    stringer_fee_cents: breakdown.stringerFeeCents,
    player_app_tax_cents: breakdown.playerAppTaxCents,
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
