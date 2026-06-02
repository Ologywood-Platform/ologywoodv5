# Ologywood API Documentation

**Last Updated:** March 13, 2026

The Ologywood platform uses two API layers: **tRPC** for the primary client-server communication and **Express REST routes** for webhooks, file uploads, OAuth, and SEO endpoints.

---

## Authentication

The platform supports three authentication methods: **Google OAuth**, **Spotify OAuth**, and **Email/Password**. All protected endpoints require a valid session cookie (`app_session_id`) set during login.

### Google OAuth Flow

1. User clicks "Continue with Google" which navigates to `/api/auth/google`
2. Server redirects to Google's consent screen
3. On success, callback at `/api/auth/google/callback` creates/links the user and sets a session cookie
4. User is redirected to the dashboard

### Spotify OAuth Flow

1. User clicks "Continue with Spotify" which navigates to `/api/auth/spotify`
2. Server redirects to Spotify's authorization page
3. On success, callback at `/api/auth/spotify/callback` creates/links the user and sets a session cookie
4. User is redirected to the dashboard

### Email/Password Flow

1. User signs up via `auth.signup` with email, password, and name
2. Verification email is sent via SendGrid
3. User verifies email via `auth.verifyEmail` with the token
4. User logs in via `auth.login` which sets the session cookie
5. Forgot password flow: `auth.forgotPassword` → email with reset link → `auth.resetPassword`

### Session Endpoints (tRPC `auth.*`)

| Procedure | Access | Description |
|-----------|--------|-------------|
| `auth.uploadCustomAvatar` | Protected | Upload a custom profile picture (overrides OAuth avatar) |
| `auth.removeCustomAvatar` | Protected | Remove custom profile picture (reverts to OAuth avatar) |
| `auth.me` | Public | Returns current authenticated user or null |
| `auth.logout` | Protected | Clears session cookie |
| `auth.setUserRole` | Protected | Sets user role (artist, venue, user) during onboarding |
| `auth.checkEmail` | Public | Check if an email is already registered |
| `auth.getUserByEmail` | Public | Look up user by email address |
| `auth.login` | Public | Email/password login, sets session cookie |
| `auth.signup` | Public | Email/password signup with email verification |
| `auth.verifyEmail` | Public | Verify email confirmation token |
| `auth.resendConfirmationEmail` | Public | Resend email confirmation |
| `auth.forgotPassword` | Public | Send password reset email |
| `auth.resetPassword` | Public | Reset password with token |
| `auth.changePassword` | Protected | Change password (requires current password) |

---

## Role-Based Access Control

The platform enforces six user roles with middleware-based access control.

| Role | Middleware | Access Level |
|------|-----------|-------------|
| Owner | `checkIsOwner()` | Full platform access, cannot be demoted |
| Admin | `adminOnly` | Admin dashboard, user management, all features |
| Blogger | `blogAccess` | Blog post CRUD only, no admin dashboard |
| Artist | `authed` + role check | Artist dashboard, profile, bookings, riders, releases |
| Venue | `authed` + role check | Venue dashboard, booking requests, payments |
| User | `authed` | Browse, follow, client bookings, purchase music |

---

## tRPC Router Namespaces

The main `appRouter` aggregates 18 dedicated router files plus inline procedures. Below are all namespaces grouped by domain.

### Artist (`artist.*`)

Defined inline in `routers.ts`. Handles artist profiles, photos, and gallery.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `artist.getMyProfile` | Protected | Get current artist's profile |
| `artist.getProfile` | Public | Get artist profile by ID |
| `artist.createProfile` | Protected | Create artist profile during onboarding |
| `artist.updateProfile` | Protected (Artist) | Update artist profile fields |
| `artist.uploadProfilePhoto` | Protected (Artist) | Upload profile photo to S3 |
| `artist.uploadPhoto` | Protected (Artist) | Upload additional photo |
| `artist.addGalleryPhoto` | Protected (Artist) | Add photo to gallery |
| `artist.removeGalleryPhoto` | Protected (Artist) | Remove gallery photo |
| `artist.search` | Public | Search artists by name, genre, location, fee range |
| `artist.getAll` | Public | Get all artists with optional filters |
| `artist.uploadMedia` | Protected (Artist) | Upload media file |

### Venue (`venue.*`)

Dedicated router in `routers/venue.ts` plus inline procedures in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `venue.getById` | Public | Get venue profile by ID |
| `venue.search` | Public | Search venues by name, location, type |
| `venue.getVenueTypes` | Public | List available venue types |
| `venue.verifyEmail` | Public | Verify venue email |
| `venue.create` | Protected (Venue) | Create venue profile |
| `venue.updateProfile` | Protected (Venue) | Update venue profile |

### Booking (`booking.*`)

Defined inline in `routers.ts`. Handles the full booking lifecycle.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `booking.create` | Protected (Venue) | Create a booking request |
| `booking.clientCreate` | Protected (User) | Create a client booking request |
| `booking.getById` | Protected | Get booking details |
| `booking.getMyArtistBookings` | Protected (Artist) | Get artist's bookings |
| `booking.getMyVenueBookings` | Protected (Venue) | Get venue's bookings |
| `booking.getMyClientBookings` | Protected | Get client's bookings |
| `booking.updateStatus` | Protected | Accept, decline, or cancel a booking |
| `booking.createDepositPayment` | Protected | Create Stripe deposit payment |
| `booking.createRemainingPayment` | Protected | Create Stripe remaining balance payment |
| `booking.verifyPayment` | Protected | Verify payment status with Stripe |
| `booking.attachRider` | Protected | Attach rider template to booking |
| `booking.getRider` | Protected | Get rider attached to booking |

### Rider Templates (`rider.*`)

Dedicated router in `routers/rider.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `rider.listDefaultTemplates` | Protected | List 4 pre-built template types |
| `rider.getDefaultTemplate` | Protected | Get default template structure by type |
| `rider.getMyTemplates` | Protected (Artist) | Get artist's saved templates |
| `rider.getTemplate` | Protected | Get specific template by ID |
| `rider.createTemplate` | Protected (Artist) | Create custom rider template |
| `rider.createFromDefault` | Protected (Artist) | Create template from a default type |
| `rider.updateTemplate` | Protected (Artist) | Update existing template |
| `rider.deleteTemplate` | Protected (Artist) | Delete a template |
| `rider.duplicateTemplate` | Protected (Artist) | Duplicate a template |
| `rider.generatePreview` | Protected | Generate HTML preview |
| `rider.exportAsJSON` | Protected (Artist) | Export template as JSON |
| `rider.validateTemplate` | Protected | Validate template data |
| `rider.getStats` | Protected (Artist) | Get template statistics |

### Rider Contracts (`riderContract.*`)

Dedicated router in `routers/riderContract.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `riderContract.getForBooking` | Protected | Get contract and signatures for a booking |
| `riderContract.createContract` | Protected | Create contract for a booking |
| `riderContract.sign` | Protected | Sign a contract (drawn or typed signature) |
| `riderContract.getRiderPreview` | Protected | Get rendered rider HTML for preview |
| `riderContract.verify` | Protected | Verify contract signature integrity |

### Events (`events.*`)

Dedicated router in `routers/events.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `events.create` | Protected (Artist) | Create a new event |
| `events.update` | Protected (Artist) | Update an event |
| `events.delete` | Protected (Artist) | Delete an event |
| `events.getById` | Public | Get event by ID |
| `events.getByArtistId` | Public | Get events for an artist |
| `events.search` | Public | Search events by query, type, location, date |
| `events.getUpcomingEvents` | Public | Get upcoming events |
| `events.getSimilar` | Public | Get similar events (multi-factor scoring) |
| `events.getSavedEvents` | Protected | Get user's saved events |
| `events.saveEvent` | Protected | Save an event |
| `events.isEventSaved` | Protected | Check if event is saved |
| `events.getPhotos` | Public | Get event photos |
| `events.addPhoto` | Protected (Artist) | Add photo to event |
| `events.getHistory` | Public | Get event history |
| `events.createRecurrence` | Protected (Artist) | Set event recurrence |
| `events.getRecurrence` | Public | Get recurrence settings |

### Follows (`follows.*`)

Dedicated router in `routers/follows.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `follows.follow` | Protected | Follow an artist |
| `follows.unfollow` | Protected | Unfollow an artist |
| `follows.isFollowing` | Protected | Check follow status |
| `follows.getFollowers` | Protected (Artist) | Get follower list |
| `follows.getFollowing` | Protected | Get followed artists |
| `follows.getStats` | Protected (Artist) | Get follow statistics |
| `follows.getFanEmails` | Protected (Artist) | Get fan email list (paid tier) |
| `follows.exportFanEmails` | Protected (Artist) | Export fan emails as CSV (paid tier) |
| `follows.getSuggestedArtists` | Protected | Get suggested artists to follow |
| `follows.getTrending` | Public | Get trending artists |

### Artist Updates (`artistUpdates.*`)

Dedicated router in `routers/artistUpdates.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `artistUpdates.send` | Protected (Artist) | Send email blast to fans (paid tier, rate-limited) |
| `artistUpdates.getHistory` | Protected (Artist) | Get past update history |
| `artistUpdates.canSend` | Protected (Artist) | Check if artist can send (rate limit check) |

### Messages (`message.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `message.getForBooking` | Protected | Get messages for a booking thread |
| `message.send` | Protected | Send a message |
| `message.sendQuickMessage` | Protected | Send a quick message |
| `message.markAsRead` | Protected | Mark message as read |
| `message.markBookingAsRead` | Protected | Mark all booking messages as read |
| `message.getUnreadCount` | Protected | Get unread count for a booking |
| `message.getTotalUnreadCount` | Protected | Get total unread count |

### Reviews (`review.*` and `venueReview.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `review.create` | Protected (Venue) | Create review for an artist |
| `review.createFromProfile` | Protected (Venue) | Create review from artist profile page |
| `review.getByArtist` | Public | Get reviews for an artist |
| `review.getByBooking` | Protected | Get reviews for a booking |
| `review.getAverageRating` | Public | Get artist's average rating |
| `review.respondToReview` | Protected (Artist) | Respond to a review |
| `venueReview.create` | Protected (Artist) | Create review for a venue |
| `venueReview.getByVenue` | Public | Get reviews for a venue |
| `venueReview.getAverageRating` | Public | Get venue's average rating |
| `venueReview.respondToReview` | Protected (Venue) | Respond to a venue review |

### Admin (`admin.*`)

Dedicated router in `routers/admin.ts`. All procedures require admin role.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `admin.getStats` | Protected (Admin) | Get platform statistics (users, bookings, revenue) |
| `admin.getUsers` | Protected (Admin) | Get all users with search and role filter |
| `admin.getAdmins` | Protected (Admin) | Get admin team list with owner identification |
| `admin.changeRole` | Protected (Admin) | Change a user's role (admin, blogger, artist, venue, user) |
| `admin.isOwner` | Protected (Admin) | Check if current user is the platform owner |
| `admin.getAuditLog` | Protected (Admin) | Get role change audit log (paginated, searchable) |
| `admin.getBookings` | Protected (Admin) | Get all bookings platform-wide |
| `admin.getPayouts` | Protected (Admin) | Get all payout requests |
| `admin.processPayout` | Protected (Admin) | Process an artist payout |
| `admin.getUnsubscribeFeedback` | Protected (Admin) | Get unsubscribe feedback entries |

### Blog (`blog.*`)

Dedicated router in `routers/blog.ts`. Accessible by admins and bloggers.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `blog.getAll` | Public | Get all published blog posts |
| `blog.getBySlug` | Public | Get a blog post by slug |
| `blog.adminGetAll` | Protected (Admin/Blogger) | Get all posts including drafts |
| `blog.create` | Protected (Admin/Blogger) | Create a new blog post |
| `blog.update` | Protected (Admin/Blogger) | Update a blog post |
| `blog.delete` | Protected (Admin/Blogger) | Delete a blog post |
| `blog.publish` | Protected (Admin/Blogger) | Publish a draft post |
| `blog.unpublish` | Protected (Admin/Blogger) | Unpublish a post |

### Dispute (`dispute.*`)

Dedicated router in `routers/dispute.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `dispute.create` | Protected | File a dispute on a booking |
| `dispute.getMyDisputes` | Protected | Get user's disputes |
| `dispute.getById` | Protected | Get dispute details |
| `dispute.adminGetAll` | Protected (Admin) | Get all disputes platform-wide |
| `dispute.addNote` | Protected (Admin) | Add admin note to a dispute |
| `dispute.resolve` | Protected (Admin) | Resolve a dispute |

### Release (`release.*`)

Dedicated router in `routers/release.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `release.create` | Protected (Artist) | Create a music release |
| `release.update` | Protected (Artist) | Update a release |
| `release.delete` | Protected (Artist) | Delete a release |
| `release.getByArtist` | Public | Get releases by artist |
| `release.getById` | Public | Get release details |
| `release.purchase` | Protected | Purchase a release via Stripe |
| `release.getMyPurchases` | Protected | Get user's purchased releases |
| `release.createReview` | Protected | Review a purchased release |
| `release.getReviews` | Public | Get reviews for a release |

### Stripe Connect (`stripeConnect.*`)

Dedicated router in `routers/stripeConnect.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `stripeConnect.getAccountStatus` | Protected (Artist) | Get Stripe Connect account status |
| `stripeConnect.createAccountLink` | Protected (Artist) | Create onboarding link for Stripe Connect |
| `stripeConnect.getDashboardLink` | Protected (Artist) | Get Stripe Express dashboard link |

### Subscriptions (`subscription.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `subscription.getMy` | Protected | Get current subscription |
| `subscription.createCheckoutSession` | Protected | Create Stripe checkout session |
| `subscription.getStatus` | Protected | Get subscription status |
| `subscription.cancel` | Protected | Cancel subscription |
| `subscription.reactivate` | Protected | Reactivate cancelled subscription |

### Pricing (`pricing.*`)

Dedicated router in `routers/pricing.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `pricing.getAllTiers` | Public | Get all subscription tiers with features |
| `pricing.getCurrentTier` | Protected | Get user's current tier |
| `pricing.hasFeature` | Protected | Check if user has access to a feature |
| `pricing.canCreateBooking` | Protected | Check booking quota |
| `pricing.getBookingUsage` | Protected | Get booking usage stats |
| `pricing.getTierComparison` | Public | Get tier comparison data |

### Notifications (`notifications.*`)

Dedicated router in `routers/notifications.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `notifications.getAll` | Protected | Get all notifications for user |
| `notifications.unreadCount` | Protected | Get unread notification count |
| `notifications.markAsRead` | Protected | Mark notification as read |
| `notifications.markAllAsRead` | Protected | Mark all notifications as read |

### Email Preferences (`emailPreferences.*`)

Dedicated router in `routers/emailPreferences.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `emailPreferences.getPreferences` | Protected | Get email preferences |
| `emailPreferences.updatePreferences` | Protected | Update email preferences |
| `emailPreferences.unsubscribeAll` | Public | Unsubscribe from all emails |
| `emailPreferences.resubscribe` | Public | Resubscribe to emails |

### Payout (`payout.*`)

Dedicated router in `routers/payout.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `payout.getEarnings` | Protected (Artist) | Get earnings summary |
| `payout.getPayoutHistory` | Protected (Artist) | Get payout history |
| `payout.requestPayout` | Protected (Artist) | Request a payout |
| `payout.getPayouts` | Protected (Admin) | Get all pending payouts |
| `payout.processPayout` | Protected (Admin) | Process a payout |

### Additional Inline Namespaces

These are defined inline in `routers.ts`:

| Namespace | Description |
|-----------|-------------|
| `account` | Account deletion validation |
| `payment` | Payment history and processing |
| `favorite` | Artist favorites (add, remove, list, check) |
| `availability` | Artist availability calendar (get, set, delete) |
| `bookingTemplate` | Booking template management |
| `profileAnalytics` | Profile view tracking |
| `reminders` | Booking reminder management |
| `calendar` | Calendar integration |
| `earnings` | Earnings and tax reporting |
| `emailChange` | Email change verification |
| `contact` | Contact form submission |

---

## Express REST Routes

These routes are registered directly on the Express app, outside tRPC.

### Stripe Webhook

```
POST /api/stripe/webhook
```

Handles Stripe webhook events with signature verification. Registered with `express.raw()` before `express.json()`.

**Events handled:** `payment_intent.succeeded`, `charge.refunded`, `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.deleted`, `invoice.paid`

### OAuth

```
GET  /api/oauth/login      — Redirect to OAuth portal
GET  /api/oauth/callback    — OAuth callback handler
```

### Health Check

```
GET  /health                — Returns { status: "ok" }
```

### Sitemap and SEO

```
GET  /sitemap.xml           — Dynamic XML sitemap (public pages + artist/venue/event pages)
GET  /robots.txt            — Dynamic robots.txt with sitemap reference
```

### Contract Downloads

```
GET  /api/contracts/:id/pdf — Download signed contract as PDF
```

---

## Error Handling

All tRPC errors use standard codes:

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid input |
| `CONFLICT` | Duplicate resource |
| `INTERNAL_SERVER_ERROR` | Server error |

---

## Rate Limiting

| Endpoint Group | Limit |
|---------------|-------|
| OAuth routes | Configured per-IP |
| tRPC API | Configured per-IP |
| Public routes | Configured per-IP |
| Artist updates (email blasts) | 1 per 24 hours per artist |
| Password reset | Rate-limited per email |

Rate limits are applied via `createRateLimiter()` middleware in `server/_core/index.ts`.

---

## Test Payment

- **Card:** 4242 4242 4242 4242
- **Expiry:** Any future date
- **CVC:** Any 3 digits

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture, folder structure, data flow |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Development setup and coding standards |
| [CI_CD_DEPLOYMENT.md](./CI_CD_DEPLOYMENT.md) | Deployment and CI/CD procedures |
| [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) | Backup and recovery procedures |
