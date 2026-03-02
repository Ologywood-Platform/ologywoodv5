# Ologywood — System Architecture

**Last Updated:** February 28, 2026

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
│  │              tRPC Router (30 namespaces)              │   │
│  │  artist | booking | message | rider | events | ...   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Services (80+ business logic)            │   │
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
   │ MySQL 8.0  │  │ (CDN)      │  │ Services   │
   │ 36 tables  │  │ Images     │  │ Stripe     │
   │            │  │ Files      │  │ SendGrid   │
   └────────────┘  └────────────┘  └────────────┘
```

---

## Folder Structure

### `client/` — React Frontend

```
client/
├── src/
│   ├── pages/              # 48 page components (lazy-loaded via React.lazy)
│   ├── components/         # Reusable components
│   │   ├── _deprecated/    # 138 orphaned components (excluded from build & TS)
│   │   ├── __tests__/      # Component-level tests
│   │   ├── ui/             # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   │   └── *.tsx           # Feature components (SiteHeader, FollowButton, etc.)
│   ├── _core/
│   │   └── hooks/
│   │       └── useAuth.ts  # Authentication hook
│   ├── lib/
│   │   ├── trpc.ts         # tRPC client configuration
│   │   ├── utils.ts        # Tailwind merge utilities
│   │   ├── formValidation.ts
│   │   ├── errorHandler.ts
│   │   └── ...             # Other utilities
│   └── App.tsx             # Route definitions and app shell
└── index.html              # Entry point with PWA meta tags
```

**Rules for `client/`:**
- Pages go in `pages/` — one file per route, named in PascalCase
- **All new pages MUST use `React.lazy()` in App.tsx** — only Home, Browse, and ArtistProfile are eagerly loaded
- Shared components go in `components/` — if used on 2+ pages, extract here
- **Never import from `components/_deprecated/`** — these are archived orphaned components
- UI primitives (shadcn) live in `components/ui/` — do not modify these directly
- All API calls go through `trpc` from `lib/trpc.ts` — never use `fetch()` directly for tRPC endpoints
- Auth state comes from `useAuth()` hook — never read cookies directly

### `server/` — Node.js Backend

```
server/
├── _core/                  # Server bootstrap (DO NOT add feature code here)
│   ├── index.ts            # Express app setup, middleware registration, server start
│   ├── trpc.ts             # tRPC context, procedures, router factory
│   ├── oauth.ts            # OAuth configuration and handlers
│   ├── vite.ts             # Vite dev server and production static serving
│   ├── env.ts              # Environment variable validation
│   ├── logger.ts           # Logging utility
│   └── ...                 # Other core utilities
├── routers/                # Dedicated tRPC router files (13 files)
│   ├── admin.ts
│   ├── artist.ts           # (Note: most artist procedures are inline in routers.ts)
│   ├── auth.ts
│   ├── events.ts
│   ├── follows.ts
│   ├── rider.ts
│   ├── riderContract.ts
│   ├── venue.ts
│   └── ...
├── routers.ts              # Main router — aggregates 30 namespaces
│                           # Contains inline procedures for artist, booking,
│                           # message, review, subscription, favorite, etc.
├── routes/                 # Express REST routes (non-tRPC)
│   ├── events.ts           # REST API for events (CRUD)
│   ├── emailRoutes.ts      # Email testing endpoints
│   ├── sitemapRoutes.ts    # Dynamic sitemap.xml and robots.txt
│   └── ...
├── services/               # Business logic (80+ files)
│   ├── emailService.ts     # Email sending with preference checks
│   ├── fanNotificationService.ts
│   ├── pricingTierService.ts
│   ├── riderContractTemplate.ts  # Rider template definitions and HTML generation
│   ├── riderTemplateService.ts   # Rider CRUD operations
│   ├── stripePaymentService.ts
│   └── ...
├── middleware/              # Express middleware
│   ├── ogTags.ts           # Server-side OG meta tag injection for crawlers
│   ├── rateLimiter.ts      # Rate limiting configuration
│   ├── securityHeaders.ts  # Security headers
│   └── ...
├── handlers/
│   └── imageUploadHandler.ts
├── templates/              # Email and contract templates
├── db.ts                   # All database query functions
├── stripe.ts               # Stripe API integration
├── email.ts                # Email sending functions
└── storage.ts              # S3 storage helpers (storagePut, storageGet)
```

**Rules for `server/`:**
- `_core/` is infrastructure only — never add feature logic here
- New tRPC procedures: add to an existing router in `routers/` or create a new file and register it in `routers.ts`
- New business logic: create a service file in `services/`
- Database queries: add functions to `db.ts` — all DB access goes through this file
- Express routes (non-tRPC): add to `routes/` and register in `_core/index.ts`
- Never import from `client/` in server code

### `drizzle/` — Database

```
drizzle/
├── schema.ts               # All 36 table definitions (single file)
├── 0000_*.sql              # Migration files (53 total)
├── ...
└── meta/                   # Drizzle migration metadata
```

**Rules for `drizzle/`:**
- All tables are defined in `schema.ts` — one file, no splitting
- After editing schema, run `pnpm db:push` to generate and apply migrations
- Never edit migration SQL files manually
- Use `mysqlTable()` with explicit table names matching snake_case convention

---

## Data Flow

### Request Lifecycle

```
Browser → Express → [Middleware Stack] → tRPC Handler → Service → db.ts → MySQL
                                                                    ↓
Browser ← Express ← tRPC Response ← Service Result ← Query Result ←┘
```

**Middleware stack order (in `_core/index.ts`):**
1. Stripe webhook raw body parser (before JSON parser)
2. JSON body parser
3. Rate limiters (OAuth, API, public)
4. Sitemap/robots.txt routes
5. Email routes
6. Event REST routes
7. tRPC API handler
8. OG tag middleware (for social media crawlers)
9. Vite dev server / static file serving (with SPA fallback)
10. 404 handler
11. Global error handler

### Authentication Flow

```
User → OAuth Portal → Callback → Session Cookie Set → useAuth() → Protected Routes
```

The session cookie is HttpOnly, Secure, SameSite=None. The `useAuth()` hook calls `auth.me` to get the current user on every page load.

### Payment Flow

```
User → pricing.createCheckoutSession → Stripe Checkout → Webhook → Update DB
```

Stripe handles all payment UI. The platform only creates checkout sessions and processes webhook events. No card data is stored locally.

### Email Flow

```
Action (booking, review, etc.) → emailService.ts → Check Preferences → SendGrid API
```

All emails respect user preferences via `emailService.ts`. The service checks `email_preferences` table before sending. Every email includes an unsubscribe link.

---

## Key Design Decisions

### Single `routers.ts` File

Most tRPC procedures live inline in `routers.ts` rather than in separate files. This was a pragmatic choice during rapid development. Complex features (events, follows, rider, admin) have dedicated files in `routers/`. When adding new features, prefer creating a dedicated router file.

### Single `db.ts` File

All database queries are centralized in `db.ts`. This provides a single point of control for query optimization, caching, and error handling. When adding new queries, add them here.

### Services Layer

Business logic that spans multiple concerns (email + DB, Stripe + DB, etc.) lives in `services/`. Services are imported by routers and routes. Services should never import from routers.

### S3 for All File Storage

All uploaded files (profile photos, event photos, gallery images) are stored in S3 and served via CDN URLs. Local file storage is not used. Use `storagePut()` and `storageGet()` from `server/storage.ts`.

---

## Adding a New Feature

1. **Database:** Add table to `drizzle/schema.ts`, run `pnpm db:push`
2. **Queries:** Add query functions to `server/db.ts`
3. **Business Logic:** Create `server/services/myFeatureService.ts` if needed
4. **API:** Create `server/routers/myFeature.ts` with tRPC procedures, register in `routers.ts`
5. **Frontend Page:** Create `client/src/pages/MyFeature.tsx`
6. **Route:** Add route to `client/src/App.tsx`
7. **Tests:** Write vitest tests in the same directory as the feature
8. **Todo:** Add items to `todo.md` and mark complete when done

---

## Off-Limits

- `server/_core/` — Infrastructure only. Do not add feature code.
- `client/src/components/ui/` — shadcn primitives. Do not modify.
- `client/src/components/_deprecated/` — Archived orphaned components. Do not import.
- `drizzle/*.sql` — Generated migration files. Do not edit manually.
- `node_modules/` — Managed by pnpm. Do not modify.

## Performance Optimizations

| Optimization | Before | After | Impact |
|---|---|---|---|
| React.lazy() code splitting | 3,402 KB single bundle | 1,001 KB initial + lazy chunks | 70% smaller initial load |
| Vendor chunk splitting | All in one bundle | react (30 KB), ui (80 KB), pdf (983 KB) | Better caching |
| Orphaned component cleanup | 138 unused components in build | Moved to _deprecated, excluded from TS | Faster TS checks |
| Database indexes | Missing on 5 tables | Composite indexes on all FK/query columns | Faster queries |

---

## External Service Dependencies

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| AWS RDS MySQL | Primary database | `DATABASE_URL` env var |
| AWS S3 | File storage | `AWS_*` env vars |
| Stripe | Payments & subscriptions | `STRIPE_*` env vars |
| SendGrid | Email delivery | `SENDGRID_*` env vars |
| Manus OAuth | Authentication | `OAUTH_*` env vars |
