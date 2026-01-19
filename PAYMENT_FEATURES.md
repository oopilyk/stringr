# Payment, Refund & Webhook Features

This document describes the payment integration, refund flow, and webhook handling implemented in Stringerly.

## Overview

Stringerly uses **Stripe Connect** with destination charges to handle payments between players and stringers. The platform:
- Takes a **12% platform fee** on all transactions
- Uses **escrow payments** (manual capture) to protect both parties
- Automatically handles **refunds** when jobs are cancelled
- Processes **webhooks** for payment events, disputes, and account updates

---

## Payment Flow

### 1. Player Requests Stringing Service
- Player creates a request with racket photo and specifications
- Request is sent to selected stringer with status `pending`

### 2. Stringer Accepts with Quote
- Stringer reviews request and provides a final quote
- Request status changes to `accepted`
- Player is prompted to authorize payment

### 3. Payment Authorization (Escrow Hold)
- Player enters card details and authorizes payment
- Payment is **authorized but not captured** (held in escrow)
- Platform fee (12%) is calculated automatically
- Request status changes to `in_progress`
- Work tracking begins

**Database Updates:**
```sql
payment_intent_id: 'pi_xxx...'
payment_authorized_at: NOW()
platform_fee_cents: 240  (for $20 job)
stringer_earnings_cents: 1760
status: 'in_progress'
```

### 4. Stringer Completes Work
- Stringer marks job as complete with photo
- Request status changes to `ready_for_pickup`

### 5. Player Approves & Payment Captured
- Player confirms work is satisfactory
- Payment is **captured** and transferred to stringer
- Platform fee is automatically deducted
- Request status changes to `completed`

**Database Updates:**
```sql
payment_captured_at: NOW()
status: 'completed'
```

---

## Refund Flow

### When Refunds Occur

Jobs can be cancelled by either player or stringer when in these statuses:
- `pending` - Before acceptance
- `accepted` - After acceptance but before payment
- `in_progress` - After payment authorization

### Cancellation Process

1. **User Initiates Cancellation**
   - Clicks "Cancel Request" button
   - Selects cancellation reason from dropdown
   - Confirms cancellation

2. **Backend Processing** (`/api/requests/[id]/cancel`)
   - Verifies user has permission to cancel
   - Checks if payment exists

3. **Payment Handling**
   - **If payment was authorized but not captured:**
     - Calls `cancelPaymentIntent()`
     - Authorization hold is released immediately
     - Player's card is never charged

   - **If payment was already captured:**
     - Calls `createRefund()`
     - Full refund is processed
     - Refund appears on player's card in 5-10 business days

4. **Database Updates**
   ```sql
   status: 'cancelled'
   cancellation_reason: 'Player changed mind'
   cancelled_at: NOW()
   payment_status: 'refunded' OR 'cancelled'
   refunded_at: NOW() (if refund was created)
   refund_amount_cents: 2000
   ```

### API Endpoint

**POST** `/api/requests/[id]/cancel`

**Request Body:**
```json
{
  "reason": "Changed my mind",
  "cancellation_reason": "requested_by_customer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request cancelled successfully",
  "refunded": true,
  "refund_id": "re_xxx..."
}
```

---

## Stripe Webhooks

### Webhook Endpoint

**POST** `/api/stripe/webhooks`

This endpoint receives events from Stripe and updates the database accordingly.

### Webhook Configuration

1. **Get Webhook Secret:**
   ```bash
   # For local testing with Stripe CLI
   stripe listen --forward-to localhost:3000/api/stripe/webhooks

   # Copy the webhook signing secret
   # Add to .env.local:
   STRIPE_WEBHOOK_SECRET=whsec_xxx...
   ```

2. **Production Setup:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhooks`
   - Select events to listen for (see below)
   - Copy webhook signing secret to production environment

### Handled Events

#### 1. `payment_intent.succeeded`
Payment was successfully authorized/captured.

**Action:** Updates `payment_status` to `succeeded`

#### 2. `payment_intent.payment_failed`
Payment authorization failed (insufficient funds, card declined, etc.)

**Action:**
- Updates `payment_status` to `failed`
- Stores failure reason in `payment_failure_reason`
- Reverts request status to `accepted` so player can try again
- Clears `payment_intent_id` so new payment can be attempted

**Database Update:**
```sql
payment_status: 'failed'
payment_failure_reason: 'Your card has insufficient funds'
status: 'accepted'
payment_intent_id: NULL
payment_authorized_at: NULL
```

#### 3. `payment_intent.canceled`
Payment authorization was cancelled.

**Action:** Updates `payment_status` to `cancelled`

#### 4. `charge.refunded`
A charge was refunded (full or partial).

**Action:**
- Updates `payment_status` to `refunded`
- Records `refunded_at` timestamp
- Stores `refund_amount_cents`

**Database Update:**
```sql
payment_status: 'refunded'
refunded_at: NOW()
refund_amount_cents: 2000
```

#### 5. `charge.dispute.created`
Player disputed the charge (chargeback).

**Action:**
- Updates `payment_status` to `disputed`
- Records dispute details
- **TODO:** Send notification to admin/stringer

**Database Update:**
```sql
payment_status: 'disputed'
dispute_id: 'dp_xxx...'
dispute_reason: 'fraudulent'
dispute_status: 'needs_response'
```

#### 6. `charge.dispute.closed`
Dispute was resolved (won or lost).

**Action:**
- Updates `dispute_status`
- Sets `payment_status` based on outcome (won → succeeded, lost → lost)

**Database Update:**
```sql
dispute_status: 'won'
payment_status: 'succeeded'
```

#### 7. `account.updated`
A connected account (stringer) was updated.

**Action:**
- Updates stringer's Stripe account status
- Records onboarding completion
- Updates charges/payouts enabled status

**Database Update:**
```sql
stripe_charges_enabled: true
stripe_payouts_enabled: true
stripe_onboarding_completed: true
```

### Webhook Security

All webhooks are verified using Stripe's signature verification:

```typescript
const signature = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
)
```

**Never process webhooks without signature verification!**

---

## Database Schema

### New Fields on `requests` Table

```sql
-- Payment tracking
payment_status TEXT DEFAULT 'pending'
  -- Values: pending, succeeded, failed, cancelled, refunded, disputed, lost

payment_failure_reason TEXT
  -- Error message if payment failed

-- Refund tracking
refunded_at TIMESTAMP WITH TIME ZONE
refund_amount_cents INTEGER

-- Dispute tracking
dispute_id TEXT
dispute_reason TEXT
dispute_status TEXT
  -- Values: warning_needs_response, warning_under_review, warning_closed,
  --         needs_response, under_review, won, lost

-- Cancellation tracking
cancellation_reason TEXT
cancelled_at TIMESTAMP WITH TIME ZONE
```

### Indices

```sql
CREATE INDEX idx_requests_payment_status ON requests(payment_status);
CREATE INDEX idx_requests_dispute_id ON requests(dispute_id);
CREATE INDEX idx_requests_cancelled_at ON requests(cancelled_at);
```

---

## Environment Variables

Add these to your `.env.local` and production environment:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx...
STRIPE_WEBHOOK_SECRET=whsec_xxx...
STRIPE_PLATFORM_FEE_PERCENT=12

# Supabase Service Role Key (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---

## Testing

### Test Cards

Use these cards in test mode:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
```

### Testing Refunds

1. Create a request and complete the full payment flow
2. Cancel the request before completion
3. Check Stripe Dashboard → Payments → Refunds

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

### Testing Payment Failures

1. Go to payment authorization screen
2. Use test card `4000 0000 0000 0002` (generic decline)
3. Verify request status reverts to `accepted`
4. Verify player can retry payment

### Testing Disputes

```bash
# Create a dispute in Stripe Dashboard
stripe disputes create --charge ch_xxx --reason fraudulent

# Or trigger via CLI
stripe trigger charge.dispute.created
```

---

## UI Components

### Cancel Request Modal

**Location:** `/components/requests/cancel-request-modal.tsx`

**Features:**
- Dropdown with cancellation reasons (different for player vs stringer)
- Custom reason input for "Other"
- Shows refund information if payment exists
- Explains difference between authorization hold vs captured payment

**Props:**
```typescript
interface CancelRequestModalProps {
  request: {
    id: string
    status: string
    final_price_cents?: number
    estimated_price_cents?: number
    payment_intent_id?: string
    payment_captured_at?: string
  }
  userRole: 'player' | 'stringer'
  onCancel: () => void
}
```

### Request Details Page Integration

Cancel button appears in the sidebar for:
- Players: On all active requests (pending, accepted, in_progress)
- Stringers: On pending requests ("Decline Request") and active requests ("Cancel Request")

---

## API Reference

### Cancel Request

**POST** `/api/requests/[id]/cancel`

**Auth:** Required (must be player or stringer)

**Body:**
```typescript
{
  reason: string           // User-provided reason
  cancellation_reason: string  // Structured reason for Stripe
}
```

**Response:**
```typescript
{
  success: boolean
  message: string
  refunded: boolean
  refund_id?: string
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Not your request
- `404` - Request not found
- `400` - Cannot cancel request in this status
- `500` - Refund/cancellation failed

### Webhook Handler

**POST** `/api/stripe/webhooks`

**Headers:**
- `stripe-signature` - Required for verification

**Body:** Raw Stripe event payload

**Response:**
```typescript
{
  received: true
}
```

---

## Security Considerations

1. **Webhook Signature Verification**
   - Always verify webhook signatures
   - Never trust unverified webhook data
   - Use `stripe.webhooks.constructEvent()`

2. **Authorization Checks**
   - Verify user owns the request before cancellation
   - Check request status before allowing cancellation
   - Use Supabase RLS for data access control

3. **Idempotency**
   - Webhooks may be sent multiple times
   - Check if payment already processed before updating
   - Use `payment_intent_id` as idempotency key

4. **Service Role Key**
   - Webhook handler uses service role key to bypass RLS
   - **Never** expose service role key to client
   - Store securely in environment variables

---

## Troubleshooting

### Webhook not receiving events

1. Check webhook secret is correct:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```

2. Verify endpoint is accessible:
   ```bash
   curl -X POST https://yourdomain.com/api/stripe/webhooks
   ```

3. Check Stripe Dashboard → Developers → Webhooks → Recent deliveries

### Refund failed

1. Check payment was actually captured:
   ```sql
   SELECT payment_intent_id, payment_captured_at
   FROM requests
   WHERE id = 'xxx';
   ```

2. Verify payment intent exists in Stripe:
   ```bash
   stripe payment_intents retrieve pi_xxx
   ```

3. Check Stripe account balance (can't refund more than available)

### Payment status not updating

1. Verify webhook is configured correctly
2. Check webhook logs in Stripe Dashboard
3. Check application logs for errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

---

## Future Improvements

- [ ] Send email notifications when payments fail
- [ ] Add admin dashboard for dispute management
- [ ] Implement partial refunds (e.g., cancellation fees)
- [ ] Add dispute evidence submission UI
- [ ] Support for multiple payment methods
- [ ] Webhook retry logic with exponential backoff
- [ ] Analytics dashboard for payment metrics

---

## Related Files

**API Routes:**
- `/apps/web/app/api/requests/[id]/cancel/route.ts` - Cancellation endpoint
- `/apps/web/app/api/stripe/webhooks/route.ts` - Webhook handler
- `/apps/web/app/api/requests/[id]/authorize-payment/route.ts` - Payment authorization

**Components:**
- `/apps/web/components/requests/cancel-request-modal.tsx` - Cancellation UI
- `/apps/web/components/requests/authorize-payment-modal.tsx` - Payment UI

**Stripe Integration:**
- `/apps/web/lib/stripe/server.ts` - Server-side Stripe functions

**Database:**
- `/supabase/migrations/20250204000001_add_stripe_payment_fields.sql` - Initial payment fields
- `/supabase/migrations/20250208000002_add_payment_tracking_fields.sql` - Refund/dispute fields

---

## Support

For issues or questions:
- Check Stripe Dashboard for payment/webhook logs
- Review application logs for errors
- Consult Stripe documentation: https://stripe.com/docs
- Review this documentation
