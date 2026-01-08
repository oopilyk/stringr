import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe.js instance
 */
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

/**
 * Format cents to dollar string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Calculate platform fee display
 */
export function calculateFeeDisplay(quotedPriceCents: number, feePercent: number = 12) {
  const platformFeeCents = Math.round(quotedPriceCents * (feePercent / 100))
  const stringerEarningsCents = quotedPriceCents - platformFeeCents

  return {
    total: formatCurrency(quotedPriceCents),
    platformFee: formatCurrency(platformFeeCents),
    stringerEarnings: formatCurrency(stringerEarningsCents),
    feePercent,
  }
}
