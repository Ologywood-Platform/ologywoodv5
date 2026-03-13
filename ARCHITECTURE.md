# Ologywood — System Architecture

**Last Updated:** March 13, 2026

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
│  │              tRPC Router (18 namespaces)              │   │
│  │  admin | auth | blog | booking | dispute | events    │   │
│  │  follows | notifications | payout | pricing | rider  │   │
│  │  riderContract | release | stripeConnect | venue ... │   │
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
   │ AWS RDS    │  │ AWS S3     │  │ External   │
   │ (MySQL)    │  │ (CDN)      │  │ Services   │
   │ 61 tables  │  │ Images     │  │ Stripe     │
   │            │  │ Audio      │  │ SendGrid   │
   └────────────┘  └────────────┘  └────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | Single-page application |
| Routing | Wouter | Lightweight client-side routing |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with component library |
| State/Data | TanStack Query via tRPC | Type-safe API calls with caching |
| Backend | Express + tRPC | API server with type-safe procedures |
| Database | AWS RDS MySQL + Drizzle ORM | Relational database |
| Auth | JWT sessions + OAuth + Email/Password | Dual authentication system |
| Payments | Stripe | Checkout, Connect, Subscriptions, Webhooks |
| Email | SendGrid | Transactional emails and newsletters |
| Storage | AWS S3 | File uploads (release audio, images) |
| Build | Vite 7 | Frontend bundling and dev server |

---

## Codebase Statistics

| Metric | Count |
|--------|-------|
| Page components | 62 |
| Shared components | 66 |
| UI primitives (shadcn) | 57 |
| tRPC router files | 18 |
| Test files | 84 |
| Database tables | 61 |
| Tests passing | 1,864 |

---

## Folder Structure

### `client/` — React Frontend

```
client/src/
├── _core/              # Core hooks (useAuth, useTheme) and providers
├── components/         # Shared components (66 files)
│   └── ui/             # shadcn/ui primitives (57 files)
├── hooks/              # Custom React hooks (usePullToRefresh, etc.)
├── lib/                # tRPC client, utilities
├── pages/              # Route pages (62 files)
├── types/              # TypeScript type definitions
└── utils/              # SEO, formatting, helpers
```

**Rules for `client/`:**

All pages reside in `pages/` with one file per route, named in PascalCase. Every new page must use `React.lazy()` in App.tsx for code splitting. Public-facing pages must include `<SiteHeader />` and `<Footer />` components. Shared components belong in `components/` when used on two or more pages, while shadcn/ui primitives in `components/ui/` should never be modified directly. All API calls must go through the `trpc` client from `lib/trpc.ts` — never use `fetch()` directly. Auth state is accessed exclusively through the `useAuth()` hook.

### `server/` — Node.js Backend

```
server/
├── _core/              # Server bootstrap (DO NOT add feature code here)
│   ├── index.ts        # Express app setup, middleware, server start
│   ├── trpc.ts         # tRPC context, procedures, router factory
│   ├── sdk.ts          # Session management, authenticateRequest
│   ├── env.ts          # Environment variable validation
│   ├── cookies.ts      # Cookie configuration
│   └── context.ts      # Request context creation
├── routers/            # Dedicated tRPC router files (18 files)
│   ├── admin.ts        # Admin dashboard, user management, audit log
│   ├── auth.ts         # Login, signup, forgot/reset password
│   ├── blog.ts         # Blog posts (admin + blogger access)
│   ├── contact.ts      # Contact form
│   ├── dispute.ts      # Booking disputes
│   ├── emailPreferences.ts  # Email opt-in/out
│   ├── emailTesting.ts # Email service testing
│   ├── events.ts       # Event CRUD, discovery, RSVP
│   ├── follows.ts      # Follow/unfollow, suggested artists
│   ├── notifications.ts # User notifications
│   ├── payout.ts       # Artist payouts, earnings
│   ├── pricing.ts      # Subscription plans, checkout
│   ├── release.ts      # Music releases, purchases
│   ├── rider.ts        # Rider templates, builder
│   ├── riderContract.ts # Contract generation, signing, PDF
│   ├── stripeConnect.ts # Stripe Connect onboarding
│   ├── venue.ts        # Venue profiles, search, reviews
│   └── artistUpdates.ts # Artist news feed
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

The `_core/` directory is infrastructure only — never add feature logic here. New tRPC procedures should be created as dedicated router files in `routers/` and registered in `routers.ts`. All database queries are centralized in `db.ts` — all DB access goes through this single file. Server code must never import from `client/`, and port numbers must never be hardcoded.

### `drizzle/` — Database

```
drizzle/
├── schema.ts              # Main table definitions (54 tables)
├── schema-certificates.ts # Certificate and signing tables
├── schema-support.ts      # Support ticket tables
└── meta/                  # Drizzle migration metadata
```

---

## Role-Based Access Control

The platform implements six user roles with middleware-enforced access control on the backend.

| Role | Backend Middleware | Access Level |
|------|-------------------|-------------|
| Owner | `checkIsOwner()` (email-based) | Full platform access, cannot be demoted |
| Admin | `adminOnly` middleware | Full admin dashboard, user management, all features |
| Blogger | `blogAccess` middleware | Blog post CRUD only, no admin dashboard |
| Artist | `authed` + role check | Artist dashboard, profile, bookings, riders, releases |
| Venue | `authed` + role check | Venue dashboard, booking requests, payments |
| User | `authed` middleware | Browse, follow, client bookings, purchase music |

The owner is identified by email address (`garychisolm30@gmail.com`) with fallbacks to `OWNER_OPEN_ID` and `OWNER_NAME` environment variables. All role changes are recorded in the `role_change_audit_log` table with full accountability (who changed whom, when, previous and new roles).

---

## Database Schema (61 Tables)

| Category | Tables |
|----------|--------|
| **Users & Auth** | users, password_reset_tokens, email_preferences, notification_preferences, notifications, user_subscriptions, unsubscribe_feedback |
| **Artist Profiles** | artist_profiles, verification_badges, artist_updates |
| **Venue Profiles** | venue_profiles |
| **Bookings** | bookings, booking_usage, booking_templates, booking_reminders, booking_disputes |
| **Contracts** | contracts, signatures, rider_templates, contract_reminders, contract_signing_sessions, contract_verification_requests |
| **Messaging** | messages |
| **Reviews** | reviews, venue_reviews, track_reviews |
| **Social** | follows, artist_follows, favorites, profile_views |
| **Events** | events, event_recurrence, event_history, event_photos, saved_events |
| **Music Releases** | artist_releases, release_purchases |
| **Payments** | artist_payouts, stripe_connect_accounts, artist_earnings, invoices, subscriptions |
| **Email** | email_logs |
| **Content** | blog_posts |
| **Certificates** | certificate_audit_trail, signature_certificates |
| **Support** | help_articles, support_tickets, support_metrics, ticket_assignments, ticket_responses |
| **Admin** | role_change_audit_log |
| **Other** | availability, referrals |

---

## Data Flow

### Request Lifecycle

```
Browser → Express → [Middleware Stack] → tRPC Handler → Service → db.ts → MySQL
                                                                    ↓
Browser ← Express ← tRPC Response ← Service Result ← Query Result ←┘
```

### Authentication Flow

The platform supports two authentication methods. OAuth authentication works via Google, Apple, or Email through an external OAuth provider, creating a session via JWT with an openId. Email/Password authentication provides direct signup with bcrypt-hashed passwords, email verification via SendGrid, and a forgot-password flow with secure tokens (1-hour expiry, rate-limited).

Session tokens are stored as `app_session_id` HttpOnly cookies with `Secure; SameSite=None`. The `useAuth()` hook calls `auth.me` on every page load to hydrate user state.

### Payment Flow

```
User → pricing.createCheckoutSession → Stripe Checkout → Webhook → Update DB
```

Stripe handles all payment UI. The platform creates checkout sessions and processes webhook events. No card data is stored locally. Stripe Connect enables artist payouts with bank account linking.

### Email Flow

```
Action (booking, review, role change, etc.) → emailService.ts → Check Preferences → SendGrid API
```

All emails respect user preferences via `emailService.ts`. Every email includes an unsubscribe link. Branded templates match Ologywood styling with the platform logo and colors.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single `db.ts` file | Centralized query control for optimization and error handling |
| Dedicated router files | Complex features get their own file; simple ones stay inline |
| S3 for all file storage | No local file storage in production; CDN-served assets |
| JWT session cookies | HttpOnly, Secure cookies prevent XSS token theft |
| Email-based owner identification | Reliable across environments without env var dependency |
| Role change audit log | Full accountability for all role promotions/demotions |
| Blog access middleware | Bloggers get blog CRUD without admin dashboard exposure |
| Purchase-gated reviews | Only verified buyers can leave track reviews (authenticity) |

---

## Adding a New Feature

1. **Database:** Add table to `drizzle/schema.ts`, run `pnpm db:push`
2. **Queries:** Add query functions to `server/db.ts`
3. **Business Logic:** Create `server/services/myFeatureService.ts` if needed
4. **API:** Create `server/routers/myFeature.ts`, register in `routers.ts`
5. **Frontend Page:** Create `client/src/pages/MyFeature.tsx` with `<SiteHeader />` and `<Footer />`
6. **Route:** Add route to `client/src/App.tsx` using `React.lazy()`
7. **Tests:** Write vitest tests in `server/`
8. **Todo:** Add items to `todo.md` and mark complete when done

---

## Off-Limits

These directories contain infrastructure or generated code and should not be modified for feature work:

- `server/_core/` — Infrastructure only. Do not add feature code.
- `client/src/components/ui/` — shadcn primitives. Do not modify.
- `drizzle/*.sql` — Generated migration files. Do not edit manually.
- `node_modules/` — Managed by pnpm. Do not modify.

---

## External Service Dependencies

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| AWS RDS (MySQL) | Primary database | `DATABASE_URL` env var |
| AWS S3 | File storage | `AWS_*` env vars |
| Stripe | Payments & subscriptions | `STRIPE_*` env vars |
| SendGrid | Email delivery | `SENDGRID_*` env vars |
| Manus OAuth | Authentication | `OAUTH_*` env vars |
