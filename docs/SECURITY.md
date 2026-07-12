# Security

This document is the single source of truth for Stringerly's security posture. It consolidates and supersedes the following former root-level documents, which made inflated "production ready" / "full OWASP compliance" claims that are **not accurate** given the current code: `AUDIT_SUMMARY.md`, `SECURITY_AUDIT_REPORT.md`, `SECURITY_FIXES_APPLIED.md`, `SECURITY_IMPLEMENTATION_SUMMARY.md`, `SECURITY.md`, `test-security.md`.

The honest summary: Stringerly has **partial, real security hardening** — a fixed IDOR vulnerability, Zod-based input validation on many endpoints, Stripe webhook signature verification, and rate limiting on 10 of 26 API routes. It is **not** fully OWASP-compliant, has **no CSRF protection**, and rate limiting is **in-memory / single-instance only**. Treat any older doc's "production ready" claim as aspirational, not current fact.

---

## What's implemented and verified

### 1. IDOR fix on profile updates
`apps/web/app/my-profile/page.tsx` no longer trusts a client-supplied profile ID for updates — it re-derives the user ID from the authenticated Supabase session (`supabase.auth.getUser()`) before writing. This was the most serious issue found in the original audit and is fixed.

### 2. Zod input validation
`apps/web/lib/validation/schemas.ts` defines ~49 Zod schemas/`.strict()` calls covering requests, payments, messages, tasks, reports, and path parameters (UUID validation). Endpoints that use these schemas reject malformed input, unexpected fields (mass-assignment protection via `.strict()`), and out-of-range values before touching the database.

### 3. Stripe webhook signature verification
`apps/web/app/api/stripe/webhooks/route.ts` verifies every incoming webhook with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET` before processing. Unsigned or invalid-signature requests are rejected. This is real and correctly implemented — it is the app's strongest security control.

### 4. Open-redirect whitelist on auth callback
`apps/web/app/auth/callback/route.ts` checks the request origin against an explicit whitelist (`NEXT_PUBLIC_APP_URL`, `http://localhost:3000`, `http://localhost:3001`) before redirecting post-login, falling back to a safe default otherwise. Verified in code — this fix is real, not just claimed.

### 5. Rate limiting (partial, in-memory only)
`apps/web/lib/security/rate-limit.ts` implements a token-bucket rate limiter, keyed by IP and/or authenticated user ID, with tiers:

| Tier | Limit |
|------|-------|
| PAYMENT | 5 req/min |
| AUTH | 10 req/min |
| UPLOAD | 10 req/min |
| MUTATION | 30 req/min |
| READ | 100 req/min |
| WEBHOOK | 100 req/min |

**Verified by grep of `apps/web/app/api/**/route.ts`: only 10 of 26 API routes actually call `withRateLimit`/`RATE_LIMITS`:**

- `apps/web/app/api/conversations/[id]/messages/route.ts`
- `apps/web/app/api/reports/route.ts`
- `apps/web/app/api/requests/[id]/accept/route.ts`
- `apps/web/app/api/requests/[id]/authorize-payment/route.ts`
- `apps/web/app/api/requests/[id]/cancel/route.ts`
- `apps/web/app/api/requests/[id]/complete/route.ts`
- `apps/web/app/api/requests/[id]/request-extension/route.ts`
- `apps/web/app/api/requests/[id]/respond-extension/route.ts`
- `apps/web/app/api/requests/create/route.ts`
- `apps/web/app/api/stripe/webhooks/route.ts`

**NOT rate-limited** (verified — these routes have no `withRateLimit` call):
`/api/stripe/authorize-payment`, `/api/stripe/capture-payment`, `/api/stripe/connect-account`, `/api/stripe/refresh-onboarding`, `/api/upload-completion-photo`, `/api/requests/[id]/mark-ready`, `/api/requests/[id]/pause`, `/api/requests/[id]/start-work`, `/api/requests/[id]/report-issue`, `/api/requests/[id]/update-quote`, `/api/requests/[id]/tasks` (GET/PUT/redo), `/api/requests/reorder-queue`, `/api/requests/[id]/queue-position`, `/api/conversations` (base route, GET/POST).

Notably, two of the unprotected routes (`/api/stripe/authorize-payment`, `/api/stripe/capture-payment`) are direct Stripe money-movement endpoints — this is a real gap, not a documentation nit.

**Storage is in-memory (a plain `Map`), not Redis.** `@upstash/ratelimit` and `@upstash/redis` are listed in root `package.json` dependencies, and there is a second, unused file — `apps/web/lib/rate-limit.ts` — that actually wires up Upstash with an in-memory fallback when `UPSTASH_REDIS_REST_URL` isn't set. That file is **dead code**: nothing in the app imports it (verified by repo-wide grep). The rate limiter actually used everywhere (`apps/web/lib/security/rate-limit.ts`) has no Redis/Upstash code at all — it's a single in-memory `Map` with an hourly cleanup interval. This means rate limits reset on every deploy/restart and don't work correctly across multiple server instances (e.g. multiple Vercel lambda invocations).

---

## What's missing

### CSRF protection
**Not implemented anywhere in the codebase.** No CSRF token generation, no double-submit cookie pattern, no `SameSite`-based mitigation beyond whatever Next.js/Supabase defaults provide. Older docs claim this was addressed or listed it as a "next step" — it was never built. Confirmed by repo-wide grep for `csrf` (case-insensitive) across `apps/web`: zero matches.

### Rate limiting on remaining 16 routes
See list above. Includes direct payment endpoints (`/api/stripe/authorize-payment`, `/api/stripe/capture-payment`) and account-connection endpoints (`/api/stripe/connect-account`, `/api/stripe/refresh-onboarding`).

### Redis-backed / multi-instance rate limiting
Current implementation cannot be trusted in a horizontally-scaled or serverless-with-multiple-cold-starts deployment. `@upstash/ratelimit` + `@upstash/redis` are already installed but not connected to the active rate limiter.

### Build-time safety nets disabled
`apps/web/next.config.js` has:
```js
eslint: { ignoreDuringBuilds: true },
typescript: { ignoreBuildErrors: true },
```
This is a real, current gap — production builds succeed even with ESLint errors or TypeScript type errors. Not something later docs fixed.

### Error boundaries, monitoring, automated testing
No React error boundaries, no Sentry/error-tracking integration, and (see `docs/TESTING.md`) zero automated tests / no CI. These reduce confidence that regressions or runtime errors are caught before users hit them.

---

## Environment variable classification

```bash
# SECRET — never expose client-side, never commit
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Public — safe to expose (NEXT_PUBLIC_ prefix enforces this)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_APP_URL=...

# Configurable (not secret)
STRIPE_STRINGER_FEE_PERCENT=12
STRIPE_PLAYER_APP_TAX_PERCENT=5
```

See `docs/PAYMENTS.md` for the full current fee-variable model (this supersedes the single `STRIPE_PLATFORM_FEE_PERCENT` variable some older docs and `README.md` describe).

If the service role key or Stripe keys are ever exposed or suspected compromised: rotate immediately in the Supabase dashboard (Settings → API) or Stripe dashboard (Developers → API keys / Webhooks), update the environment variable everywhere it's deployed, and restart the app. There is no automated key-rotation tooling — this is a manual runbook, not an implemented feature.

---

## Manual security spot-checks

There are no automated security tests. The checks below are consolidated from the former `test-security.md` and `test-security-quick.sh` (both deleted as part of this doc consolidation — their content lives here now). Run the app locally (`supabase start` + `npm run dev`) before trying these.

### Quick curl checks

```bash
BASE_URL="http://localhost:3000"

# 1. Invalid UUID in path parameter -> expect 400
curl -s -w "\n%{http_code}\n" -X POST "$BASE_URL/api/requests/not-a-uuid/accept" \
  -H "Content-Type: application/json" -d '{"final_price_cents": 2500}'

# 2. Unauthenticated mutation -> expect 401
curl -s -w "\n%{http_code}\n" -X POST "$BASE_URL/api/requests/create" \
  -H "Content-Type: application/json" -d '{"stringer_id": "test"}'

# 3. Missing required field -> expect 400/401
curl -s -w "\n%{http_code}\n" -X POST "$BASE_URL/api/requests/create" \
  -H "Content-Type: application/json" \
  -d '{"stringer_id": "00000000-0000-0000-0000-000000000000"}'

# 4. Empty message body -> expect 400/401
curl -s -w "\n%{http_code}\n" -X POST "$BASE_URL/api/conversations/00000000-0000-0000-0000-000000000000/messages" \
  -H "Content-Type: application/json" -d '{"body": ""}'
```

### Manual checks

1. **IDOR**: Sign in as one demo player, try to PATCH another user's profile ID via devtools/network tab — should fail or be silently redirected to the authenticated user's own ID.
2. **Input validation / mass assignment**: `POST` to a rate-limited mutation route (e.g. `/api/requests/[id]/accept`) with an extra unexpected field like `{"is_admin": true}` — a `.strict()` schema should reject it with 400.
3. **Rate limiting**: Fire >30 rapid requests at `/api/requests/create` from the browser console — expect a 429 with `X-RateLimit-*` and `Retry-After` headers on requests beyond the limit. Note this only works on the 10 routes listed above.
4. **Webhook signature verification**: `curl -X POST http://localhost:3000/api/stripe/webhooks -d '{}'` with no `stripe-signature` header — should be rejected, not processed.
5. **Open redirect**: Manipulate the `code`/origin handling on `/auth/callback` — redirect should only ever land on an `NEXT_PUBLIC_APP_URL` or localhost origin, never an arbitrary attacker-supplied URL.
6. **CSRF**: There is currently nothing to test here — no protection exists. Don't write a test expecting one to pass.

Demo accounts for manual testing are defined in `supabase/seed.ts` — see `docs/TESTING.md` for the current, verified list (do not trust the account lists in old docs, which disagree with each other and with the current seed file).

---

## Incident response (manual runbook, not automated)

**If `SUPABASE_SERVICE_ROLE_KEY` is compromised:** revoke and regenerate in Supabase Dashboard → Settings → API, update the env var in every deployment target, restart, then audit recent database changes.

**If a Stripe key is compromised:** roll the key in Stripe Dashboard → Developers → API keys, regenerate the webhook signing secret if the endpoint URL changed, update env vars, restart, and review recent transactions/refunds for anything unauthorized.

There is no alerting or monitoring wired up for any of this — compromise would need to be caught manually (e.g. unexpected Stripe Dashboard activity).
