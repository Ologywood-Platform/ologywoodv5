# Ologywood — System Architecture

**Last Updated:** March 5, 2026

This document describes the architecture of the Ologywood platform, including folder structure, data flow, module boundaries, and guidance for adding new features.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (React)                       │
│  Pages → Components → tRPC Client → HTTP                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (port 3000)
┌──────────────────────────▼──────────────────────────────────┐
│                     Express Server                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ OAuth    │  │ Stripe   │  │ OG Tags  │  │ Rate       │  │
│  │ Callback │  │ Webhook  │  │ Middleware│  │ Limiter    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              tRPC Router (18+ namespaces)             │   │
│  │  artist | booking | message | rider | events | ...   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Services (business logic layer)          │   │
│  │  email | payment | fan notification | pricing | ...  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Database Layer (db.ts + Drizzle ORM)     │   │
│  └──────────────────────┬───────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐  ┌────────────┐  ┌────────────┐
   │ TiDB       │  │ AWS S3     │  │ External   │
   │ (MySQL)    │  │ (CDN)      │  │ Services   │
   │ 41 tables  │  │ Images     │  │ Stripe     │
   │            │  │ Audio      │  │ SendGrid   │
   └────────────┘  └────────────┘  └────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | Single-page application |
| Routing | Wouter | Lightweight client-side routing |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with component library |
| State/Data | TanStack Query via tRPC | Type-safe API calls with caching |
| Backend | Express + tRPC | API server with type-safe procedures |
| Database | TiDB (MySQL-compatible) | Relational database via Drizzle ORM |
| Auth | JWT sessions + OAuth + Email/Password | Dual authentication system |
| Payments | Stripe | Checkout, Connect, Subscriptions, Webhooks |
| Email | SendGrid | Transactional emails and newsletters |
| Storage | AWS S3 | File uploads (release audio, images) |
| Build | Vite | Frontend bundling and dev server |

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| Server TypeScript files | 132 |
| Client TSX files | 178 |
| Client TS files | 49 |
| Page components | 54 |
| Shared components | 60 |
| UI primitives (shadcn) | 57 |
| Test files | 61 |
| Database tables | 41 |
| Frontend routes | 58 |
| Server code lines | ~36,900 |
| Client code lines | ~48,800 |
| Test code lines | ~12,800 |
| Tests passing | 1,527 |

---

## Folder Structure

### `client/` — React Frontend

```
client/src/
├── _core/              # Core hooks (useAuth, useTheme) and providers
├── components/         # Shared components (60 files)
│   └── ui/             # shadcn/ui primitives (57 files)
├── hooks/              # Custom React hooks (usePullToRefresh, etc.)
├── lib/                # tRPC client, utilities
├── pages/              # Route pages (54 files)
└── utils/              # SEO, formatting, helpers
```

**Rules for `client/`:**
- Pages go in `pages/` — one file per route, named in PascalCase
- All new pages MUST use `React.lazy()` in App.tsx
- All public pages MUST include `<SiteHeader />` and `<Footer />`
- Shared components go in `components/` — if used on 2+ pages, extract here
- UI primitives (shadcn) live in `components/ui/` — do not modify these directly
- All API calls go through `trpc` from `lib/trpc.ts` — never use `fetch()` directly
- Auth state comes from `useAuth()` hook — never read cookies directly

### `server/` — Node.js Backend

```
server/
├── _core/              # Server bootstrap (DO NOT add feature code here)
│   ├── index.ts        # Express app setup, middleware, server start
│   ├── trpc.ts         # tRPC context, procedures, router factory
│   ├── sdk.ts          # Session management, authenticateRequest
│   ├── env.ts          # Environment variable validation
│   ├── cookies.ts      # Cookie configuration
│   └── ...
├── routers/            # Dedicated tRPC router files (18 files)
│   ├── admin.ts        # Admin dashboard, payouts
│   ├── auth.ts         # Login, signup, forgot/reset password (12 endpoints)
│   ├── events.ts       # Event CRUD, discovery, RSVP (25 endpoints)
│   ├── follows.ts      # Follow/unfollow, suggested artists (13 endpoints)
│   ├── rider.ts        # Rider templates, builder (14 endpoints)
│   ├── riderContract.ts # Contract generation, signing, PDF (6 endpoints)
│   ├── release.ts      # Music releases, purchases, reviews (9 endpoints)
│   ├── pricing.ts      # Subscription plans, checkout (7 endpoints)
│   ├── payout.ts       # Artist payouts, earnings (7 endpoints)
│   ├── venue.ts        # Venue profiles, search, reviews (6 endpoints)
│   └── ...
├── routers.ts          # Main router — aggregates all namespaces + inline procedures
├── routes/             # Express REST routes (webhooks, downloads, sitemap)
├── services/           # Business logic services
├── utils/              # Rate limiters, helpers
├── db.ts               # All database query functions (single file)
├── stripe.ts           # Stripe API integration
├── email.ts            # Email sending functions
└── storage.ts          # S3 storage helpers (storagePut, storageGet)
```

**Rules for `server/`:**
- `_core/` is infrastructure only — never add feature logic here
- New tRPC procedures: create a dedicated router file in `routers/` and register in `routers.ts`
- Database queries: add functions to `db.ts` — all DB access goes through this file
- Never import from `client/` in server code
- Never hardcode port numbers

### `drizzle/` — Database

```
drizzle/
├── schema.ts           # All 41 table definitions (single file, 962 lines)
└── meta/               # Drizzle migration metadata
```

---

## Database Schema (41 Tables)

| Category | Tables |
|----------|--------|
| **Users & Auth** | users, userSubscriptions, passwordResetTokens |
| **Artist Profiles** | artistProfiles, verificationBadges, artistUpdates |
| **Venue Profiles** | venueProfiles |
| **Bookings** | bookings, bookingUsage, bookingTemplates, bookingReminders |
| **Contracts** | contracts, signatures, riderTemplates |
| **Messaging** | messages |
| **Reviews** | reviews, venueReviews, trackReviews |
| **Social** | follows, artistFollows, favorites, profileViews |
| **Events** | events, eventRecurrence, eventHistory, eventPhotos, savedEvents |
| **Music Releases** | artistReleases, releasePurchases |
| **Payments** | artistPayouts, stripeConnectAccounts, artistEarnings, invoices |
| **Email** | emailPreferences, emailLogs, subscriptions |
| **Content** | blogPosts |
| **Other** | availability, referrals, notificationPreferences, notifications |

---

## API Router Namespaces

| Namespace | Endpoints | Purpose |
|-----------|-----------|---------|
| auth | 12 | Login, signup, logout, forgot/reset password, session |
| events | 25 | Event CRUD, discovery, search, RSVP |
| main (routers.ts) | 47 | Artist, booking, message, notification, search |
| rider | 14 | Rider templates, builder, saved riders |
| follows | 13 | Follow/unfollow, followers, suggested artists |
| release | 9 | Music releases, purchases, track reviews |
| pricing | 7 | Subscription plans, checkout |
| payout | 7 | Artist payouts, earnings |
| emailPreferences | 6 | Email opt-in/out, unsubscribe |
| riderContract | 6 | Contract generation, signing, PDF |
| stripeConnect | 6 | Stripe Connect onboarding, status |
| venue | 6 | Venue profiles, search, reviews |
| artistUpdates | 4 | Artist news feed |
| blog | 4 | Blog posts, listing |
| emailTesting | 3 | Email service testing |
| admin | 2 | Admin dashboard, payouts |
| contact | 2 | Contact form submission |

---

## Data Flow

### Request Lifecycle

```
Browser → Express → [Middleware Stack] → tRPC Handler → Service → db.ts → TiDB
                                                                    ↓
Browser ← Express ← tRPC Response ← Service Result ← Query Result ←┘
```

### Authentication Flow

The platform supports two authentication methods:

1. **OAuth** — Google, Apple, or Email via external OAuth provider. Session created via JWT with openId.
2. **Email/Password** — Direct signup with bcrypt-hashed passwords. Email verification via SendGrid. Forgot password flow with secure token (1-hour expiry, rate-limited).

Session tokens are stored as `app_session_id` HttpOnly cookies with `Secure; SameSite=None`. The `useAuth()` hook calls `auth.me` on every page load to hydrate user state.

### Payment Flow

```
User → pricing.createCheckoutSession → Stripe Checkout → Webhook → Update DB
```

Stripe handles all payment UI. The platform creates checkout sessions and processes webhook events. No card data is stored locally. Stripe Connect enables artist payouts.

### Email Flow

```
Action (booking, review, etc.) → emailService.ts → Check Preferences → SendGrid API
```

All emails respect user preferences via `emailService.ts`. Every email includes an unsubscribe link. Branded templates match Ologywood styling.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single `db.ts` file | Centralized query control for optimization and error handling |
| Dedicated router files | Complex features get their own file; simple ones stay inline |
| S3 for all file storage | No local file storage in production; CDN-served assets |
| JWT session cookies | HttpOnly, Secure cookies prevent XSS token theft |
| COALESCE in upsertUser | Prevents OAuth session refresh from overwriting email/password data |
| Purchase-gated reviews | Only verified buyers can leave track reviews (authenticity) |
| Password strength indicator | Client-side scoring (length, variety, patterns) for UX feedback |

---

## Adding a New Feature

1. **Database:** Add table to `drizzle/schema.ts`, run `pnpm db:push`
2. **Queries:** Add query functions to `server/db.ts`
3. **Business Logic:** Create `server/services/myFeatureService.ts` if needed
4. **API:** Create `server/routers/myFeature.ts`, register in `routers.ts`
5. **Frontend Page:** Create `client/src/pages/MyFeature.tsx` with `<SiteHeader />` and `<Footer />`
6. **Route:** Add route to `client/src/App.tsx` using `React.lazy()`
7. **Tests:** Write vitest tests in `server/__tests__/`
8. **Todo:** Add items to `todo.md` and mark complete when done

---

## Off-Limits

- `server/_core/` — Infrastructure only. Do not add feature code.
- `client/src/components/ui/` — shadcn primitives. Do not modify.
- `drizzle/*.sql` — Generated migration files. Do not edit manually.
- `node_modules/` — Managed by pnpm. Do not modify.

---

## External Service Dependencies

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| TiDB (MySQL) | Primary database | `DATABASE_URL` env var |
| AWS S3 | File storage | `AWS_*` env vars |
| Stripe | Payments & subscriptions | `STRIPE_*` env vars |
| SendGrid | Email delivery | `SENDGRID_*` env vars |
| Manus OAuth | Authentication | `OAUTH_*` env vars |
