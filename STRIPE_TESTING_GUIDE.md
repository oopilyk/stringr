# Stripe Payment Testing Guide

This guide explains how to test the Stripe payment integration locally for Stringerly.

---

## Overview

Stringerly uses **Stripe Connect** with **destination charges** to handle payments:

| Role | What Happens |
|------|--------------|
| **Player** | Pays for stringing service |
| **Stripe** | Processes payment, takes ~2.9% + 30¢ |
| **Platform** (Stringerly) | Collects 12% fee |
| **Stringer** | Receives 88% of payment |

### Payment Flow (Escrow)

1. **Authorization** - Player's card is charged but funds are **held** (not transferred)
2. **Work** - Stringer completes the job while payment is held
3. **Capture** - Player approves pickup, funds are **released** to stringer

---

## Prerequisites

- Node.js installed
- Homebrew installed (macOS)
- Stripe account (free at https://stripe.com)
- Supabase running locally

---

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com
2. **Switch to Test Mode** - click toggle in top-right or go to:
   https://dashboard.stripe.com/test/dashboard
3. Go to **Developers → API keys**
4. Copy both keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

---

## Step 2: Install Stripe CLI

Open **any terminal** (global install, any directory):

```bash
brew install stripe/stripe-cli/stripe
```

Login to your Stripe account:

```bash
stripe login
```

This opens a browser to authenticate.

---

## Step 3: Start Webhook Listener

Open a **new terminal** (any directory) and run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

You'll see:
```
> Ready! Your webhook signing secret is whsec_abc123xyz...
```

**Copy that `whsec_...` value** - you'll need it in Step 4.

⚠️ **Keep this terminal running** while testing.

---

## Step 4: Configure Environment Variables

Edit `apps/web/.env.local`:

```env
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Stripe Platform Settings
STRIPE_PLATFORM_FEE_PERCENT=12

# Stripe Webhook Secret (from Step 3)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

---

## Step 5: Start the Application

You need **3 terminals** running:

### Terminal 1: Supabase
```bash
cd /Users/owenakers/Desktop/Stringerly/stringerly
supabase start
```

### Terminal 2: Stripe Webhooks (from Step 3)
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

### Terminal 3: Next.js Dev Server
```bash
cd /Users/owenakers/Desktop/Stringerly/stringerly/apps/web
npm run dev
```

---

## Step 6: Test the Payment Flow

### 6.1: Stringer Completes Stripe Onboarding

1. Go to `http://localhost:3000`
2. Login as a stringer (e.g., `stringer1@test.com` / `password123`)
3. Go to **Settings**
4. Click **"Connect Bank Account"**
5. Complete Stripe onboarding with test data:

| Field | Test Value |
|-------|------------|
| Phone | `0000000000` |
| SSN last 4 | `0000` |
| Routing number | `110000000` |
| Account number | `000123456789` |

6. Return to your app after completing

### 6.2: Player Creates a Request

1. Open **incognito window**
2. Go to `http://localhost:3000`
3. Login as player (e.g., `player1@test.com` / `password123`)
4. Find the stringer and create a request

### 6.3: Stringer Accepts

1. Back in stringer's window → Dashboard
2. Accept the request and set a price (e.g., $25.00)

### 6.4: Player Authorizes Payment

1. Back in player's window → View request
2. Click **"Authorize Payment"**
3. Enter test card:

| Field | Test Value |
|-------|------------|
| Card | `4242 4242 4242 4242` |
| Expiry | `12/28` |
| CVC | `123` |
| ZIP | `12345` |

4. Click **Authorize**

**At this point**: Payment is HELD, not charged.

### 6.5: Stringer Completes Work

1. Complete all tasks
2. Upload completion photo
3. Mark as **Ready for Pickup**

### 6.6: Player Approves & Releases Payment

1. Back in player's window
2. Click **"Approve & Pay"**
3. Payment is captured and transferred to stringer

---

## Step 7: Verify in Stripe Dashboard

### View Payments
https://dashboard.stripe.com/test/payments

Click on the payment to see:
- **Payment amount**: Total charged
- **Stripe processing fee**: ~2.9% + 30¢
- **Collected fee**: Your 12% platform fee
- **Transfer**: Amount sent to stringer

### Example Breakdown ($25 Job)

| Item | Amount |
|------|--------|
| Player charged | $25.00 |
| Stripe fee | -$1.03 |
| Platform fee (12%) | **$3.00** ← Your revenue |
| Stringer receives | $22.00 |

### Other Useful Dashboard Pages

| Page | URL |
|------|-----|
| Payments | https://dashboard.stripe.com/test/payments |
| Connected Accounts | https://dashboard.stripe.com/test/connect/accounts |
| Transfers | https://dashboard.stripe.com/test/connect/transfers |
| Collected Fees | https://dashboard.stripe.com/test/payments (click "Collected fees" tab) |
| API Keys | https://dashboard.stripe.com/test/apikeys |
| Webhooks | https://dashboard.stripe.com/test/webhooks |

---

## Test Card Numbers

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Decline (insufficient funds) |
| `4000 0000 0000 0002` | Decline (generic) |

Full list: https://stripe.com/docs/testing#cards

---

## Test Bank Numbers (Stringer Onboarding)

| Routing | Account | Result |
|---------|---------|--------|
| `110000000` | `000123456789` | Success |
| `110000000` | `000111111116` | Account closed |
| `110000000` | `000111111113` | Insufficient funds |

---

## Useful Stripe CLI Commands

```bash
# List recent payments
stripe payments list --limit 5

# List payment intents
stripe payment_intents list --limit 5

# Trigger test webhook
stripe trigger payment_intent.succeeded

# View event logs
stripe events list --limit 10
```

---

## Troubleshooting

### "Stringer has not connected their bank account"
→ Stringer needs to complete Stripe onboarding in Settings

### "Stringer payment setup is incomplete"
→ Stringer started but didn't finish onboarding. Check Stripe Dashboard → Connected Accounts

### Webhook events not showing
→ Make sure `stripe listen` is running
→ Verify `STRIPE_WEBHOOK_SECRET` matches CLI output
→ Restart Next.js after updating `.env.local`

### Payment modal doesn't appear
→ Check browser console for errors
→ Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set

---

## File Locations

| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Environment variables |
| `apps/web/lib/stripe/server.ts` | Stripe server utilities |
| `apps/web/lib/stripe/client.ts` | Stripe client utilities |
| `apps/web/app/api/stripe/` | API routes |
| `apps/web/components/stripe/` | Payment UI components |

---

## Going to Production

1. Switch to **Live Mode** in Stripe Dashboard
2. Get live API keys (`pk_live_...`, `sk_live_...`)
3. Set up production webhook:
   - URL: `https://yourdomain.com/api/stripe/webhooks`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `charge.refunded`
4. Update production environment variables
5. Test with a real card (small amount)
6. Stringers must reconnect with real bank accounts
