# Testing

This document consolidates and supersedes `TESTING_GUIDE.md` and `TESTING_PLAN.md`.

## Current state: manual QA only

**There are zero automated tests and no CI pipeline in this repository.** Verified: no `.test.ts`/`.test.tsx`/`.spec.ts` files anywhere outside `node_modules`, no Playwright/Vitest/Jest config, no `.github/` directory. `npm test` at the root resolves to `turbo test`, which has no test script defined in any workspace to actually run — there is nothing to execute.

Everything below is a manual testing procedure, not something enforced automatically on every change. Treat any older doc's checklist checkboxes as a script for a human to run through, not a description of test coverage that exists in code.

## Demo accounts (verified against `supabase/seed.ts`)

Older docs disagree with each other on exact emails (some list `alex@example.com` as a player, some as a stringer; some reference an `emma@example.com` that doesn't exist in the seed data at all). **`supabase/seed.ts` is the source of truth** — this is what it actually creates:

**Stringers** (password `password123` for all):

| Email | Name | Base price | Turnaround |
|-------|------|-----------|------------|
| `marco@example.com` | Marco Rodriguez | $25 | 24h |
| `sarah@example.com` | Sarah Chen | — | 12h |
| `david@example.com` | David Park | — | 48h |
| `lisa@example.com` | Lisa Martinez | — | — |
| `alex@example.com` | Alex Kim | — | — |
| `mike@example.com` | Mike Johnson | — | — |

**Players** (password `password123` for all):

| Email | Name |
|-------|------|
| `player1@example.com` | Jennifer Smith |
| `player2@example.com` | Robert Williams |

All demo stringers are seeded with **mock** Stripe Connect data (`stripe_account_id: acct_test_XXXXXXXX`, `stripe_onboarding_completed: true`, etc.) so the UI shows them as payment-ready. These are not real Stripe accounts — see `docs/PAYMENTS.md` for what that means for payment testing.

Re-seed at any time with:
```bash
npm run db:reset   # wipes and re-applies all migrations + seed
# or, without a full reset:
npm run db:seed
```

## Core manual test flow: full request lifecycle

This is the most important flow to verify after any change touching requests, payments, or the stringer workflow.

1. **Sign in as a player** (`player1@example.com` / `password123`), go to Discover, pick a stringer, submit a request (racket photo, string selection, tension, dropoff method). Expect: request created with status `pending`.
2. **Sign in as that stringer** (e.g. `marco@example.com`), go to Dashboard, accept the pending request with a final quoted price. Expect: status → `accepted`.
3. **Back as the player**, authorize payment on the accepted request using Stripe test card `4242 4242 4242 4242` (see `docs/PAYMENTS.md` for what actually happens with mock vs. real Stripe accounts). Expect: status → `in_progress`, payment intent authorized but not captured.
4. **Back as the stringer**, work through the stringing tasks (receive racket → remove strings → inspect → mount → string mains → string crosses → tie off → final inspection → completion photo), then mark ready for pickup. Expect: status → `ready`.
5. **Back as the player**, confirm pickup/approve. Expect: status → `completed`, payment captured, stringer earnings recorded.
6. **Optionally leave a review** as the player.
7. **Test messaging** at any point in the flow — send a message via the conversation UI attached to the request.

## Feature-specific manual tests

These cover functionality added after the core flow above (from the former `TESTING_PLAN.md`) — verify the relevant migration has been applied (`npm run db:reset`) before testing.

### Fee breakdown display
Confirm the player sees `service price + 5% app tax = total`, and the stringer sees `service price − 12% fee = earnings`, matching the two-fee model documented in `docs/PAYMENTS.md`.

### Town-only location privacy
Stringer Settings → toggle "Show town only" → verify player-facing stringer cards show just the city (e.g. "Baltimore") instead of full location, and the toggle persists across a page refresh.

### 48-hour pickup window + extension requests
After a stringer marks a request "Ready for Pickup", the player should see a pickup deadline (48h from ready) with a countdown. Player can request a 24h extension (reason must be ≥10 characters; a second request while one is pending should be rejected). Stringer can approve (extends deadline 24h) or deny (deadline unchanged) — responding twice to the same request should be rejected.

### User reports
From a player or stringer profile, "Report User" requires a reason and a description of ≥20 characters. Submitting a duplicate report against the same user while one is pending should be rejected. Rate limit: 6 reports/hour should trigger a 429 on the 6th attempt.

### Queue position
Create multiple requests to the same stringer, including at least one marked "rush." After the stringer accepts all of them, rush requests should sort first, then FIFO by acceptance time. Each player should see their numeric queue position, and positions should shift down as earlier requests complete.

## Rate limiting / security spot-checks

These overlap with `docs/SECURITY.md` — see that doc for the full, current list of which routes are actually rate-limited (10 of 26) and the curl-based spot-check commands. Don't test rate limiting against routes not in that list; they don't have it.

## Known limitations of local testing

- **Stripe payments partially fail with mock accounts.** Seeded stringers have fake `acct_test_XXXXXXXX` IDs — payment authorization against them fails at the real Stripe API. To test a full real payment capture, connect at least one stringer through the actual Stripe Express onboarding flow (test mode) — see `docs/PAYMENTS.md`.
- **No email notifications.** Players aren't notified when a request is accepted; stringers aren't notified of new requests. Not implemented.
- **Rate limiting resets on dev server restart** and only works for a single instance — see `docs/SECURITY.md`.
- **No automated regression protection.** Every manual pass is a fresh, from-scratch verification; nothing catches a regression between sessions except a human re-running this document.

## Recommended next step (not yet done)

If automated testing is added, the natural stack given this repo (Next.js 14 App Router, TypeScript) would be Vitest + React Testing Library for unit/component tests and Playwright for E2E — neither is currently installed or configured.
