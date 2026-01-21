# Stringerly

**Tennis racquet stringing marketplace - connecting players with local stringers**

Stringerly connects local tennis stringers with players who need quick, affordable racquet restringing. Players discover nearby stringers, create requests, and pay securely through the platform. Stringers manage jobs through a guided workflow and get paid automatically when work is approved.

## Features

- **Player Discovery** - Find local stringers by location, price, rating, and availability
- **Request Management** - Create requests with racket photos, string preferences, and tension specs
- **Stripe Payments** - Secure escrow payments with automatic stringer payouts
- **Stringing Workflow** - Guided task system for stringers to track job progress
- **Reviews & Ratings** - Post-completion reviews for quality assurance
- **Real-time Messaging** - In-app communication between players and stringers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Payments | Stripe Connect (destination charges, manual capture) |
| Monorepo | Turborepo |

## Project Structure

```
stringerly/
├── apps/
│   └── web/                    # Next.js web application
│       ├── app/                # App Router pages and API routes
│       ├── components/         # React components
│       └── lib/                # Utilities, Stripe, Supabase clients
├── packages/
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared TypeScript types
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Demo data seeding
└── docs/                       # Documentation
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local Supabase) - Docker Desktop easiest to use
- Homebrew (macOS, for Stripe CLI)
- Stripe account (free at https://stripe.com)

### 1. Clone and Install

```bash
git clone <repository-url>
cd stringerly
npm install
```

### 2. Start Local Supabase

```bash
supabase start
```

Note the output - you'll need the API URL, anon key, and service role key.

### 3. Environment Setup

Create `apps/web/.env.local`:

```env
# Supabase (from supabase start output)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (from Stripe Dashboard - Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PLATFORM_FEE_PERCENT=12
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Database Setup

```bash
# Reset database and apply all migrations (also runs seed)
supabase db reset

# Generate TypeScript types from database schema
npm run db:generate

# If you need to re-seed manually
npm run db:seed
```

### 5. Start Development

You need **3 terminals**:

**Terminal 1: Supabase** (if not already running)
```bash
supabase start
```

**Terminal 2: Stripe Webhooks**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```
Copy the `whsec_...` output to your `.env.local`

**Terminal 3: Next.js**
```bash
cd apps/web
npm run dev
```

**Access:**
- Web app: http://localhost:3000
- Supabase Studio: http://localhost:54323

---

## Demo Accounts

The seed script creates test accounts:

**Stringers:**
| Email | Password | Details |
|-------|----------|---------|
| marco@example.com | password123 | $25 base, 24h turnaround |
| sarah@example.com | password123 | $30 base, 12h turnaround |
| david@example.com | password123 | $20 base, 48h turnaround |

**Players:**
| Email | Password |
|-------|----------|
| alex@example.com | password123 |
| emma@example.com | password123 |

---

## Payment Flow

Stringerly uses Stripe Connect with destination charges and manual capture (escrow):

```
1. Player creates request           → Status: pending
2. Stringer accepts with price      → Status: accepted
3. Player authorizes payment        → Status: in_progress (payment HELD)
4. Stringer completes work          → Status: ready
5. Player approves pickup           → Status: completed (payment CAPTURED)
```

**Fee Structure:**
- Platform fee: 12%
- Stripe processing: ~2.9% + 30¢
- Stringer receives: 88% of job price

See [STRIPE_TESTING_GUIDE.md](STRIPE_TESTING_GUIDE.md) for complete payment testing instructions.

---

## Documentation

| Document | Description |
|----------|-------------|
| [STRIPE_TESTING_GUIDE.md](STRIPE_TESTING_GUIDE.md) | Complete Stripe payment testing walkthrough |
| [SECURITY.md](SECURITY.md) | Security implementation details and best practices |
| [SECURITY_IMPLEMENTATION_SUMMARY.md](SECURITY_IMPLEMENTATION_SUMMARY.md) | API security hardening summary |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | General testing instructions |
| [PAYMENT_FEATURES.md](PAYMENT_FEATURES.md) | Payment feature documentation |

---

## API Routes

### Requests
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/requests/create` | POST | Create a new stringing request |
| `/api/requests/[id]/accept` | POST | Stringer accepts a request |
| `/api/requests/[id]/authorize-payment` | POST | Player authorizes payment |
| `/api/requests/[id]/complete` | POST | Complete request and capture payment |
| `/api/requests/[id]/cancel` | POST | Cancel a request |

### Stripe
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/connect-account` | POST | Create Stripe Connect account for stringer |
| `/api/stripe/authorize-payment` | POST | Create payment intent |
| `/api/stripe/capture-payment` | POST | Capture authorized payment |
| `/api/stripe/webhooks` | POST | Handle Stripe webhook events |

### Other
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations/[id]/messages` | GET/POST | Get or send messages |

---

## Database Schema

**Core Tables:**
```
profiles              # User profiles (extends auth.users)
stringer_settings     # Stringer pricing, availability, Stripe account
requests              # Stringing requests with payment tracking
stringing_tasks       # Workflow tasks for each request
messages              # Conversation messages
reviews               # Post-completion reviews
```

**Key Security Features:**
- Row Level Security (RLS) on all tables
- SECURITY DEFINER functions for payment operations
- Service role key for webhook processing

---

## Request Workflow

```
pending → accepted → in_progress → ready → completed
   ↓         ↓           ↓           ↓         ↓
  📝        ✅          🔧         📦        ⭐
Player   Stringer    Stringer   Stringer  Player
creates  accepts &   working    finished  approves &
request  quotes      (payment   (upload   pays
                     held)      photo)
```

**Stringing Tasks:**
1. Receive racket
2. Remove old strings
3. Inspect frame
4. Mount racket
5. String mains
6. String crosses
7. Tie off
8. Final inspection
9. Completion photo

---

## Stopping Services

When done developing:

```bash
# Stop Supabase (preserves data)
supabase stop

# Stop Stripe CLI
Ctrl+C in the stripe listen terminal

# Stop Next.js
Ctrl+C in the npm run dev terminal
```

To completely reset:
```bash
# Stop and remove all data
supabase stop --no-backup

# Restart fresh
supabase start
supabase db reset
```

---

## Production Deployment

### Blockers to Address

Before deploying to production, see the production readiness assessment:

1. **Remove hardcoded localhost URLs** in auth callbacks and `next.config.js`
2. **Set up email service** (Resend/SendGrid) for password reset
3. **Add error tracking** (Sentry)
4. **Configure production Stripe webhook** with live API keys
5. **Remove/replace console.log statements**

### Deployment Steps

1. **Supabase:** Create project at https://supabase.com, run migrations
2. **Stripe:** Switch to Live Mode, update API keys, configure webhook
3. **Vercel:** Deploy with production environment variables

---

## File Locations

### Stripe Integration
| File | Purpose |
|------|---------|
| `apps/web/lib/stripe/server.ts` | Stripe server utilities |
| `apps/web/lib/stripe/client.ts` | Stripe client utilities |
| `apps/web/app/api/stripe/` | Stripe API routes |
| `apps/web/components/stripe/` | Payment UI components |

### Security
| File | Purpose |
|------|---------|
| `apps/web/lib/security/rate-limit.ts` | Rate limiting middleware |
| `apps/web/lib/validation/schemas.ts` | Zod validation schemas |

### Environment
| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Local environment variables |
| `apps/web/.env.local.example` | Example environment file |

---

## License

MIT License - see [LICENSE](LICENSE) for details.
