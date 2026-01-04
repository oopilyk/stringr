# Stringerly Web Application - Security & Quality Audit Report
**Date:** December 29, 2025
**Auditor:** Claude (Comprehensive Code Review)
**Application:** Stringerly Tennis Stringing Marketplace

---

## Executive Summary

This audit identified **30+ issues** across security, performance, and code quality categories. The application has a solid foundation but requires immediate attention to critical security vulnerabilities before production deployment.

**Risk Level:** 🔴 **HIGH RISK** - Not production-ready without fixes

---

## Critical Security Issues (Must Fix Before Production)

### 1. 🔴 Insecure Direct Object References (IDOR)
**Location:** `apps/web/app/my-profile/page.tsx:73-88`

**Issue:** Profile updates use client-provided user ID without server-side validation.

```typescript
// VULNERABLE CODE
const handleInlineFieldSave = async (fieldName: string, value: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ [fieldName]: value })
    .eq('id', profile.id)  // ❌ Client-provided ID
    .select()
}
```

**Fix Required:**
```typescript
// SECURE CODE
const handleInlineFieldSave = async (fieldName: string, value: string) => {
  // Get user ID from server-side session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({ [fieldName]: value })
    .eq('id', user.id)  // ✅ Server-validated ID
    .select()
}
```

**Impact:** Users could modify other users' profiles by manipulating the profile ID.

---

### 2. 🔴 Missing Input Validation
**Locations:** All form submissions throughout the app

**Issue:** No validation schemas, allowing malicious or malformed data into the database.

**Fix Required:**
```typescript
// Install zod if not already: npm install zod
import { z } from 'zod'

// Create validation schema
const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  bio: z.string().max(1000).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  // ... more fields
})

// Use in handler
const handleInlineFieldSave = async (fieldName: string, value: string) => {
  // Validate input
  const validated = ProfileUpdateSchema.pick({ [fieldName]: true }).parse({ [fieldName]: value })

  // Now safe to save
  await supabase.from('profiles').update(validated)...
}
```

---

### 3. 🔴 Insecure File Upload
**Location:** `apps/web/components/profile/avatar-upload.tsx:51-101`

**Issue:** Client-side only validation - file type can be spoofed.

**Current (Insecure):**
```typescript
// Client-side check only - easily bypassed
if (!file.type.startsWith('image/')) {
  setError('Please select an image file')
  return
}
```

**Fix Required:**
1. Add server-side validation via Supabase Storage policies
2. Implement actual image validation using sharp or similar
3. Scan for malware
4. Use Content-Security-Policy headers

---

### 4. 🔴 Hardcoded Demo Credentials
**Location:** `apps/web/app/auth/signin/page.tsx:314`

```typescript
<p className="text-xs text-gray-600 mb-1">
  Demo: marco@example.com / password123  {/* ❌ REMOVE THIS */}
</p>
```

**Fix:** Remove immediately. Never expose credentials in client code.

---

### 5. 🔴 Missing Rate Limiting
**Impact:** Vulnerable to brute force attacks, DoS, enumeration attacks

**Fix Required:**
```typescript
// Install: npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

// In login handler
const { success } = await ratelimit.limit(email)
if (!success) {
  return { error: 'Too many attempts. Please try again later.' }
}
```

---

## High Severity Issues

### 6. 🟠 Unsafe Autosave (Race Conditions)
**Location:** `apps/web/lib/hooks/use-onboarding-autosave.ts:62-114`

**Issue:** Using `upsert` can cause data loss in race conditions (multiple tabs).

**Fix:** Use optimistic locking with version numbers or timestamps.

---

### 7. 🟠 Missing Error Boundaries
**Impact:** App crashes on errors, poor UX, information disclosure

**Fix Required:**
```typescript
// Create apps/web/components/error-boundary.tsx
'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo)
    // Send to monitoring service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

### 8. 🟠 Open Redirect Vulnerability
**Location:** `apps/web/app/auth/callback/route.ts:33`

```typescript
// VULNERABLE
return NextResponse.redirect(requestUrl.origin)

// SECURE
const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000']
if (allowedOrigins.includes(requestUrl.origin)) {
  return NextResponse.redirect(requestUrl.origin)
}
return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL)
```

---

## Medium Severity Issues

### 9. 🟡 N+1 Query Problem
**Location:** `apps/web/app/my-profile/page.tsx:27-62`

**Current (Inefficient):**
```typescript
// Multiple sequential queries
const { data: settingsData } = await supabase
  .from('stringer_settings')
  .select('*')
  .eq('id', profile.id)
  .single()

const { data: reviewsData } = await supabase
  .from('reviews')
  .select('*')
  .eq('stringer_id', profile.id)
```

**Optimized:**
```typescript
// Single query with join
const { data, error } = await supabase
  .from('profiles')
  .select(`
    *,
    stringer_settings(*),
    reviews(*)
  `)
  .eq('id', profile.id)
  .single()
```

---

### 10. 🟡 Missing React.memo Optimizations
**Impact:** Unnecessary re-renders, poor performance on mobile

**Fix Required:**
```typescript
// Wrap expensive components
export const StringerCard = React.memo(function StringerCard({ stringer, onViewProfile }) {
  // ... component code
})

// Memoize callbacks
const handleViewProfile = useCallback((stringer: StringerSearchResult) => {
  if (!isAuthenticated) {
    setShowSignInPrompt(true)
    return
  }
  window.location.href = `/stringer/${stringer.id}`
}, [isAuthenticated])

// Memoize expensive calculations
const processedStringers = useMemo(() => {
  return stringers.map(s => ({
    ...s,
    distance_km: calculateDistance(...)
  }))
}, [stringers, searchParams.lat, searchParams.lng])
```

---

### 11. 🟡 Duplicate Code - Haversine Formula
**Locations:**
- `apps/web/components/discover/discover-page.tsx:17-32`
- `apps/web/components/layout/search-dropdown.tsx:16-31`

**Fix:** Extract to shared utility.

```typescript
// Create apps/web/lib/utils/distance.ts
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_KM = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}
```

---

### 12. 🟡 Magic Numbers Everywhere
**Issue:** Hardcoded values scattered throughout code

**Fix:** Create constants file.

```typescript
// Create apps/web/lib/constants.ts
export const DISTANCE = {
  KM_TO_MILES: 1.60934,
  MILES_TO_KM: 0.621371,
  DEFAULT_RADIUS_MILES: 125,
  DEFAULT_RADIUS_KM: 201.168,
  EARTH_RADIUS_KM: 6371,
} as const

export const PRICE = {
  CENTS_PER_DOLLAR: 100,
  MIN_PRICE_CENTS: 1000, // $10
  MAX_PRICE_CENTS: 10000, // $100
} as const

export const DEBOUNCE = {
  SEARCH_MS: 300,
  AUTOSAVE_MS: 2000,
} as const

export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const
```

---

## TypeScript Errors Summary

### Fixed ✅
- [x] `apps/web/app/auth/stringer-signup/page.tsx:92` - null/undefined handling
- [x] `apps/web/app/messages/ChatWindow.tsx` - implicit any types
- [x] `apps/web/app/messages/MessagesSidebar.tsx` - implicit any types
- [x] `apps/web/components/discover/discover-page.tsx` - implicit any in callbacks
- [x] `apps/web/components/stringer-onboarding/step2-background.tsx` - partial fixes

### Remaining to Fix 🔧
- [ ] `apps/web/components/stringer-onboarding/step3-equipment.tsx` - implicit any in map callbacks
- [ ] `apps/web/components/stringer-onboarding/step6-availability.tsx` - implicit any in map callbacks
- [ ] `apps/web/components/stringer-onboarding/step7-review.tsx` - implicit any in map callbacks
- [ ] `apps/web/components/stringer-onboarding/string-inventory-manager.tsx` - implicit any
- [ ] `apps/web/app/stringer/[id]/page.tsx` - implicit any
- [ ] `apps/web/components/profile/racket-gallery.tsx` - event handler types

---

## Implementation Priority

### Phase 1: Critical Security (1-2 days)
1. Fix IDOR vulnerability in profile updates
2. Remove hardcoded demo credentials
3. Add input validation with Zod schemas
4. Implement rate limiting on auth endpoints
5. Add server-side file upload validation

### Phase 2: High Priority (2-3 days)
6. Add error boundaries throughout app
7. Fix autosave race conditions
8. Fix open redirect vulnerability
9. Add proper error handling and logging
10. Implement CSRF protection

### Phase 3: Code Quality (3-4 days)
11. Fix all TypeScript errors
12. Extract duplicate Haversine formula
13. Create constants file for magic numbers
14. Optimize database queries (fix N+1)
15. Add React.memo optimizations

### Phase 4: Enhancement (1 week)
16. Add comprehensive error handling
17. Implement monitoring (Sentry)
18. Add performance monitoring
19. Create security documentation
20. Add accessibility features

---

## Recommended Tools & Libraries

### Security
- `zod` - Runtime type validation
- `@upstash/ratelimit` - Rate limiting
- `helmet` - Security headers
- `sharp` - Image validation

### Monitoring
- `@sentry/nextjs` - Error tracking
- `@vercel/analytics` - Performance monitoring

### Testing
- `vitest` - Unit testing
- `@testing-library/react` - Component testing
- `playwright` - E2E testing

---

## Security Checklist for Production

- [ ] All `.env` files in `.gitignore`
- [ ] All secrets rotated if ever committed
- [ ] RLS policies enabled and tested on all tables
- [ ] Input validation on all forms
- [ ] Rate limiting on auth endpoints
- [ ] File upload validation (server-side)
- [ ] Error boundaries implemented
- [ ] CSRF protection enabled
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Database backups configured
- [ ] Monitoring and alerting setup
- [ ] Penetration testing completed

---

## Conclusion

The Stringerly application has good architectural foundations but requires immediate security hardening before production deployment. The most critical issues are around authentication security, input validation, and secure database access patterns.

**Estimated effort to make production-ready:** 2-3 weeks

**Current risk assessment:** HIGH - Do not deploy to production without addressing Critical and High severity issues.
