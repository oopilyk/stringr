# 🧪 Complete Stripe Payment Testing Guide

This guide walks you through testing the entire payment flow from end to end.

## Prerequisites

### 1. Start Development Environment

```bash
# Terminal 1: Supabase (should already be running)
cd /Users/owenakers/Desktop/Stringr/stringr
npx supabase status  # Verify it's running

# Terminal 2: Next.js Dev Server
cd apps/web
npm run dev
```

**Verify**:
- ✅ Supabase at http://127.0.0.1:54321
- ✅ Next.js at http://localhost:3000
- ✅ No console errors about Stripe keys

---

## Test Flow Overview

```
1. Create Stringer Account → 2. Connect Stripe → 3. Create Player Account →
4. Player Creates Request → 5. Stringer Accepts → 6. Player Authorizes Payment →
7. Stringer Completes Work → 8. Player Approves & Pays → 9. Verify in Stripe Dashboard
```

---

## STEP-BY-STEP TESTING

### **STEP 1: Create Stringer Account**

**Use Browser Session A (or normal browsing mode)**

1. Go to http://localhost:3000/auth/stringer-signup

2. Sign up with:
   ```
   Email: stringer@test.com
   Password: password123
   Name: John Stringer
   Phone: (555) 123-4567
   City: Los Angeles  (or any city)
   ```

3. Complete all 7 onboarding steps:
   - **Step 1**: Credentials ✓ (already filled)
   - **Step 2**: Background
     - Years experience: 5
     - Rackets strung: 500
     - Certifications: Any
     - Location: Home shop
   - **Step 3**: Equipment
     - Machine brand: Gamma
     - Machine model: X-6FC
     - Racket types: Tennis
   - **Step 4**: Pricing
     - Base price: $25
     - Turnaround: 24 hours
     - Rush service: Yes, +$10
   - **Step 5**: String inventory (can skip or add strings)
   - **Step 6**: Availability (set some availability blocks)
   - **Step 7**: Review and submit

4. You should land on the stringer dashboard

**✅ Checkpoint**: Stringer account created and onboarded

---

### **STEP 2: Stringer Connects Stripe Account**

**Still in Browser Session A**

1. Navigate to http://localhost:3000/settings

2. Scroll down to "Payment Settings" section

3. You should see a blue box: "Connect Bank Account"

4. Click **"Connect Bank Account"** button

5. You'll be redirected to a Stripe-hosted onboarding page

6. Fill in the Stripe Connect form with **TEST DATA**:
   ```
   Business type: Individual
   Country: United States

   Personal Information:
   - First name: John
   - Last name: Stringer
   - Date of birth: 01/01/1990
   - SSN: 000-00-0000 (test SSN)
   - Phone: (555) 123-4567

   Bank Account:
   - Routing number: 110000000
   - Account number: 000123456789
   - Account holder name: John Stringer

   Address:
   - Street: 123 Test St
   - City: Los Angeles
   - State: CA
   - ZIP: 90001
   ```

7. Complete the form and submit

8. You should be redirected back to http://localhost:3000/settings?stripe_onboarding=success

9. The "Payment Settings" section should now show a green box: **"Bank Account Connected"** with checkmarks for "Charges enabled" and "Payouts enabled"

**✅ Checkpoint**: Stringer can now receive payments!

---

### **STEP 3: Create Player Account**

**Use Browser Session B (incognito or different browser)**

1. Go to http://localhost:3000/auth/signup

2. Sign up as a player:
   ```
   Email: player@test.com
   Password: password123
   Name: Sarah Player
   ```

3. Complete any required profile steps

4. You should land on the Discover page

**✅ Checkpoint**: Player account created

---

### **STEP 4: Player Creates Stringing Request**

**Still in Browser Session B (Player)**

1. On the Discover page, find "John Stringer" (the stringer you created)

2. Click on their card to view their profile

3. Click **"Request Stringing"** or **"Create Request"** button

4. Fill out the request form:
   ```
   Racket Brand: Wilson
   Racket Model: Blade 98
   String Preference: Luxilon ALU Power
   Tension: 55 lbs
   Notes: Please string ASAP!
   Dropoff Method: Dropoff
   ```

5. Submit the request

6. You should see the request in your Dashboard with status: **"Pending"**

**✅ Checkpoint**: Request created and sent to stringer

---

### **STEP 5: Stringer Accepts the Request**

**Switch to Browser Session A (Stringer)**

1. Navigate to http://localhost:3000/dashboard

2. You should see a notification or pending request from "Sarah Player"

3. Click on the request to view details

4. Click **"Accept Job"** button

5. Confirm any details (string, tension, estimated completion time)

6. Submit acceptance

**✅ Checkpoint**: Job accepted, status changes to "Accepted"

---

### **STEP 6: Player Authorizes Payment (PAYMENT HOLD)**

**Switch to Browser Session B (Player)**

1. Go to your Dashboard: http://localhost:3000/dashboard

2. You should see the request with a **YELLOW BANNER**: "Payment Authorization Required"

3. The banner says: "John Stringer has accepted your stringing request! To confirm the job and allow them to start work, please authorize payment of $25.00."

4. Click **"Authorize Payment - $25.00"** button

5. A modal opens showing:
   - Job Details
   - Job Total: $25.00
   - Platform fee (12%): $3.00
   - John Stringer receives: $22.00
   - Note about authorization vs. charging

6. Fill in the Stripe payment form with **TEST CARD**:
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34 (any future date)
   CVC: 123
   ZIP: 90001
   ```

7. Click **"Authorize Payment"** button

8. You should see a success message and the banner disappears

9. The request status should now show "Payment Authorized - Stringer can begin work"

**✅ Checkpoint**: Payment authorized (held, not charged yet!)

---

### **STEP 7: Verify Payment Hold in Stripe Dashboard**

**Open a new tab** (works with any browser)

1. Go to https://dashboard.stripe.com/test/dashboard

2. Log in to your Stripe account

3. Navigate to **"Payments"** in the left sidebar

4. You should see a payment for **$25.00** with status: **"Authorized"** or **"Requires capture"**

5. Click on it to see details:
   - Amount: $25.00
   - Status: Authorized (not captured)
   - Application fee: $3.00 (12%)
   - Destination account: John Stringer's connected account

**✅ Checkpoint**: Payment is held but NOT yet charged!

---

### **STEP 8: Stringer Completes the Work**

**Switch to Browser Session A (Stringer)**

1. Go to your Dashboard: http://localhost:3000/dashboard

2. Click on Sarah Player's request

3. You should see "Payment secured - $25. Safe to begin work!"

4. Go through the stringing workflow tasks:
   - Click "Start Job"
   - Mark tasks complete one by one:
     - Receive racket ✓
     - Remove strings ✓
     - Inspect frame ✓
     - Mount racket ✓
     - String mains ✓
     - String crosses ✓
     - Tie off ✓
     - Final inspection ✓

5. **Upload Completion Photo**:
   - Click "Upload Photo" for completion photo task
   - Upload any image file

6. Click **"Mark as Ready for Pickup"** button

7. Status changes to **"Ready for Pickup"**

**✅ Checkpoint**: Work complete, racket ready, waiting for player approval

---

### **STEP 9: Player Approves & Captures Payment**

**Switch to Browser Session B (Player)**

1. Go to your Dashboard: http://localhost:3000/dashboard

2. You should see the request with status **"Ready for Pickup"**

3. Click on the request to view details

4. You should see a green box: **"Your Racket is Ready!"**
   - Shows completion photo
   - Shows payment amount: $25.00
   - Has "Approve & Pay $25.00" button

5. Click **"Approve & Pay $25.00"** button

6. System captures the payment (this happens in the background)

7. You should see:
   - Success message: "Payment sent! Enjoy your freshly strung racket."
   - Status changes to **"Completed"**

**✅ Checkpoint**: Payment captured and transferred!

---

### **STEP 10: Verify Payment Capture in Stripe**

**Go back to Stripe Dashboard tab**

1. Refresh https://dashboard.stripe.com/test/dashboard

2. Go to **"Payments"** again

3. The same payment should now show status: **"Succeeded"**

4. Click on it to see:
   - Amount: $25.00
   - Status: Succeeded
   - Application fee collected: $3.00
   - Net to connected account: $22.00 (before Stripe fees)

5. Go to **"Connect" → "Accounts"** in left sidebar

6. Find John Stringer's connected account

7. Click on it and go to **"Payments"** or **"Transfers"** tab

8. You should see the transfer of $22.00 to the connected account

**✅ Checkpoint**: Money has been split correctly!

---

### **STEP 11: Stringer Views Earnings**

**Switch to Browser Session A (Stringer)**

1. Go to Dashboard: http://localhost:3000/dashboard

2. View the completed job

3. You should see an **"Earnings Breakdown"** showing:
   ```
   Job Price:              $25.00
   Platform Fee (12%):     -$3.00
   Your Earnings:          $22.00
   Stripe Processing:      ~$1.03
   Net to Your Bank:       $20.97

   Status: Paid ✓
   Paid: Jan 4, 2026 at 2:30 PM
   Funds will be transferred to your bank account within 2-3 business days.
   ```

**✅ Checkpoint**: Stringer can see their earnings!

---

## Payment Flow Summary

| Step | Status | Payment Status | Money Location |
|------|--------|----------------|----------------|
| 1. Request created | `pending` | `unpaid` | No money involved |
| 2. Stringer accepts | `accepted` | `unpaid` | No money involved |
| 3. Player authorizes | `accepted` | `authorized` | **Held on player's card** |
| 4. Stringer completes | `ready` | `authorized` | Still held on card |
| 5. Player approves | `completed` | `paid` | **Charged & transferred** |

---

## What to Look For

### ✅ Success Indicators:

1. **Stringer Settings Page**:
   - Green "Bank Account Connected" badge
   - "Charges enabled" ✓
   - "Payouts enabled" ✓

2. **After Payment Authorization**:
   - Player sees "Payment Authorized" status
   - Stringer sees "Payment secured - safe to begin work"
   - Stripe Dashboard shows "Authorized" payment

3. **After Payment Capture**:
   - Player sees "Completed" status
   - Stringer sees "Paid" status with earnings breakdown
   - Stripe Dashboard shows "Succeeded" payment
   - Transfer visible in connected account

### ❌ Common Issues & Fixes:

**"Stringer has not connected their bank account"**
- Stringer needs to complete Step 2 above
- Go to Settings and click "Connect Bank Account"

**"NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set"**
- Check your `.env.local` file has the correct Stripe keys
- Restart the Next.js dev server after adding keys

**Payment modal doesn't open**
- Check browser console for errors
- Make sure Stripe packages are installed: `npm install stripe @stripe/stripe-js`

**"Failed to authorize payment"**
- Use test card: 4242 4242 4242 4242
- Make sure you're in test mode in Stripe
- Check network tab for API errors

**Payment authorization works but capture fails**
- Payment intents expire after 7 days
- Test the full flow within 7 days
- Check request status is `ready` before capturing

---

## Advanced Testing

### Test Different Cards:

**Successful Payment**:
```
Card: 4242 4242 4242 4242
Result: Payment succeeds
```

**Requires Authentication** (3D Secure):
```
Card: 4000 0025 0000 3155
Result: Shows authentication modal, then succeeds
```

**Declined Card**:
```
Card: 4000 0000 0000 9995
Result: Payment declined - insufficient funds
```

**Expired Card**:
```
Card: 4000 0000 0000 0069
Result: Card expired error
```

### Test Cancel/Refund Flow:

1. After authorizing payment, cancel the request before completion
2. The held payment should be released automatically
3. Player's card is not charged

---

## Stripe Dashboard Navigation

**Key Pages to Check**:

1. **Home Dashboard**: https://dashboard.stripe.com/test/dashboard
   - Overview of recent payments

2. **Payments**: https://dashboard.stripe.com/test/payments
   - See all payment intents (authorized and captured)

3. **Connect → Accounts**: https://dashboard.stripe.com/test/connect/accounts/overview
   - See all connected stringer accounts

4. **Connect → Transfers**: https://dashboard.stripe.com/test/connect/transfers
   - See money transferred to stringers

5. **Logs**: https://dashboard.stripe.com/test/logs
   - See API requests and responses (useful for debugging)

---

## Next Steps After Testing

Once you've verified everything works:

1. **Add Payment UI to Existing Pages**:
   - Player dashboard (show PaymentRequiredBanner when status is `accepted`)
   - Request details page (show ApproveAndPay when status is `ready`)
   - Stringer dashboard (show EarningsBreakdown in job cards)

2. **Add Notifications**:
   - Email when payment authorized
   - Email when payment captured
   - Push notifications for mobile

3. **Build Admin Dashboard**:
   - View all transactions
   - Monitor platform revenue
   - Handle disputes

4. **Go Live**:
   - Complete Stripe account verification
   - Switch to live API keys
   - Have stringers reconnect with real bank accounts
   - Test with small real transactions

---

## Questions or Issues?

- Check STRIPE_PAYMENT_INTEGRATION.md for detailed documentation
- Check Stripe Dashboard logs for API errors
- Check browser console for frontend errors
- Check server logs for backend errors

**Test Mode is Safe**:
- No real money is involved
- No real bank accounts needed
- No real credit cards needed
- Test as many times as you want!
