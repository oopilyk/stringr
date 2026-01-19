# Security Testing Checklist

This guide will walk you through testing all the newly secured endpoints.

## Prerequisites
- ✅ Supabase is running (http://localhost:54321)
- ✅ Web app is running (http://localhost:3000)
- You have test accounts ready (from seed data)

## Test Accounts (from seed.ts)
**Players:**
- alex@example.com / password123
- emma@example.com / password123

**Stringers:**
- marco@example.com / password123
- sarah@example.com / password123
- david@example.com / password123

---

## Test 1: Basic Flow (Happy Path) ✅

This tests that all endpoints work correctly under normal conditions.

### Steps:

1. **Open app in browser:**
   - Go to http://localhost:3000
   - Sign in as player: `alex@example.com` / `password123`

2. **Create a request:**
   - Navigate to Discover page
   - Click on a stringer (e.g., Marco)
   - Click "Request Stringing"
   - Fill out the form:
     - Upload a racket photo (any image)
     - Select a service type
     - Choose a string from stringer's inventory
     - Set tension (e.g., 55 lbs for both mains/crosses)
     - Choose dropoff method
     - Submit request

   **Expected:** ✅ Request created successfully (30 req/min limit not hit)
   **Security tested:** Rate limiting, input validation, authentication

3. **Sign out and sign in as stringer:**
   - Sign out
   - Sign in as: `marco@example.com` / `password123`

4. **Accept the request:**
   - Go to Dashboard
   - Click on the pending request
   - Click "Accept Request"
   - Enter final price (e.g., $25.00 = 2500 cents)
   - Submit

   **Expected:** ✅ Request accepted, status changes to "accepted"
   **Security tested:** Authorization (only assigned stringer), state validation

5. **Sign out and sign in as player:**
   - Sign out
   - Sign in as: `alex@example.com` / `password123`

6. **Authorize payment:**
   - Go to Dashboard
   - Click on the accepted request
   - Click "Authorize Payment"
   - Use test card: 4242 4242 4242 4242, any future date, any CVC
   - Submit

   **Expected:** ✅ Payment authorized, status changes to "in_progress"
   **Security tested:** Payment rate limiting (5 req/min), idempotency

7. **Sign out and sign in as stringer:**
   - Sign out
   - Sign in as: `marco@example.com` / `password123`

8. **Complete the job:**
   - Go to Dashboard → Active Jobs
   - Click on the in_progress request
   - Complete all required tasks
   - Upload completion photo
   - Mark as "Ready for Pickup"

   **Expected:** ✅ Status changes to "ready_for_pickup"

9. **Sign out and sign in as player:**
   - Sign out
   - Sign in as: `alex@example.com` / `password123`

10. **Confirm completion:**
    - Go to Dashboard
    - Click on ready request
    - Click "Confirm Pickup & Complete"

    **Expected:** ✅ Request completed, payment captured, stringer earnings updated
    **Security tested:** Payment capture, earnings update, authorization

11. **Test messaging:**
    - While viewing the request, click "Message Stringer"
    - Send a message

    **Expected:** ✅ Message sent successfully
    **Security tested:** Message rate limiting (30 req/min), input validation (5000 char limit)

### ✅ If all steps passed: Core flow is secure and working!

---

## Test 2: Rate Limiting ⚠️

This tests that rate limits prevent abuse.

### Test 2A: Request Creation Rate Limit (30 req/min)

Open browser console (F12) and paste this:

```javascript
// Test request creation rate limit
async function testRateLimit() {
  console.log('Testing rate limit: Creating 31 requests rapidly...');

  for (let i = 0; i < 31; i++) {
    const response = await fetch('/api/requests/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stringer_id: 'REPLACE_WITH_REAL_STRINGER_ID',
        racket_photo_url: 'https://example.com/photo.jpg',
        service_type: 'restring_only',
        string_selection: {
          brand: 'Luxilon',
          model: 'ALU Power',
          gauge: '16L',
          price_cents: 1500
        },
        tension_mains_lbs: 55,
        tension_crosses_lbs: 55,
        string_pattern: 'existing',
        dropoff_method: {
          method: 'Drop-off',
          details: null
        },
        estimated_price_cents: 2500
      })
    });

    console.log(`Request ${i + 1}: ${response.status}`);

    if (response.status === 429) {
      console.log('✅ Rate limit working! Got 429 on request', i + 1);
      const data = await response.json();
      console.log('Response:', data);
      break;
    }
  }
}

testRateLimit();
```

**Expected:**
- First 30 requests: Status 200 or 400 (validation errors are fine)
- Request 31: Status 429 with rate limit headers
- Response includes: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

**If you see 429:** ✅ Rate limiting is working!

---

## Test 3: Input Validation 🔒

This tests that invalid inputs are rejected.

### Test 3A: Invalid UUID in Path Parameter

In browser console:

```javascript
fetch('/api/requests/invalid-uuid-here/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    final_price_cents: 2500
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Invalid request ID format"
}
```

**Status:** 400

### Test 3B: Missing Required Field

```javascript
fetch('/api/requests/CREATE_A_REAL_REQUEST_FIRST/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Missing final_price_cents - required!
    accept_message: "I'll do it!"
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Invalid input",
  "details": "final_price_cents: Required"
}
```

**Status:** 400

### Test 3C: Unexpected Field (Mass Assignment Prevention)

```javascript
fetch('/api/requests/CREATE_A_REAL_REQUEST_FIRST/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    final_price_cents: 2500,
    malicious_field: "I shouldn't be here!",
    is_admin: true  // Trying to escalate privileges
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Invalid input",
  "details": "Unrecognized key(s) in object: 'malicious_field', 'is_admin'"
}
```

**Status:** 400

**If rejected:** ✅ `.strict()` mode is working!

### Test 3D: Message Too Long (5000 char limit)

```javascript
const longMessage = 'a'.repeat(5001);  // 5001 characters

fetch('/api/conversations/REAL_CONVERSATION_ID/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    body: longMessage
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Invalid message",
  "details": "body: Message too long (max 5000 characters)"
}
```

**Status:** 400

---

## Test 4: Authorization 🔐

This tests that users can't access resources they don't own.

### Test 4A: Access Another User's Request

1. Sign in as player Alex (alex@example.com)
2. Create a request
3. Note the request ID from URL (e.g., `/request/abc-123-def`)
4. Sign out
5. Sign in as player Emma (emma@example.com)
6. Try to access Alex's request in browser console:

```javascript
// Replace REQUEST_ID with Alex's request ID
fetch('/api/requests/REQUEST_ID/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Request not found or access denied"
}
```

**Status:** 404

**Note:** It returns 404 (not 403) to avoid leaking information about whether the request exists.

**If blocked:** ✅ Authorization is working!

### Test 4B: Stringer Tries to Complete Request (Player-only endpoint)

1. Sign in as stringer Marco
2. Try to complete a request:

```javascript
fetch('/api/requests/REQUEST_ID/complete', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:** 404 (stringer isn't the player, so request "not found")

---

## Test 5: State Validation 📊

This tests that operations only work in valid states.

### Test 5A: Try to Complete a Pending Request

1. Create a request (status: pending)
2. Try to complete it without accepting first:

```javascript
fetch('/api/requests/PENDING_REQUEST_ID/complete', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Cannot complete request in 'pending' status. Request must be ready for pickup."
}
```

**Status:** 400

### Test 5B: Try to Accept an Already Accepted Request

1. Create and accept a request
2. Try to accept it again:

```javascript
fetch('/api/requests/ACCEPTED_REQUEST_ID/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    final_price_cents: 2500
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "Cannot accept request in 'accepted' status. Only pending requests can be accepted."
}
```

**Status:** 400

**If blocked:** ✅ State validation is working!

---

## Test 6: Idempotency 🔁

This tests that duplicate operations are handled gracefully.

### Test 6A: Complete the Same Request Twice

1. Complete a request (status: completed)
2. Try to complete it again:

```javascript
fetch('/api/requests/COMPLETED_REQUEST_ID/complete', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "success": true,
  "message": "Request already completed",
  "alreadyCompleted": true
}
```

**Status:** 200

**This is correct behavior!** It returns success to avoid errors if the client retries.

---

## Test 7: Error Sanitization 🧹

This tests that internal errors don't leak sensitive information.

### Test 7A: Database Error

Stop Supabase temporarily to simulate a database error:

```bash
npx supabase stop
```

Then try any endpoint:

```javascript
fetch('/api/requests/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stringer_id: '00000000-0000-0000-0000-000000000000',
    // ... other fields
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data));
```

**Expected:**
```json
{
  "error": "An unexpected error occurred. Please try again."
}
```

**Important:** Response should NOT contain:
- Database connection strings
- Stack traces
- Internal error messages

**If sanitized:** ✅ Error sanitization is working!

**Remember to restart Supabase:**
```bash
npx supabase start
```

---

## Test Results Summary

Check off each test:

- [ ] Test 1: Basic Flow (Happy Path)
- [ ] Test 2: Rate Limiting
- [ ] Test 3: Input Validation
- [ ] Test 4: Authorization
- [ ] Test 5: State Validation
- [ ] Test 6: Idempotency
- [ ] Test 7: Error Sanitization

---

## Next Steps After Testing

If all tests pass:
1. ✅ Security implementation is working correctly
2. Ready to add email notifications (optional)
3. Ready to deploy to production

If any tests fail:
1. Check server logs for detailed error messages (look for `[Request Create]`, `[Accept Request]`, etc.)
2. Verify environment variables are set
3. Check that rate limiting storage is working
4. Report issues with specific test that failed
