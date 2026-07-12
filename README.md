# Stringerly

**Tennis racquet stringing marketplace — connecting players with local stringers.**

Stringerly connects local tennis stringers with players who need quick, affordable racquet restringing. Players discover nearby stringers, create requests, and pay securely through the platform via escrow. Stringers manage jobs through a guided workflow and get paid automatically once the player approves completed work.

## Features

- **Player discovery** — find local stringers by location, price, rating, and availability
- **Request management** — create requests with racket photos, string preferences, and tension specs
- **Escrow payments** — Stripe Connect with manual capture; funds are authorized on accept, captured on approval
- **Guided stringing workflow** — task checklist for stringers to track job progress, with QR-code mobile photo upload for the completion photo
- **Reviews & ratings** — post-completion reviews
- **In-app messaging** — real-time-ish conversation threads between players and stringers

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| UI components | shadcn/ui, shared via `packages/ui` |
| Mobile | Expo (`apps/mobile`) — thinner scaffold, not the primary product surface yet |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Payments | Stripe Connect (destination-style charges, manual capture / escrow) |
| Monorepo | Turborepo + npm workspaces |

## Project structure

```
stringerly/
├── apps/
│   ├── web/                    # Next.js web app (primary product)
│   │   ├── app/                # App Router pages and API routes
│   │   ├── components/         # React components
│   │   └── lib/                # Supabase clients, Stripe helpers, validation, rate limiting
│   └── mobile/                 # Expo app (thinner scaffold)
├── packages/
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared TypeScript types (incl. generated Supabase types)
├── supabase/
│   ├── migrations/             # Database migrations (source of truth for schema)
│   └── seed.ts                 # Demo data seeding — source of truth for demo accounts
└── docs/                       # Security, payments, testing, QR setup docs
```

## Quick start

### Prerequisites

- Node.js 18+
- Docker (for local Supabase — Docker Desktop is easiest)
- Homebrew (macOS, for the Stripe CLI)
- A free Stripe account (test mode) — https://stripe.com

### 1. Install and start Supabase

```bash
git clone <repository-url>
cd stringerly
npm install
supabase start
```

Note the API URL, anon key, and service role key from the output.

### 2. Configure environment variables

Create `apps/web/.env.local` (see `apps/web/.env.local.example` for the full template):

```env
# Supabase (from `supabase start` output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL — also used for QR code photo upload, see docs/QR_CODE_SETUP.md
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (test mode keys from your Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Fee structure — see docs/PAYMENTS.md for the full model
STRIPE_STRINGER_FEE_PERCENT=12
STRIPE_PLAYER_APP_TAX_PERCENT=5
```

### 3. Set up the database

```bash
supabase db reset          # applies all migrations and runs the seed script
npm run db:generate        # regenerate packages/types/src/database.types.ts from the schema
```

### 4. Run the dev environment (3 terminals)

**Terminal 1 — Supabase** (if not already running):
```bash
supabase start
```

**Terminal 2 — Stripe webhook forwarding:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```
Copy the printed `whsec_...` into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

**Terminal 3 — Next.js:**
```bash
cd apps/web
npm run dev
```

- Web app: http://localhost:3000
- Supabase Studio: http://localhost:54323

### Demo accounts

Seeded by `supabase/seed.ts` (all passwords `password123`):

**Stringers:** `marco@example.com`, `sarah@example.com`, `david@example.com`, `lisa@example.com`, `alex@example.com`, `mike@example.com`

**Players:** `player1@example.com`, `player2@example.com`

See `docs/TESTING.md` for the full account details and manual test flows.

### Stopping / resetting

```bash
supabase stop               # stop Supabase, keep data
supabase stop --no-backup   # stop and wipe all local data
supabase db reset           # reset schema + reseed
```

## Documentation

| Doc | Covers |
|-----|--------|
| [docs/SECURITY.md](docs/SECURITY.md) | What's actually implemented vs. missing — rate limiting coverage, validation, CSRF status, incident response |
| [docs/PAYMENTS.md](docs/PAYMENTS.md) | Escrow/Connect architecture, current two-fee model, webhook events, local testing, going-live checklist |
| [docs/TESTING.md](docs/TESTING.md) | Manual QA flows and demo accounts (there are currently no automated tests or CI) |
| [docs/QR_CODE_SETUP.md](docs/QR_CODE_SETUP.md) | Getting the mobile QR photo-upload flow working on your local network |

## Production readiness

This is **not yet production-ready**. Known gaps (detailed in `docs/SECURITY.md`): rate limiting only covers 10 of 26 API routes (notably missing on direct Stripe payment endpoints), no CSRF protection, in-memory rate limiting won't survive multi-instance deployment, `next.config.js` currently ignores ESLint and TypeScript errors at build time, and there are zero automated tests or CI. Treat any claim of "production ready" in git history or old docs as aspirational, not current.

## License

MIT License. (No `LICENSE` file is currently checked into the repo — add one before treating this as legally binding.)
