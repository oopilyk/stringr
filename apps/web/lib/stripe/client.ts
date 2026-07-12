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
 * Calculate payment breakdown for display
 *
 * Fee structure:
 * - Stringer lists their price (e.g., $25)
 * - Player pays: Listed price + app tax (e.g., $25 + 5% = $26.25)
 * - Stringer gets: Listed price - stringer fee (e.g., $25 - 12% = $22)
 * - Platform gets: App tax + stringer fee (e.g., $1.25 + $3 = $4.25)
 */
export function calculatePaymentDisplay(
  stringerPriceCents: number,
  stringerFeePercent: number = 12,
  playerAppTaxPercent: number = 5
) {
  const stringerFeeCents = Math.round(stringerPriceCents * (stringerFeePercent / 100))
  const playerAppTaxCents = Math.round(stringerPriceCents * (playerAppTaxPercent / 100))
  const playerTotalCents = stringerPriceCents + playerAppTaxCents
  const stringerEarningsCents = stringerPriceCents - stringerFeeCents
  const platformFeeCents = stringerFeeCents + playerAppTaxCents

  return {
    // Formatted values
    stringerPrice: formatCurrency(stringerPriceCents),
    playerTotal: formatCurrency(playerTotalCents),
    stringerEarnings: formatCurrency(stringerEarningsCents),
    stringerFee: formatCurrency(stringerFeeCents),
    playerAppTax: formatCurrency(playerAppTaxCents),
    platformFee: formatCurrency(platformFeeCents),
    // Raw cents
    stringerPriceCents,
    playerTotalCents,
    stringerEarningsCents,
    stringerFeeCents,
    playerAppTaxCents,
    platformFeeCents,
    // Percentages
    stringerFeePercent,
    playerAppTaxPercent,
  }
}

/**
 * Legacy: Calculate platform fee display (for backward compatibility)
 * @deprecated Use calculatePaymentDisplay instead
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
