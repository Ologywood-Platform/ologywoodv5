# Ologywood — Artist Booking Platform

**Status:** Production  
**Last Updated:** March 13, 2026  
**Domain:** [www.ologywood.com](https://www.ologywood.com)  
**Mirror:** [ologywood-mp6flm6c.manus.space](https://ologywood-mp6flm6c.manus.space)

Ologywood is a subscription-based booking platform connecting performing artists with venues. The platform provides an end-to-end booking experience: artist discovery, booking requests, rider contract management with e-signatures, two-phase Stripe payments (deposit + remaining balance), in-platform messaging, fan engagement tools, music release sales, blog content management, dispute resolution, and automated email workflows.

---

## Platform Metrics (March 13, 2026)

| Metric | Count |
|--------|-------|
| Database tables | 61 |
| Client pages | 62 |
| UI components (custom + shadcn) | 123 |
| Active tRPC router files | 18 |
| Service files | 91+ |
| Vitest tests | 1,864 passing (84 files) |
| TypeScript errors | 0 |

---

## User Roles

The platform supports six distinct user roles, each with specific access levels and capabilities. Admins can change any user's role via the Change Role dropdown in the Admin Dashboard, and all role changes are recorded in the Audit Log.

| Role | Description | Dashboard |
|------|-------------|-----------|
| **Owner** | Platform owner (garychisolm30@gmail.com). Full admin access, cannot be demoted. | `/admin` |
| **Admin** | Full platform management: users, bookings, payouts, disputes, blog, analytics. | `/admin` |
| **Blogger** | Blog-only access: create, edit, publish, and delete blog posts. No admin features. | `/blogger-dashboard` |
| **Artist** | Performing artists: manage profile, bookings, riders, releases, earnings, events. | `/dashboard` |
| **Venue** | Event venues: browse artists, create bookings, manage payments and invoices. | `/venue-dashboard` |
| **User** | Default role (fan/client): browse, follow artists, book artists for private events, purchase music. | — |

---

## Core User Flows

### 1. Artist Onboarding and Profile

Artists sign up via OAuth or email/password, select the "Artist" role, and complete onboarding with profile details (name, genre, bio, fee range, location). They can upload photos to S3, set availability dates, and build rider templates.

**Pages:** `/get-started` → `/onboarding/artist` → `/dashboard` → `/profile/edit`

### 2. Venue Onboarding and Discovery

Venues sign up, select the "Venue" role, complete onboarding, then browse and search artists by genre, location, and fee range. They can favorite artists and view detailed profiles.

**Pages:** `/get-started` → `/onboarding/venue` → `/venue-dashboard` → `/browse` → `/artist/:id`

### 3. Booking Flow (End-to-End)

1. Venue creates a booking request from an artist's profile (`/booking/create`)
2. Artist receives the request on their dashboard and accepts/declines
3. Artist sends their rider template via the messaging thread
4. Venue reviews the rider (via "View Rider" shortcut on dashboard or in Messages)
5. Both parties sign the rider contract with e-signatures
6. Venue pays the 50% deposit via Stripe Checkout
7. Booking status advances to "Deposit Paid"
8. Venue pays the remaining 50% balance
9. Booking status advances to "Fully Paid" / "Completed"
10. Both parties can leave reviews

Payment verification uses both Stripe webhooks and a client-side `verifyPayment` fallback to ensure booking status always updates after payment.

### 4. Rider Contract Flow

Artists create rider templates from 4 pre-built types (Solo Artist, Band, DJ, Speaker) covering technical requirements, hospitality, stage setup, and financial terms. Riders are sent as rich messages within booking threads and can be viewed, signed with e-signatures, and exported as PDF.

**Pages:** `/rider-builder` → `/rider-templates` → `/saved-riders` → (sent via Messages)

### 5. Fan Engagement

Users can follow artists with email consent. Artists on paid tiers can send email blasts to their followers. The system is CAN-SPAM compliant with unsubscribe links and double opt-in.

**Pages:** `/following` → `/artist/:id` (Follow button) → `/unsubscribe`

### 6. Music Releases

Artists can upload and sell music releases. Users can purchase, stream, and review tracks. Purchase-gated reviews ensure only verified buyers can leave reviews.

**Pages:** `/sell-music` → `/release-manager` → `/my-purchases`

### 7. Dispute Resolution

Either party can file a dispute on a booking. Admins review disputes, add notes, and resolve them through the Admin Dashboard Disputes tab.

**Pages:** `/my-disputes` → Admin Dashboard → Disputes tab

---

## Features by Role

### Artist Features

| Feature | Description |
|---------|-------------|
| Profile Management | Photos (S3 CDN), bio, genre tags, fee ranges, location |
| Rider Builder | 4 pre-built templates with technical, hospitality, stage, payment sections |
| E-Signatures | Sign rider contracts with draw or type signature |
| Booking Management | Accept, decline, negotiate booking requests with real-time status |
| Messaging | Direct in-platform messaging with venues per booking thread |
| Earnings Dashboard | Track completed bookings and earnings |
| Availability Calendar | Set and display performance availability by date |
| Fan System | Followers with email consent, tiered access (free: names, paid: emails + CSV) |
| Send Updates | Email blast tool for paid-tier artists to notify fans |
| Subscription Management | View plan, upgrade, cancel, reactivate from dashboard |
| Events | Create and manage events with photos, recurrence, history |
| Release Manager | Upload and manage music releases |
| Stripe Connect | Link bank account to receive payouts from venue payments |
| Tax Reporting | View earnings for tax purposes |

### Venue Features

| Feature | Description |
|---------|-------------|
| Venue Profile | Organization profiles with contact info, location, venue type |
| Artist Discovery | Browse/search artists by genre, location, fee range with autocomplete |
| Booking Requests | Create bookings with event details, budget, rider attachment |
| Rider Viewing | View Full Rider button on dashboard + Messages, modal display |
| Two-Phase Payments | Pay 50% deposit then remaining balance via Stripe Checkout |
| Invoice Dashboard | Track invoices and payment history with real booking data |
| Reviews | Leave and respond to reviews with 1-5 star ratings |
| Messaging | Communicate directly with artists about event details |
| Favorites | Save favorite artists for quick access |

### Blogger Features

| Feature | Description |
|---------|-------------|
| Blog Dashboard | Dedicated dashboard at `/blogger-dashboard` with blog management |
| Post Management | Create, edit, publish, and delete blog posts with cover images |
| Content Tools | Rich text editing, draft/publish workflow |

### Admin Features

| Feature | Description |
|---------|-------------|
| Admin Dashboard | System health, user count, booking stats, financial overview |
| User Management | View all users, change roles via dropdown, search/filter |
| Role Change Audit Log | Track who changed whose role, when, with full accountability |
| Booking Management | View and manage all bookings platform-wide |
| Payout Processing | Review and process artist payouts |
| Dispute Resolution | Review, add notes, and resolve booking disputes |
| Blog Management | Create, edit, publish, delete blog posts |
| Release Management | View all music releases |
| Feedback | View unsubscribe feedback |

### Platform / Shared

| Feature | Description |
|---------|-------------|
| Dual Authentication | OAuth (Manus) + Email/Password with email verification |
| Stripe Payments | Subscriptions, deposit/balance payments, Connect, webhooks |
| Email Notifications | SendGrid with 15+ email types (booking, payment, review, role change, contract) |
| Dark Mode | Full dark mode toggle with localStorage persistence |
| PWA | Installable with service worker, offline support, install prompt |
| Mobile-First | Responsive layouts, mobile nav, pull-to-refresh, sticky bars |
| SEO | OG tags, JSON-LD, canonical URLs, sitemap, robots.txt |
| Cookie Consent | GDPR-compliant cookie notice |
| Contact Form | Public contact form with email delivery |

---

## Technical Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TS 5.9 |
| Styling | Tailwind CSS + shadcn/ui | Tailwind 4.x |
| Backend | Node.js + Express + tRPC | Express 4, tRPC 11 |
| Database | AWS RDS MySQL + Drizzle ORM | MySQL 8.0, Drizzle 0.44 |
| Authentication | Manus OAuth + JWT + Email/Password | — |
| Payments | Stripe (Checkout + Connect + Webhooks) | 20.x |
| Email | SendGrid | v3 API |
| Storage | AWS S3 (CDN URLs) | — |
| PDF Generation | PDFKit | 0.17 |
| Testing | Vitest | 2.x |
| Hosting | Manus Platform | — |

---

## Project Structure

```
ologywood/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/             # 62 page components
│   │   ├── components/        # 66 custom + 57 shadcn/ui components
│   │   ├── _core/hooks/       # Auth hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── lib/               # Utilities (trpc, validation, calendar)
│   └── public/                # Static assets, manifest, service worker
├── server/                     # Express + tRPC backend
│   ├── routers/               # 18 active tRPC router files
│   ├── routers.ts             # Main router aggregation + inline routes
│   ├── services/              # Business logic services
│   ├── webhooks/              # Stripe webhook handler
│   ├── db.ts                  # Database queries (Drizzle)
│   ├── email.ts               # Email templates (SendGrid)
│   ├── stripe.ts              # Stripe client initialization
│   └── storage.ts             # S3 storage helpers
├── drizzle/                    # Database schema and migrations
│   ├── schema.ts              # Main table definitions
│   ├── schema-certificates.ts # Certificate and signing tables
│   ├── schema-support.ts      # Support ticket tables
│   └── migrations/            # SQL migration files
├── docs/                       # Developer documentation
│   ├── API.md                 # API reference
│   ├── DEVELOPER_GUIDE.md     # Setup and development guide
│   ├── CI_CD_DEPLOYMENT.md    # Deployment guide
│   └── DISASTER_RECOVERY.md   # Recovery procedures
├── README.md                   # This file
├── ARCHITECTURE.md             # System architecture overview
├── CHANGELOG.md                # Version history
├── ROADMAP.md                  # Feature roadmap and priorities
└── todo.md                     # Development task tracker
```

---

## Database Schema (61 Tables)

**User Management:** `users`, `password_reset_tokens`, `email_preferences`, `notification_preferences`, `notifications`, `user_subscriptions`, `unsubscribe_feedback`

**Artist Features:** `artist_profiles`, `artist_earnings`, `artist_payouts`, `artist_updates`, `artist_releases`, `release_purchases`, `rider_templates`, `availability`, `follows`, `artist_follows`, `profile_views`, `verification_badges`

**Booking System:** `bookings`, `booking_templates`, `booking_reminders`, `booking_usage`, `booking_disputes`, `messages`, `contracts`, `signatures`

**Venue Management:** `venue_profiles`, `venue_reviews`, `invoices`, `favorites`

**Events:** `events`, `event_history`, `event_photos`, `event_recurrence`, `saved_events`

**Payments & Subscriptions:** `stripe_connect_accounts`, `subscriptions`

**Content & Blog:** `blog_posts`, `reviews`, `track_reviews`, `referrals`, `email_logs`

**Contracts & Certificates:** `certificate_audit_trail`, `contract_reminders`, `contract_signing_sessions`, `contract_verification_requests`, `signature_certificates`, `ryder_contracts`, `ryder_contract_versions`, `ryder_contract_comments`

**Support:** `help_articles`, `support_tickets`, `support_metrics`, `ticket_assignments`, `ticket_responses`

**Admin:** `role_change_audit_log`, `api_keys`, `webhook_endpoints`, `tax_reports`

---

## Environment Variables

All secrets are managed via Manus Settings → Secrets:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | JWT token signing |
| `STRIPE_SECRET_KEY` | Stripe server-side API key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification |
| `SENDGRID_API_KEY` | Email delivery |
| `SENDGRID_FROM_EMAIL` | Sender email address |
| `AWS_ACCESS_KEY_ID` | S3 storage access |
| `AWS_SECRET_ACCESS_KEY` | S3 storage secret |
| `AWS_REGION` | S3 region |
| `OPENAI_API_KEY` | AI features (recommendations) |

---

## Scripts

```bash
pnpm dev          # Start development server (port 3000)
pnpm build        # Production build (Vite + esbuild)
pnpm start        # Run production server
pnpm check        # TypeScript type checking
pnpm test         # Run vitest test suite
pnpm db:push      # Generate and apply database migrations
```

---

## Testing

**Test card:** `4242 4242 4242 4242` (any future expiry, any CVC)

```bash
npx vitest run                        # Run all tests
npx vitest run --reporter=verbose     # Verbose output
npx vitest run server/routers         # Specific directory
```

**Current:** 1,864 tests passing across 84 test files, 0 TypeScript errors.

---

## Deployment

The platform is hosted on Manus with automatic deployments:

1. Make changes and verify with `npx vitest run`
2. Save a checkpoint via the Manus tools
3. Click **Publish** in the Management UI
4. Live at [www.ologywood.com](https://www.ologywood.com)

For Stripe live payments: complete KYC verification in Stripe Dashboard, then enter live keys in Settings → Payment.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Platform overview and quick reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and data flow |
| [CHANGELOG.md](./CHANGELOG.md) | Versioned release history |
| [ROADMAP.md](./ROADMAP.md) | Feature roadmap with priorities |
| [docs/API.md](./docs/API.md) | API endpoint documentation |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Developer setup and coding standards |
| [docs/CI_CD_DEPLOYMENT.md](./docs/CI_CD_DEPLOYMENT.md) | Deployment and CI/CD procedures |
| [docs/DISASTER_RECOVERY.md](./docs/DISASTER_RECOVERY.md) | Backup and recovery procedures |
| [todo.md](./todo.md) | Development task tracker |

---

## License

Proprietary — Ologywood Platform
