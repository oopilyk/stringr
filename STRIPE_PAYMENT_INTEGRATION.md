# Stripe Payment Integration Guide

## Overview

Stringerly uses Stripe for secure payment processing with an escrow-style hold and capture system. This ensures both players and stringers are protected throughout the stringing workflow.

## Business Model

- **Platform Fee**: 12% of each completed job
- **Example**: $25 job → $3 platform fee → $22 to stringer (before Stripe fees)
- **Stripe Fees**: ~2.9% + $0.30 per transaction (deducted from stringer earnings)

## Payment Flow

### 1. Player Creates Request
- Player finds a stringer and creates a stringing request
- System calculates quoted price based on stringer's rates
- No payment required at this stage

### 2. Stringer Accepts Job
- Stringer reviews and accepts the request
- Status changes from `pending` → `accepted`
- System initializes stringing tasks

### 3. Payment Authorization (Hold)
- Player is prompted to authorize payment
- Stripe creates a Payment Intent with `capture_method: 'manual'`
- Card is authorized for the full amount but **NOT charged**
- Platform fee is calculated: 12% of quoted price
- Database updated with:
  - `payment_intent_id`
  - `payment_authorized_at`
  - `platform_fee_cents`
  - `stringer_earnings_cents`
- Stringer can now safely begin work

### 4. Stringer Completes Work
- Stringer marks tasks complete through workflow system
- Uploads completion photo
- Marks request as `ready` (ready for pickup)
- Payment still on hold - not captured yet

### 5. Player Approves & Payment Capture
- Player picks up racket and reviews work
- Player clicks "Approve & Pay"
- System captures the held payment
- Money is transferred:
  - 88% to stringer's connected account
  - 12% to Stringerly platform account
- Database updated with:
  - `payment_captured_at`
  - `payment_status: 'paid'`
  - `status: 'completed'`
- Stringer receives funds in 2-3 business days

## API Routes

### Stripe Connect (Stringer Onboarding)

#### `POST /api/stripe/connect-account`
Creates a Stripe Connected Account for stringers to receive payments.

**Request**: None (uses authenticated user)
**Response**:
```json
{
  "accountId": "acct_xxx",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

#### `GET /api/stripe/connect-account`
Gets stringer's current Stripe account status.

**Response**:
```json
{
  "connected": true,
  "accountId": "acct_xxx",
  "onboardingCompleted": true,
  "chargesEnabled": true,
  "payoutsEnabled": true
}
```

#### `POST /api/stripe/refresh-onboarding`
Refreshes onboarding link if incomplete or checks completion status.

**Response**:
```json
{
  "onboardingUrl": "https://connect.stripe.com/setup/...",
  "completed": false
}
```

### Payment Authorization

#### `POST /api/stripe/authorize-payment`
Creates a payment intent and authorizes (holds) funds when player confirms payment.

**Request**:
```json
{
  "requestId": "uuid"
}
```

**Response**:
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 2500,
  "platformFee": 300,
  "stringerEarnings": 2200
}
```

**Validation**:
- User must be the player on the request
- Request status must be `accepted`
- Stringer must have completed Stripe onboarding
- Payment not already authorized

### Payment Capture

#### `POST /api/stripe/capture-payment`
Captures previously authorized payment when player approves completed work.

**Request**:
```json
{
  "requestId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "amount": 2500,
  "status": "succeeded"
}
```

**Validation**:
- User must be the player on the request
- Request status must be `ready`
- Payment must be authorized but not already captured

## React Components

### For Stringers

#### `<ConnectOnboarding />`
Shows Stripe Connect onboarding status and button.
- **Location**: Settings page
- **Props**: `userId`
- **States**:
  - Not connected: Shows "Connect Bank Account" button
  - Onboarding incomplete: Shows "Complete Setup" button
  - Fully connected: Shows success message with status badges

#### `<EarningsBreakdown />`
Displays payment breakdown for a job.
- **Location**: Job cards, dashboard
- **Props**: Job pricing and payment status
- **Shows**:
  - Job price
  - Platform fee (12%)
  - Stringer earnings
  - Estimated Stripe fees
  - Net to bank account
  - Payment status badge
  - Payment dates

### For Players

#### `<PaymentRequiredBanner />`
Prompts player to authorize payment after stringer accepts.
- **Location**: Request details page, dashboard
- **Props**: `requestId`, `quotedPriceCents`, `stringerName`
- **Triggers**: `PaymentAuthorizationModal`

#### `<PaymentAuthorizationModal />`
Modal with Stripe payment form for authorizing (holding) payment.
- **Features**:
  - Stripe Elements for card input
  - Price breakdown display
  - Explanation of hold vs. charge
  - Error handling
  - Success callback

#### `<ApproveAndPay />`
Component for approving completed work and capturing payment.
- **Location**: Request details when status is `ready`
- **Features**:
  - Completion photo display
  - Payment amount
  - "Approve & Pay" button
  - "Report Issue" option
  - Calls capture API

## Database Schema

### New Fields in `requests` table:
```sql
payment_intent_id TEXT                    -- Stripe Payment Intent ID
payment_authorized_at TIMESTAMP           -- When payment was authorized (held)
payment_captured_at TIMESTAMP             -- When payment was captured
platform_fee_cents INTEGER DEFAULT 0      -- Stringerly's 12% fee
stringer_earnings_cents INTEGER DEFAULT 0 -- What stringer receives
```

### New Fields in `stringer_settings` table:
```sql
stripe_account_id TEXT                    -- Stripe Connected Account ID
stripe_onboarding_completed BOOLEAN       -- Onboarding status
stripe_charges_enabled BOOLEAN            -- Can receive charges
stripe_payouts_enabled BOOLEAN            -- Can receive payouts
```

## Testing in Stripe Test Mode

### Test Credit Cards
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC (e.g., `123`)

### Test Bank Accounts (for Stringer Connect)
- Routing number: `110000000`
- Account number: `000123456789`
- Any fake SSN/Tax ID

### Viewing Test Data
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)
2. Navigate to:
   - **Payments** → See payment intents (authorized and captured)
   - **Connect** → See connected accounts (stringers)
   - **Transfers** → See money transferred to stringers

## Environment Variables

```env
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Platform Settings
STRIPE_PLATFORM_FEE_PERCENT=12
```

## Going Live

### Before Launching:
1. **Complete Stripe Account Verification**
   - Provide business information
   - Verify bank account
   - Accept Stripe Connected Account Agreement

2. **Switch to Live Mode**
   - Get live API keys from Stripe Dashboard
   - Update environment variables
   - Test with small real transactions first

3. **Stringer Re-onboarding**
   - All stringers must reconnect with real bank accounts
   - Test mode accounts won't work in live mode

4. **Legal & Compliance**
   - Terms of Service mentioning 12% platform fee
   - Privacy policy covering payment data
   - Refund/dispute policy

## Error Handling

### Common Errors:

**"Stringer has not connected their bank account"**
- Stringer needs to complete Stripe Connect onboarding
- Guide them to Settings → Connect Bank Account

**"Payment authorization failed"**
- Card declined or insufficient funds
- Player needs to try different payment method
- Check Stripe Dashboard for specific decline reason

**"Payment capture failed"**
- Payment intent may have expired (7 days)
- Contact Stripe support if persistent

**"Invalid state transition"**
- Request not in correct status for payment operation
- Ensure workflow follows: pending → accepted → (authorize) → ready → (capture) → completed

## Support & Monitoring

### Monitor These Metrics:
- Payment authorization success rate
- Payment capture success rate
- Average time from authorization to capture
- Stringer onboarding completion rate
- Failed payment attempts

### Stripe Webhooks (Future Enhancement):
Consider adding webhooks for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated` (for Connect account status)
- `transfer.created` (when money moves to stringers)

## Security Notes

- ✅ Stripe secret key is server-side only (never exposed to client)
- ✅ Payment intents use client secrets (secure, one-time use)
- ✅ All payment operations validate user permissions
- ✅ Platform fee calculated server-side (can't be manipulated)
- ✅ Stripe handles PCI compliance for card data

## Next Steps

1. **Add Stripe Connect to Stringer Settings Page**
   - Import and use `<ConnectOnboarding />` component

2. **Update Player Request UI**
   - Show `<PaymentRequiredBanner />` when status is `accepted` and payment not authorized
   - Show `<ApproveAndPay />` when status is `ready`

3. **Update Stringer Dashboard**
   - Show `<EarningsBreakdown />` in job cards
   - Add total earnings summary

4. **Add Notifications**
   - Email when payment authorized
   - Email when payment captured
   - Push notifications for mobile app

5. **Build Admin Dashboard**
   - View all transactions
   - Monitor platform fee revenue
   - Handle disputes and refunds

6. **Implement Webhooks**
   - Real-time payment status updates
   - Automatic status syncing with Stripe events

## Cost Analysis Examples

### Example 1: $25 Job
```
Job Price:           $25.00
Platform Fee (12%):  -$3.00
Stringer Gets:       $22.00
Stripe Fee:          -$1.03 (2.9% + $0.30)
Net to Stringer:     $20.97

Platform Revenue:    $3.00
```

### Example 2: $50 Job (with rush fee)
```
Job Price:           $50.00
Platform Fee (12%):  -$6.00
Stringer Gets:       $44.00
Stripe Fee:          -$1.75 (2.9% + $0.30)
Net to Stringer:     $42.25

Platform Revenue:    $6.00
```

### Example 3: Monthly Active Stringer (20 jobs @ $25 avg)
```
Total Jobs Revenue:  $500.00
Platform Revenue:    $60.00
Stringer Earnings:   $440.00
Stripe Fees:         ~$20.60
Net to Stringer:     ~$419.40
```

---

**Questions or issues?** Check Stripe documentation or contact Stringerly dev team.
