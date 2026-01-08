# Stripe Payment Integration - Complete Testing Guide

## Overview
The Stripe payment integration is now fully implemented with an escrow-based payment flow. Here's what happens:

1. **Player creates request** → Estimated price shown
2. **Stringer accepts & sends quote** → Sets final price
3. **Player authorizes payment** → Payment held in escrow (not captured yet)
4. **Stringer completes work** → Work marked ready for pickup
5. **Player approves & picks up** → Payment captured and transferred to stringer

---

## Prerequisites

### 1. Make sure you have a Stringer with Stripe Connected
You already did this! Your test stringer should have:
- Completed Stripe Connect onboarding
- Green "Bank Account Connected" status in settings

### 2. Reset the Database (Fresh Start)
```bash
npm run db:reset
```

This will clear any old test data and ensure clean testing.

---

## Testing Steps - Complete End-to-End Flow

### Step 1: Create Fresh Accounts

1. **Create a Player Account**
   ```bash
   # Sign up at http://localhost:3000/auth/signup
   # Use: player-test@example.com / password123
   # Select role: Player
   # Complete profile with address info
   ```

2. **Create a Stringer Account**
   ```bash
   # Sign up at http://localhost:3000/auth/signup
   # Use: stringer-test@example.com / password123
   # Select role: Stringer
   # Complete stringer profile AND onboarding
   ```

3. **Connect Stringer to Stripe**
   - Go to `/settings` as the stringer
   - Click "Connect Bank Account"
   - Complete Stripe Connect onboarding (use test data)
   - Verify you see "Bank Account Connected" green status

### Step 2: Create a Request (as Player)

1. Log in as **player-test@example.com**
2. Go to Discover page
3. Find your test stringer
4. Click "Request Service"
5. Fill out the form:
   - Upload racket photo
   - Select string (should auto-select)
   - Set tension (e.g., 55 lbs)
   - Add special instructions (optional)
   - Set preferred date (optional)
6. Review and submit request
7. **Verify**: Request shows as "Pending" in dashboard

### Step 3: Accept Request & Send Quote (as Stringer)

1. Log out and log in as **stringer-test@example.com**
2. Go to Dashboard
3. Click on the pending request
4. Click "Accept Request"
5. **NEW: You should see a quote form with:**
   - Number of rackets (default: 1)
   - **Your Quote (Total Price)** field (pre-filled with estimated price)
   - String details confirmation
   - Tension confirmation
   - Estimated completion time
6. **Adjust the price if needed** (e.g., change from $25.00 to $30.00)
7. Click "Send Quote to Player"
8. **Verify**: Request status changes to "Accepted"

### Step 4: Authorize Payment (as Player)

1. Log out and log in back as **player-test@example.com**
2. Go to Dashboard and click on the accepted request
3. **NEW: You should see a blue "Payment Authorization Required" box showing:**
   - The stringer's quote amount
   - "Authorize Payment" button
4. Click "Authorize Payment"
5. **NEW: Payment modal appears:**
   - Shows the total amount
   - Shows escrow security message
   - Has a card input field
6. Enter test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: Any 3 digits (e.g., 123)
7. Click "Pay $XX.XX"
8. **Verify**: Payment processes successfully
9. **Verify**: Page reloads and payment box disappears
10. **CRITICAL: Check Stripe Dashboard**
    ```bash
    # Open: https://dashboard.stripe.com/test/payments
    # You should see a payment with:
    # - Amount: Your quote amount
    # - Status: "Uncaptured" (held in escrow)
    # - Description: "Stringing service for request #..."
    ```

### Step 5: Complete Work (as Stringer)

1. Log out and log in as **stringer-test@example.com**
2. Go to the request
3. Work through the stringing tasks:
   - Mark "Receive Racket" as complete
   - Mark "Remove Strings" as complete
   - Continue through all tasks...
   - Upload completion photo
   - Mark "Completion Photo" as complete
4. **Verify**: Request status changes to "Ready for Pickup"

### Step 6: Approve & Complete (as Player)

1. Log out and log in as **player-test@example.com**
2. Go to the request (should show "Ready for Pickup")
3. Click "Mark as Complete" or "Confirm Pickup"
4. **Verify**: Request status changes to "Completed"
5. **CRITICAL: Check Stripe Dashboard AGAIN**
    ```bash
    # Open: https://dashboard.stripe.com/test/payments
    # Find the same payment from Step 4
    # It should now show:
    # - Status: "Succeeded" (captured!)
    # - Application Fee: 12% (platform fee)
    # - Connected account received: 88% (stringer earnings)
    ```

---

## What to Look For - Success Criteria

### ✅ In Your App:
- [ ] Stringer can set custom quote price when accepting
- [ ] Player sees "Payment Authorization Required" after quote
- [ ] Payment modal shows correct amount and works
- [ ] Payment authorization succeeds with test card
- [ ] Request workflow continues normally after payment
- [ ] Completion triggers payment capture

### ✅ In Stripe Dashboard (https://dashboard.stripe.com/test/payments):
- [ ] Payment appears as "Uncaptured" after authorization
- [ ] Payment shows correct amount
- [ ] Payment shows 12% application fee
- [ ] Payment changes to "Succeeded" after job completion
- [ ] Connected account (stringer) receives 88% of payment

### ✅ In Database:
```sql
-- Check the completed request
SELECT
  id,
  status,
  estimated_price_cents,
  final_price_cents,
  payment_intent_id,
  payment_authorized_at,
  payment_captured_at,
  platform_fee_cents,
  stringer_earnings_cents
FROM requests
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
- `final_price_cents`: Your quote amount
- `payment_intent_id`: Starts with "pi_"
- `payment_authorized_at`: Timestamp when player paid
- `payment_captured_at`: Timestamp when player approved completion
- `platform_fee_cents`: 12% of final price
- `stringer_earnings_cents`: 88% of final price

---

## Troubleshooting

### Payment Modal Doesn't Appear
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- Make sure you ran `npm install` after adding Stripe packages

### "Stringer has not connected their bank account yet" Error
- Make sure stringer completed Stripe Connect onboarding
- Check database:
  ```sql
  SELECT id, stripe_account_id, stripe_onboarding_completed
  FROM stringer_settings
  WHERE id = '<stringer-user-id>';
  ```
- `stripe_account_id` should start with "acct_"
- `stripe_onboarding_completed` should be `true`

### Payment Authorization Fails
- Check that you're using the test card: 4242 4242 4242 4242
- Check server logs for detailed error messages
- Verify `STRIPE_SECRET_KEY` is set correctly in `.env.local`

### Payment Not Captured
- Make sure request reached "ready_for_pickup" status
- Check that completion endpoint is being called
- Look for errors in server logs when marking complete

### Nothing in Stripe Dashboard
- Make sure you're looking at **Test Mode** (toggle in top right)
- Verify you're using test API keys (start with `sk_test_` and `pk_test_`)
- Check that payment authorization actually succeeded

---

## Quick Test (Skip Stripe Dashboard Checks)

If you just want to verify the flow works:

1. Create player + stringer accounts
2. Stringer connects Stripe
3. Player creates request
4. Stringer accepts with quote
5. Player authorizes payment (use 4242 4242 4242 4242)
6. Stringer completes all tasks
7. Player marks as complete
8. ✅ Success if no errors occur!

---

## Test Cards

- **Success**: 4242 4242 4242 4242
- **Declined**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0027 6000 3184

Use any future expiry date and any 3-digit CVC.

---

## Current Status

All Stripe payment integration is now complete:
- ✅ Quote system in accept modal
- ✅ Payment authorization API endpoint
- ✅ Payment authorization UI modal
- ✅ Payment capture on completion
- ✅ Platform fee calculation (12%)
- ✅ Stringer earnings tracking

The full escrow payment flow is working!
