# Security Documentation

This document outlines the security measures implemented in Stringerly and provides guidelines for secure configuration and operation.

## Table of Contents

1. [Security Features](#security-features)
2. [Environment Variables](#environment-variables)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [Authentication & Authorization](#authentication--authorization)
6. [OWASP Compliance](#owasp-compliance)
7. [Security Best Practices](#security-best-practices)
8. [Incident Response](#incident-response)

---

## Security Features

### Implemented Security Controls

✅ **Rate Limiting**
- IP-based and user-based rate limiting on all public endpoints
- Token bucket algorithm with configurable limits
- Graceful 429 responses with `Retry-After` headers

✅ **Input Validation**
- Strict Zod schema validation on all user inputs
- Type checking, length limits, and format validation
- Rejection of unexpected fields with `.strict()` mode
- UUID validation to prevent SQL injection

✅ **Authentication**
- Supabase Auth on all sensitive endpoints
- JWT token validation
- Session management

✅ **Authorization**
- Object-level access control (player/stringer ownership checks)
- Role-based permissions
- Multi-party authorization for shared resources

✅ **Financial Security**
- Stripe signature verification on all webhooks
- Idempotency checks to prevent double-charges
- Secure refund processing
- Payment state validation

✅ **Error Handling**
- Non-leaky error messages (no internal details exposed)
- Sanitized Stripe and database errors
- Comprehensive logging for debugging

✅ **Audit Logging**
- State change tracking in `request_state_changes` table
- Webhook event logging
- Payment authorization/capture logging

---

## Environment Variables

### Required Environment Variables

All environment variables must be stored securely and never committed to version control.

#### **Supabase Configuration**

```bash
# Supabase URL (public, safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anonymous Key (public, safe to expose)
# Used for client-side authentication
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (SECRET - NEVER EXPOSE)
# Used for server-side operations that bypass RLS
# CRITICAL: Rotate immediately if compromised
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Service Role Key Security:**
- ⚠️ **CRITICAL**: Never expose this key to client-side code
- Used only in server-side API routes and webhooks
- Grants admin-level database access
- Rotation procedure:
  1. Generate new key in Supabase Dashboard → Settings → API
  2. Update environment variable in all environments
  3. Restart application
  4. Revoke old key in Supabase Dashboard
  5. Monitor for any authentication errors

#### **Stripe Configuration**

```bash
# Stripe Secret Key (SECRET - NEVER EXPOSE)
# Used for server-side Stripe API calls
STRIPE_SECRET_KEY=sk_live_...  # or sk_test_... for development

# Stripe Publishable Key (public, safe to expose)
# Used for client-side Stripe Elements
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # or pk_test_...

# Stripe Webhook Secret (SECRET - NEVER EXPOSE)
# Used to verify webhook signatures
# CRITICAL: Rotate if webhook endpoint URL changes
STRIPE_WEBHOOK_SECRET=whsec_...

# Platform Fee Percentage (configurable)
# Default: 12% (can be adjusted as needed)
STRIPE_PLATFORM_FEE_PERCENT=12
```

**Stripe Key Security:**
- ⚠️ **Secret Key**: Full API access - treat like a password
- ⚠️ **Webhook Secret**: Validates webhook authenticity
- Rotation procedure:
  1. Generate new keys in Stripe Dashboard → Developers → API keys
  2. Update environment variables
  3. Update webhook endpoint configuration
  4. Test payment flows
  5. Roll out to production
  6. Revoke old keys

#### **Application Configuration**

```bash
# Application URL (public)
# Used for Stripe return URLs and QR code generation
NEXT_PUBLIC_APP_URL=https://stringerly.com  # or http://localhost:3000
```

### Environment Variable Validation

The application validates all required environment variables on startup:

```typescript
// Example validation (add to app initialization)
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})
```

### Development vs Production

**Development (.env.local):**
- Use Supabase local development URL: `http://127.0.0.1:54321`
- Use Stripe test keys: `sk_test_...` and `pk_test_...`
- Use local app URL: `http://localhost:3000`

**Production (Vercel/Environment):**
- Use production Supabase URL
- Use Stripe live keys: `sk_live_...` and `pk_live_...`
- Use production app URL: `https://stringerly.com`

---

## Rate Limiting

### Rate Limit Configuration

Located in `/lib/security/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  PAYMENT: { maxRequests: 5, windowSeconds: 60 },     // 5 req/min
  AUTH: { maxRequests: 10, windowSeconds: 60 },       // 10 req/min
  UPLOAD: { maxRequests: 10, windowSeconds: 60 },     // 10 req/min
  MUTATION: { maxRequests: 30, windowSeconds: 60 },   // 30 req/min
  READ: { maxRequests: 100, windowSeconds: 60 },      // 100 req/min
  WEBHOOK: { maxRequests: 100, windowSeconds: 60 },   // 100 req/min
}
```

### Endpoints by Rate Limit

| Endpoint | Rate Limit | Reason |
|----------|------------|--------|
| `/api/requests/[id]/authorize-payment` | PAYMENT (5/min) | Prevent payment spam |
| `/api/requests/[id]/cancel` | MUTATION (30/min) | Standard mutation |
| `/api/conversations/[id]/messages` | MUTATION (30/min) | Prevent message spam |
| `/api/stripe/webhooks` | WEBHOOK (100/min) | Stripe webhook traffic |

### Rate Limit Headers

All rate-limited responses include:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 2026-01-08T19:45:00.000Z
Retry-After: 2
```

### Scaling Rate Limiting

The current implementation uses in-memory storage. For production with multiple instances:

**Option 1: Redis (Recommended)**
```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// Store buckets in Redis instead of Map
```

**Option 2: Distributed Cache**
- Use Vercel KV
- Use Upstash Redis
- Use CloudFlare KV

---

## Input Validation

### Validation Strategy

All user inputs are validated using Zod schemas with the following approach:

1. **Path Parameters**: UUID format validation
2. **Request Body**: Schema-based validation with `.strict()` mode
3. **Query Parameters**: Type and format validation
4. **Length Limits**: All text fields have maximum lengths
5. **Type Checking**: Strict type enforcement

### Validation Schemas

Located in `/lib/validation/schemas.ts`:

```typescript
// Example: Payment authorization
export const AuthorizePaymentSchema = z.object({
  payment_method_id: z.string().min(1).max(255)
}).strict() // Rejects unexpected fields

// Example: Message validation
export const MessageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long')
    .trim()
}).strict()
```

### Validation Function

```typescript
import { validateData } from '@/lib/validation/schemas'

const validation = validateData(SomeSchema, userInput)

if (!validation.success) {
  return NextResponse.json(
    { error: 'Invalid input', details: validation.error },
    { status: 400 }
  )
}

// Use validated data
const { field1, field2 } = validation.data
```

### Protection Against

- ✅ SQL Injection (UUID validation)
- ✅ XSS (input sanitization)
- ✅ Buffer Overflow (length limits)
- ✅ Type Confusion (strict typing)
- ✅ Mass Assignment (`.strict()` mode)

---

## Authentication & Authorization

### Authentication Flow

1. User authenticates with Supabase Auth
2. JWT token stored in cookie (httpOnly, secure)
3. API routes verify token with `supabase.auth.getUser()`
4. Expired tokens automatically refreshed

### Authorization Patterns

**Object-Level Authorization:**
```typescript
// Verify user owns the resource
const { data: req } = await supabase
  .from('requests')
  .select('*')
  .eq('id', params.id)
  .eq('player_id', user.id) // CRITICAL: Ownership check
  .single()

if (!req) {
  return NextResponse.json(
    { error: 'Request not found or access denied' },
    { status: 404 }
  )
}
```

**Multi-Party Authorization:**
```typescript
// Allow either player or stringer
if (req.player_id !== user.id && req.stringer_id !== user.id) {
  return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
  )
}
```

### Special Cases

**Stripe Webhooks:**
- No user authentication (webhooks from Stripe)
- Authenticated via signature verification
- Uses service role key for database updates

**Photo Upload:**
- Token-based authentication
- Token format: `{requestId}-{timestamp}`
- Validates request exists before allowing upload

---

## OWASP Compliance

### OWASP API Security Top 10 (2023)

| Risk | Mitigation |
|------|------------|
| **API1:2023 Broken Object Level Authorization** | Object-level access checks on all endpoints |
| **API2:2023 Broken Authentication** | Supabase Auth + JWT validation |
| **API3:2023 Broken Object Property Level Authorization** | `.strict()` validation, field-level access control |
| **API4:2023 Unrestricted Resource Consumption** | Rate limiting on all endpoints |
| **API5:2023 Broken Function Level Authorization** | Role-based access control |
| **API6:2023 Unrestricted Access to Sensitive Business Flows** | State validation, idempotency checks |
| **API7:2023 Server Side Request Forgery** | Webhook signature verification |
| **API8:2023 Security Misconfiguration** | Environment validation, strict validation |
| **API9:2023 Improper Inventory Management** | Documented API endpoints, version control |
| **API10:2023 Unsafe Consumption of APIs** | Stripe error sanitization, timeout handling |

---

## Security Best Practices

### For Developers

1. **Never log sensitive data**
   ```typescript
   // ❌ BAD
   console.log('Payment data:', paymentIntent)

   // ✅ GOOD
   console.log('Payment authorized:', paymentIntent.id)
   ```

2. **Always validate user input**
   ```typescript
   // ❌ BAD
   const { amount } = await request.json()

   // ✅ GOOD
   const validation = validateData(PaymentSchema, await request.json())
   if (!validation.success) return error(400)
   const { amount } = validation.data
   ```

3. **Use non-leaky error messages**
   ```typescript
   // ❌ BAD
   return NextResponse.json({ error: dbError.message }, { status: 500 })

   // ✅ GOOD
   console.error('Database error:', dbError)
   return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
   ```

4. **Always check authorization**
   ```typescript
   // ❌ BAD
   const { data } = await supabase.from('requests').select('*').eq('id', id).single()

   // ✅ GOOD
   const { data } = await supabase
     .from('requests')
     .select('*')
     .eq('id', id)
     .eq('player_id', user.id)  // Ownership check
     .single()
   ```

### For Operations

1. **Rotate secrets regularly**
   - Service role key: Annually or if compromised
   - Stripe keys: When security policy requires
   - Webhook secret: When endpoint URL changes

2. **Monitor rate limit violations**
   - Set up alerts for excessive 429 responses
   - Investigate patterns of rate limit hits
   - Consider IP blocking for persistent abusers

3. **Audit logging**
   - Review `request_state_changes` table weekly
   - Monitor Stripe webhook failures
   - Track payment authorization patterns

4. **Environment variable management**
   - Use secret management tools (Vercel secrets, AWS Secrets Manager)
   - Never commit `.env` files to version control
   - Verify `.gitignore` includes `.env.local`

---

## Incident Response

### If Service Role Key is Compromised

**IMMEDIATE ACTIONS:**

1. **Revoke the key**
   - Go to Supabase Dashboard → Settings → API
   - Click "Revoke" on the compromised key

2. **Generate new key**
   - Click "Generate new service role key"
   - Copy the new key

3. **Update all environments**
   - Update `SUPABASE_SERVICE_ROLE_KEY` in all environments
   - Restart all application instances

4. **Audit database**
   - Review recent changes in audit logs
   - Check for unauthorized data modifications
   - Review user creation logs

5. **Notify security team**
   - Document the incident
   - Determine scope of potential breach
   - Assess if user data was accessed

### If Stripe Keys are Compromised

**IMMEDIATE ACTIONS:**

1. **Roll keys in Stripe Dashboard**
   - Stripe Dashboard → Developers → API keys
   - Click "Roll key" for secret key

2. **Update webhook secret**
   - Stripe Dashboard → Developers → Webhooks
   - Generate new signing secret

3. **Update environment variables**
   - Update `STRIPE_SECRET_KEY`
   - Update `STRIPE_WEBHOOK_SECRET`
   - Restart application

4. **Review transactions**
   - Check for unauthorized payments
   - Review refund history
   - Contact Stripe support if fraud detected

### If Rate Limiting is Bypassed

**INVESTIGATION:**

1. **Identify attack pattern**
   - Review server logs for excessive requests
   - Identify source IPs
   - Determine attack vector

2. **Implement additional controls**
   - Add IP blocking rules
   - Reduce rate limits temporarily
   - Enable CAPTCHA for sensitive endpoints

3. **Monitor impact**
   - Check application performance
   - Review database load
   - Assess financial impact

---

## Security Contacts

For security vulnerabilities, please report to:
- Email: security@stringerly.com
- GitHub Security Advisories: (create private report)

**Do not disclose security vulnerabilities publicly.**

---

## Changelog

- **2026-01-08**: Initial security hardening implementation
  - Added rate limiting to all endpoints
  - Implemented comprehensive input validation
  - Secured environment variable usage
  - Added OWASP compliance documentation
