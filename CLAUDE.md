# Stringerly — Project CLAUDE.md

## Project overview

Stringerly is a tennis racquet stringing marketplace connecting players with local stringers. Players discover stringers, create requests, and pay through Stripe Connect escrow; stringers work through a guided task checklist and get paid when the player approves completed work.

**Stack:** Turborepo monorepo (npm workspaces) — Next.js 14 (App Router) + TypeScript web app, Expo mobile app (thinner scaffold), Supabase (Postgres + Auth + RLS + Storage), Stripe Connect for escrow payments, shared `packages/ui` and `packages/types`.

This is not a generic SaaS app — there is no subscription model, no "free tier," no per-day API call limits. Revenue comes from a per-transaction fee split (see `docs/PAYMENTS.md`), not subscriptions.

## Repository structure

```
stringerly/
├── apps/
│   ├── web/                    # Next.js 14 App Router — the primary product
│   │   ├── app/                # Pages + API routes (app/api/**/route.ts)
│   │   ├── components/         # React components, organized by feature/domain
│   │   ├── lib/
│   │   │   ├── supabase-server.ts   # createServerClient() / createServiceRoleClient()
│   │   │   ├── stripe/               # server.ts (fee constants, PaymentIntent helpers), client.ts
│   │   │   ├── security/rate-limit.ts  # in-memory token-bucket rate limiter (see docs/SECURITY.md)
│   │   │   ├── validation/schemas.ts   # all Zod schemas, one file
│   │   │   ├── hooks/                  # custom React hooks
│   │   │   ├── contexts/               # React context providers
│   │   │   └── utils/
│   │   ├── middleware.ts       # Supabase session refresh + route protection
│   │   └── next.config.js      # NOTE: eslint.ignoreDuringBuilds and typescript.ignoreBuildErrors are both true
│   └── mobile/                 # Expo app — thinner scaffold, not the primary surface yet
├── packages/
│   ├── ui/src/                 # Shared UI components (shadcn/ui-based)
│   └── types/src/              # Shared TypeScript types, incl. generated database.types.ts
├── supabase/
│   ├── migrations/             # Numbered SQL migrations — source of truth for schema, never hand-edit the DB
│   └── seed.ts                 # Demo data — source of truth for demo account emails/passwords
└── docs/                       # SECURITY.md, PAYMENTS.md, TESTING.md, QR_CODE_SETUP.md
```

## Critical rules

### Database (Supabase)

- All app queries go through the Supabase client with RLS enabled. Service-role bypass (`createServiceRoleClient()` in `apps/web/lib/supabase-server.ts`) is reserved for a small number of trusted server-side operations (webhooks, payment capture) — never use it casually.
- Schema changes go in `supabase/migrations/` as new numbered SQL files (e.g. `20250208000006_add_queue_position.sql`). Never modify an already-applied migration or hand-edit the database.
- Regenerate `packages/types/src/database.types.ts` after schema changes: `npm run db:generate`.
- Demo/seed data lives in `supabase/seed.ts` — treat it as the single source of truth for demo account emails/passwords, not any doc.

### Authentication

- `apps/web/lib/supabase-server.ts` exports `createServerClient()` for RLS-respecting server-side reads/writes and `createServiceRoleClient()` for the rare trusted bypass case.
- `apps/web/middleware.ts` refreshes the Supabase session and redirects unauthenticated users away from non-public routes.
- `apps/web/app/auth/callback/route.ts` validates the redirect origin against an explicit whitelist before redirecting post-login — do not remove or loosen this without understanding it's the open-redirect fix (see `docs/SECURITY.md`).

### API routes (`apps/web/app/api/**/route.ts`)

The established pattern in hardened routes (not yet applied to all 26 routes — see `docs/SECURITY.md` for exactly which ones) is a numbered sequence of checks in comments:

1. Authentication — `supabase.auth.getUser()`, 401 if missing
2. Rate limiting — `withRateLimit(request, RATE_LIMITS.<TIER>, user.id)` from `lib/security/rate-limit.ts`
3. Input validation — path params and body validated via `validateData()` + a `.strict()` Zod schema from `lib/validation/schemas.ts`
4. Authorization — ownership check via `.eq('player_id', user.id)` or similar, return 404 (not 403) to avoid leaking existence
5. State validation — reject operations invalid for the resource's current status
6. Business logic
7. Audit logging — insert into `request_state_changes` for state transitions
8. Sanitized error responses — never return raw Stripe/database error messages to the client; log details server-side, return a generic message

When adding a new mutation route, follow this pattern and actually wire up rate limiting — it's easy to skip and 16 of 26 routes currently do (a real gap, not a style choice).

### Billing / payments

- Stripe webhook handler: `apps/web/app/api/stripe/webhooks/route.ts` at route `/api/stripe/webhooks` (not `/api/webhooks/stripe` — an older doc had this backwards).
- Never trust client-provided prices — final price and fee calculations happen server-side using `STRINGER_FEE_PERCENT` / `PLAYER_APP_TAX_PERCENT` from `apps/web/lib/stripe/server.ts`.
- Current fee model is **two separate percentages** (`STRIPE_STRINGER_FEE_PERCENT`, `STRIPE_PLAYER_APP_TAX_PERCENT`), not a single platform fee. See `docs/PAYMENTS.md` before touching pricing code.
- All webhook events must go through `stripe.webhooks.constructEvent()` signature verification before processing.

### Code style

- No emojis in code or comments.
- Immutable patterns — spread operator, never mutate objects/arrays in place.
- Client components: `'use client'` at the top; keep them thin, extract logic into `lib/hooks/`.
- Zod schemas for all input validation that crosses a trust boundary (API routes, forms) — add new schemas to `apps/web/lib/validation/schemas.ts` rather than inlining validation.
- Prefer explicit types on exported functions and component props; avoid `any` (existing `any` usage in older onboarding components is legacy, not a pattern to copy).

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only, never expose to client

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STRINGER_FEE_PERCENT=12      # current two-fee model — see docs/PAYMENTS.md
STRIPE_PLAYER_APP_TAX_PERCENT=5

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # also drives QR photo-upload URLs, see docs/QR_CODE_SETUP.md
```

## Testing strategy — currently manual only

There are no automated tests and no CI in this repository (verified: no `.test.ts`/`.spec.ts` files, no Playwright/Vitest config, no `.github/` workflows). `docs/TESTING.md` documents the manual QA flow and demo accounts. If you add automated tests, Vitest + React Testing Library for unit/component and Playwright for E2E fit this stack, but neither is wired up yet — don't assume test infrastructure exists.

## Known gaps (don't assume these are solved)

- Rate limiting covers only 10 of 26 API routes, and is in-memory (won't survive multi-instance deployment). See `docs/SECURITY.md`.
- No CSRF protection anywhere in the codebase.
- `apps/web/next.config.js` currently sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — production builds do not fail on lint or type errors.
- Zero automated tests / no CI.

Full detail on all of the above lives in `docs/SECURITY.md` and `docs/TESTING.md` — treat those as current truth over any git history or commit message claiming otherwise.

## Turbo scripts (root `package.json`)

```bash
npm run dev            # turbo dev — runs all apps' dev servers
npm run build           # turbo build
npm run lint             # turbo lint
npm run type-check       # turbo type-check
npm run db:generate       # regenerate packages/types/src/database.types.ts from local Supabase schema
npm run db:reset          # supabase db reset — reapply all migrations + seed
npm run db:seed           # tsx supabase/seed.ts
```
