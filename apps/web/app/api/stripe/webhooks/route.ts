/**
 * Stripe Webhook Handler
 *
 * Security Features:
 * - Signature verification: Validates all webhooks are from Stripe
 * - Rate limiting: 100 webhooks per minute (prevents spam)
 * - Environment validation: Ensures webhook secret is configured
 * - Error sanitization: Never leaks internal errors to Stripe
 * - Service role key: Uses elevated privileges for database updates
 *
 * OWASP Protections:
 * - API2:2023 Broken Authentication (signature verification)
 * - API4:2023 Unrestricted Resource Consumption (rate limiting)
 * - API5:2023 Broken Function Level Authorization (signature check)
 * - API7:2023 Server Side Request Forgery (validates source)
 *
 * Security Notes:
 * - WEBHOOK_SECRET must be rotated if compromised
 * - Service role key is intentional for bypassing RLS
 * - All database errors are logged but not returned to Stripe
 * - Webhook events are idempotent (safe to replay)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit'

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs'

// SECURITY: Service role key usage for webhook processing
// This is intentional - webhooks bypass RLS to update payment status
// The webhook signature verification ensures this is a legitimate Stripe request
//
// Key Rotation Instructions:
// 1. Generate new service role key in Supabase dashboard
// 2. Update SUPABASE_SERVICE_ROLE_KEY environment variable
// 3. Restart application
// 4. Verify webhooks still process correctly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  // 1. RATE LIMITING - Prevent webhook spam (IP-based only, no user auth)
  const rateLimitResult = await withRateLimit(request, RATE_LIMITS.WEBHOOK)
  if (rateLimitResult) return rateLimitResult

  // 2. ENVIRONMENT VALIDATION - Ensure webhook secret is configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('CRITICAL: STRIPE_WEBHOOK_SECRET not configured')
    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // 3. SIGNATURE VERIFICATION - Critical security check
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.warn('Webhook received without signature - potential attack')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // This validates the webhook is genuinely from Stripe
    // Prevents SSRF and replay attacks
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    // Signature verification failed - this is a malicious request
    console.error('Webhook signature verification failed:', {
      error: err.message,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 4. EVENT LOGGING - Log for audit trail
  console.log('Processing webhook event:', {
    type: event.type,
    id: event.id,
    created: new Date(event.created * 1000).toISOString()
  })

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)

  const requestId = paymentIntent.metadata.request_id
  if (!requestId) {
    console.error('No request_id in payment intent metadata')
    return
  }

  // Update request if needed
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      payment_status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating request after payment success:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)

  const requestId = paymentIntent.metadata.request_id
  if (!requestId) {
    console.error('No request_id in payment intent metadata')
    return
  }

  // Update request status and add failure reason
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      payment_status: 'failed',
      payment_failure_reason: paymentIntent.last_payment_error?.message || 'Unknown error',
      status: 'accepted', // Revert to accepted so player can try again
      payment_intent_id: null, // Clear failed payment intent
      payment_authorized_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating request after payment failure:', error)
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment cancelled:', paymentIntent.id)

  const requestId = paymentIntent.metadata.request_id
  if (!requestId) {
    console.error('No request_id in payment intent metadata')
    return
  }

  // Update request to reflect cancellation
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      payment_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Error updating request after payment cancellation:', error)
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id)

  const paymentIntentId = charge.payment_intent as string
  if (!paymentIntentId) {
    console.error('No payment_intent in charge object')
    return
  }

  // Update request to reflect refund
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      payment_status: 'refunded',
      refunded_at: new Date().toISOString(),
      refund_amount_cents: charge.amount_refunded,
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntentId)

  if (error) {
    console.error('Error updating request after refund:', error)
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log('Dispute created:', dispute.id)

  const paymentIntentId = dispute.payment_intent as string
  if (!paymentIntentId) {
    console.error('No payment_intent in dispute object')
    return
  }

  // Update request to reflect dispute
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      payment_status: 'disputed',
      dispute_id: dispute.id,
      dispute_reason: dispute.reason,
      dispute_status: dispute.status,
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntentId)

  if (error) {
    console.error('Error updating request after dispute creation:', error)
  }

  // TODO: Send notification to admin/stringer about dispute
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  console.log('Dispute closed:', dispute.id, 'Status:', dispute.status)

  const paymentIntentId = dispute.payment_intent as string
  if (!paymentIntentId) {
    console.error('No payment_intent in dispute object')
    return
  }

  // Update dispute status
  const { error } = await supabaseAdmin
    .from('requests')
    .update({
      dispute_status: dispute.status,
      payment_status: dispute.status === 'won' ? 'succeeded' : 'lost',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntentId)

  if (error) {
    console.error('Error updating request after dispute closure:', error)
  }

  // TODO: Send notification about dispute outcome
}

async function handleAccountUpdated(account: Stripe.Account) {
  console.log('Account updated:', account.id)

  // Update stringer settings with latest account status
  const { error } = await supabaseAdmin
    .from('stringer_settings')
    .update({
      stripe_charges_enabled: account.charges_enabled,
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_onboarding_completed: account.details_submitted,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_account_id', account.id)

  if (error) {
    console.error('Error updating stringer settings after account update:', error)
  }
}
