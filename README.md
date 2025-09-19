# Stringr

**Tennis racquet stringing marketplace - "Uber for stringing"**

Stringr connects local tennis stringers with players who need quick, affordable racquet restringing. Think of it as Uber for tennis stringing with lightweight social features.

## 🎯 Product Vision

- **Players** discover nearby stringers, view profiles, prices, turnaround times, and reviews
- **Players** create restring requests with racquet details, string preferences, and logistics
- **Stringers** manage availability, accept/decline jobs, and track order status through the workflow
- **Simple messaging** for coordination and logistics
- **Reviews & ratings** after job completion
- **Geo-aware** with distance calculations but no live tracking

## 🏗 Architecture

### Monorepo Structure
```
rally-strings/
├── apps/
│   ├── web/          # Next.js 14 web app
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── ui/           # Shared UI components (shadcn/ui + Tailwind)
│   └── types/        # Shared TypeScript types & validation
├── supabase/         # Database schema, migrations, edge functions
└── docs/             # Documentation
```

### Tech Stack

**Frontend:**
- **Web:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Mobile:** React Native (Expo)
- **State:** React Query (TanStack), Zustand for local state
- **Forms:** React Hook Form + Zod validation

**Backend:**
- **Database:** Supabase (Postgres + Auth + RLS + Storage)
- **API:** Supabase Edge Functions (Deno)
- **Auth:** Supabase Auth (Email/OTP + Social providers)

**Infrastructure:**
- **Monorepo:** Turborepo
- **Maps:** Mapbox or Google Maps (distance calculation)
- **Payments:** Stripe (stubbed for MVP)
- **Notifications:** Email (Resend) + Push (Expo)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (for local Supabase)
- Supabase CLI: `npm install -g supabase`

### 1. Clone and Install

```bash
git clone <repository-url>
cd rally-strings
npm install
```

### 2. Start Local Supabase

```bash
# Initialize and start Supabase locally
supabase start

# Note the output - you'll need the API URL and anon key
```

### 3. Environment Setup

Create `.env.local` in the root:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials from the `supabase start` output:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase_start
```

### 4. Database Setup

```bash
# Apply migrations to create tables
supabase db reset

# Generate TypeScript types
npm run db:generate

# Seed with demo data
npm run db:seed
```

### 5. Start Development

```bash
# Start all apps in development mode
npm run dev
```

This starts:
- **Web app:** http://localhost:3000
- **Supabase Studio:** http://localhost:54323

## 👥 Demo Accounts

The seed script creates test accounts:

**Stringers:**
- marco@example.com (password: password123) - Experienced, $25 base, 24h turnaround
- sarah@example.com (password: password123) - Premium, $30 base, 12h turnaround  
- david@example.com (password: password123) - Budget, $20 base, 48h turnaround

**Players:**
- alex@example.com (password: password123)
- emma@example.com (password: password123)

## 📱 Features Implemented

### ✅ Core MVP Features

- **User Authentication** - Supabase Auth with email/password and magic links
- **Role-based Access** - Players and Stringers with different permissions
- **Stringer Discovery** - Search by location, price, rating, rush availability
- **Request Creation** - Full form with racquet details, string preferences, logistics
- **Request Management** - Status workflow (Requested → Accepted → In Progress → Ready → Completed)
- **Dashboard** - View active and completed requests/jobs
- **Responsive Design** - Works on desktop and mobile browsers

### 🏗 Database Schema

```sql
-- Core tables with Row Level Security (RLS)
profiles          -- User profiles extending auth.users
stringer_settings -- Pricing, availability, service details
requests          -- Restring requests with full workflow
messages          -- In-request messaging
reviews           -- Post-completion ratings & comments
stringer_ratings  -- Aggregated rating view
```

**Key Features:**
- **Row Level Security (RLS)** for data isolation
- **Status validation** with proper state transitions
- **Location-based search** with distance calculations
- **Price calculation** including rush fees
- **Daily job limits** for stringers

### 🔧 API Endpoints (Supabase Edge Functions)

- `search-stringers` - Find stringers by location and filters
- `create-request` - Validate and create new requests
- `update-request-status` - Handle status transitions with validation

## 🎨 UI Components

Built with **shadcn/ui** and **Tailwind CSS**:

- `StringerCard` - Display stringer info with ratings and pricing
- `StatusBadge` - Color-coded status indicators
- `CreateRequestDialog` - Full request creation flow
- `Navigation` - Responsive navigation with user context

## 📝 Request Workflow

```
Requested → Accepted → In Progress → Ready → Completed
    ↓           ↓           ↓          ↓         ↓
   📝          ✅          🔧         📦        ⭐
 Player      Stringer    Stringer   Stringer  Player
 creates     accepts     working    finished  reviews
```

**Status Transitions:**
- **Requested** → Accepted (stringer), Canceled (player)
- **Accepted** → In Progress (stringer), Canceled (stringer)
- **In Progress** → Ready (stringer), Canceled (stringer)
- **Ready** → Completed (stringer)

## 🗂 Directory Structure

```
apps/web/
├── app/                 # Next.js App Router
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   └── page.tsx        # Discovery page
├── components/         # React components
│   ├── discover/       # Stringer discovery
│   ├── dashboard/      # Dashboard views
│   ├── requests/       # Request management
│   └── layout/         # Navigation, etc.
└── lib/                # Utilities and hooks

packages/ui/
├── components/         # Shared UI components
│   ├── ui/            # shadcn/ui base components
│   └── ...            # Custom components
└── lib/               # Utilities (formatting, etc.)

packages/types/
└── src/
    └── index.ts       # Shared TypeScript types & Zod schemas

supabase/
├── migrations/        # Database schema changes
├── functions/         # Edge functions (API)
└── seed.ts           # Demo data seeding
```

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

**Test Coverage:**
- Quote calculation logic
- Status transition validation
- RLS policy enforcement
- Happy path user flows

## 🚢 Deployment

### Supabase (Production)

1. Create a Supabase project at https://supabase.com
2. Run migrations: `supabase db push`
3. Deploy edge functions: `supabase functions deploy`
4. Update environment variables with production URLs

### Vercel (Web App)

```bash
npm run build
# Deploy to Vercel with environment variables
```

### Expo (Mobile App)

```bash
cd apps/mobile
expo build
# Follow Expo documentation for app store deployment
```

## 🔮 Future Enhancements

### Payment Integration
- Full Stripe integration with escrow
- Payment status tracking
- Dispute resolution

### Enhanced Features
- Real-time messaging with WebSockets
- Push notifications for status updates
- Advanced stringer search (equipment, specialties)
- Route optimization for pickup/delivery
- Multi-racquet requests
- Photo upload for racquet condition
- Calendar integration for scheduling

### Business Features
- Commission/fee structure
- Stringer verification system
- Insurance integration
- Analytics dashboard
- Referral program

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation:** Check this README and inline code comments
- **Issues:** Open a GitHub issue for bugs or feature requests
- **Discord:** Join our community for real-time help

---

**Made with ❤️ for the tennis community**
