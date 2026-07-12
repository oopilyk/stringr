# Payments

This document consolidates and supersedes `PAYMENT_FEATURES.md`, `STRIPE_PAYMENT_INTEGRATION.md`, `STRIPE_PAYMENT_TESTING.md`, and `STRIPE_TESTING_GUIDE.md`. Where those docs disagreed (mainly on the fee model), this document uses what's actually in the code as of this writing, verified against `apps/web/lib/stripe/server.ts` and the `.env*` files.

## Architecture: escrow via Stripe Connect

Stringerly uses **Stripe Connect** with manual-capture Payment Intents to hold funds in escrow between payment authorization and job completion:

```
1. Player creates request              → status: pending
2. Stringer accepts with a quote       → status: accepted
3. Player authorizes payment           → status: in_progress   (card authorized, NOT captured — held)
4. Stringer completes work             → status: ready         (payment still held)
5. Player approves pickup              → status: completed     (payment CAPTURED, transferred)
```

The player's card is authorized (not charged) at step 3 via a Payment Intent with `capture_method: 'manual'`. Funds only move at step 5, when the platform captures the intent and Stripe transfers the stringer's share to their Connected Account.

If a request is cancelled before capture, the authorization hold is released (`cancelPaymentIntent`) and the card is never charged. If cancelled after capture, a full refund is issued (`createRefund`).

## Fee model — CURRENT (two separate fees)

**Verified in `apps/web/lib/stripe/server.ts`:**

```typescript
export const STRINGER_FEE_PERCENT = parseInt(process.env.STRIPE_STRINGER_FEE_PERCENT || '12', 10)
export const PLAYER_APP_TAX_PERCENT = parseInt(process.env.STRIPE_PLAYER_APP_TAX_PERCENT || '5', 10)
```

There are **two separate fee variables**, both currently wired up and used:

| Variable | Default | Who pays it | Effect |
|----------|---------|--------------|--------|
| `STRIPE_STRINGER_FEE_PERCENT` | 12% | Stringer | Deducted from the stringer's payout |
| `STRIPE_PLAYER_APP_TAX_PERCENT` | 5% | Player | Added on top of the stringer's quoted price |

**Example ($25 quoted job):**

| Line item | Amount |
|-----------|--------|
| Stringer's quoted price | $25.00 |
| Player app tax (+5%) | +$1.25 |
| **Player is charged** | **$26.25** |
| Stringer fee (−12% of $25) | −$3.00 |
| **Stringer receives** | **$22.00** |
| Platform revenue (tax + fee) | $4.25 |

This **supersedes the older single `STRIPE_PLATFORM_FEE_PERCENT` (12%) model** that `README.md` and some of the older payment docs (`PAYMENT_FEATURES.md`, `STRIPE_PAYMENT_INTEGRATION.md`, `STRIPE_PAYMENT_TESTING.md`, `STRIPE_TESTING_GUIDE.md`) describe, where the platform only took a flat 12% from the stringer and the player paid exactly the quoted price. That older single-fee model is **not what the code does today** — do not treat it as current.

### Fee calculation reference table (from the two-fee model)

| Quoted price | Player pays | Stringer receives | Platform revenue |
|-------------|-------------|--------------------|--------------------|
| $1.00 | $1.05 | $0.88 | $0.17 |
| $10.00 | $10.50 | $8.80 | $1.70 |
| $25.00 | $26.25 | $22.00 | $4.25 |
| $100.00 | $105.00 | $88.00 | $17.00 |

Stripe's own processing fee (~2.9% + $0.30) is deducted from the platform/stringer side by Stripe and is separate from the app's own fee variables above.

## Environment variables

```bash
# Stripe API keys (test mode locally: sk_test_/pk_test_, live in production: sk_live_/pk_live_)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Fee structure — current two-fee model
STRIPE_STRINGER_FEE_PERCENT=12   # taken from stringer's quoted price
STRIPE_PLAYER_APP_TAX_PERCENT=5  # added to player's total
```

## Webhook endpoint

**The real, current route is `/api/stripe/webhooks`** — file: `apps/web/app/api/stripe/webhooks/route.ts`. (`TESTING_PLAN.md` previously had this reversed as `/api/webhooks/stripe`; that was stale and has been corrected here and in the setup steps below.)

Local forwarding:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```
Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

Production: add an endpoint in the Stripe Dashboard pointing at `https://<your-domain>/api/stripe/webhooks`.

### Events handled

Verified by grep of the webhook route's `switch` statement — these `case` branches exist and are implemented:

- `payment_intent.succeeded` — marks `payment_status: 'succeeded'`
- `payment_intent.payment_failed` — reverts request to `accepted`, clears `payment_intent_id`, stores failure reason
- `payment_intent.canceled` — marks `payment_status: 'cancelled'`
- `charge.refunded` — marks `payment_status: 'refunded'`, records refund amount/timestamp
- `charge.dispute.created` — marks `payment_status: 'disputed'`, records dispute id/reason
- `charge.dispute.closed` — updates dispute outcome (won/lost)
- `account.updated` — syncs a stringer's Connect account status (`stripe_charges_enabled`, `stripe_payouts_enabled`, onboarding completion)

All webhook handling requires the `stripe-signature` header and passes through `stripe.webhooks.constructEvent()` — unsigned/invalid requests are rejected before any handler runs (see `docs/SECURITY.md`).

### Rate limiting note

Per `docs/SECURITY.md`, the webhook route is one of the 10 routes covered by rate limiting (100 req/min, IP-based). However, `/api/stripe/authorize-payment` and `/api/stripe/capture-payment` — direct money-movement endpoints — are **not** currently rate limited. Treat this as an open gap, not a solved problem.

## Local testing

### Prerequisites
- Stripe account (free, test mode) — https://dashboard.stripe.com
- Stripe CLI: `brew install stripe/stripe-cli/stripe`, then `stripe login`
- Supabase running locally (`supabase start`)

### Steps

1. **Get test API keys**: Stripe Dashboard (test mode) → Developers → API keys. Copy `pk_test_...` and `sk_test_...` into `apps/web/.env.local`.
2. **Start webhook forwarding** (separate terminal, keep running):
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhooks
   ```
   Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
3. **Start the app**: `supabase start`, then `cd apps/web && npm run dev` (see `README.md` for the full three-terminal flow).
4. **Connect a demo stringer to Stripe**: sign in as one of the seeded stringers (see `docs/TESTING.md` for the current account list), go to Settings → "Connect Bank Account", complete Express onboarding with Stripe's test values:

   | Field | Test value |
   |-------|------------|
   | Phone | any 10-digit number |
   | SSN last 4 | `0000` |
   | Routing number | `110000000` |
   | Account number | `000123456789` |

   Note: the seed data (`supabase/seed.ts`) also pre-populates **mock** `stripe_account_id` values (`acct_test_XXXXXXXX`) for demo stringers so the UI shows "connected" without onboarding. These mock IDs are **not real Stripe accounts** — payment authorization calls against them will fail at the Stripe API. To exercise a real end-to-end payment, connect at least one stringer through the real Express onboarding flow above.
5. **Run through the flow** as player and stringer (create → accept/quote → authorize payment → complete tasks → approve/capture) using test card `4242 4242 4242 4242`, any future expiry, any CVC.
6. **Verify in Stripe Dashboard** (test mode): Payments should show "Uncaptured" after authorization, then "Succeeded" after capture, with the application fee and transfer amounts matching the two-fee model above.

### Test cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 0002` | Generic decline |
| `4000 0000 0000 9995` | Insufficient funds |

### Test bank accounts (Connect onboarding)

| Routing | Account | Result |
|---------|---------|--------|
| `110000000` | `000123456789` | Success |
| `110000000` | `000111111116` | Account closed |
| `110000000` | `000111111113` | Insufficient funds |

## Going live — checklist status

None of the following have been done yet; treat this as a to-do list, not a record of completed work:

- [ ] Complete Stripe account verification (business info, bank account, Connected Account Agreement)
- [ ] Switch to live API keys (`sk_live_...`, `pk_live_...`) in production environment
- [ ] Configure production webhook endpoint (`https://<domain>/api/stripe/webhooks`) and its own `STRIPE_WEBHOOK_SECRET`
- [ ] All stringers must re-onboard with real bank accounts — test-mode Connect accounts do not carry over
- [ ] Terms of Service / Privacy Policy covering the current two-fee model and payment data handling
- [ ] Rate-limit the two currently-unprotected payment endpoints (`/api/stripe/authorize-payment`, `/api/stripe/capture-payment`) — see `docs/SECURITY.md`
- [ ] Set up monitoring/alerting for failed payments and webhook signature failures (currently none)

## Database fields (requests table, payment-related)

```sql
payment_intent_id          TEXT
payment_authorized_at      TIMESTAMPTZ
payment_captured_at        TIMESTAMPTZ
payment_status             TEXT   -- pending, succeeded, failed, cancelled, refunded, disputed, lost
payment_failure_reason     TEXT
platform_fee_cents         INTEGER
stringer_earnings_cents    INTEGER
refunded_at                TIMESTAMPTZ
refund_amount_cents        INTEGER
dispute_id                 TEXT
dispute_reason             TEXT
dispute_status             TEXT
cancellation_reason        TEXT
cancelled_at                TIMESTAMPTZ
```

`stringer_settings` table:
```sql
stripe_account_id              TEXT
stripe_onboarding_completed    BOOLEAN
stripe_charges_enabled         BOOLEAN
stripe_payouts_enabled         BOOLEAN
```

## Key files

| File | Purpose |
|------|---------|
| `apps/web/lib/stripe/server.ts` | Fee constants, server-side Stripe client, PaymentIntent/refund helpers |
| `apps/web/lib/stripe/client.ts` | Client-side Stripe.js helpers |
| `apps/web/app/api/stripe/` | Stripe API routes (connect-account, authorize-payment, capture-payment, refresh-onboarding, webhooks) |
| `apps/web/app/api/requests/[id]/authorize-payment/route.ts` | Player-facing payment authorization (rate-limited, validated) |
| `apps/web/app/api/requests/[id]/cancel/route.ts` | Cancellation with refund/authorization-release logic |
| `apps/web/components/stripe/` | Payment UI (`<PaymentAuthorizationModal />`, `<EarningsBreakdown />`, etc.) |
