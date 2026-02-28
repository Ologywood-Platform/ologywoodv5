# Ologywood API Documentation

**Last Updated:** February 28, 2026

The Ologywood platform uses two API layers: **tRPC** for the primary client-server communication and **Express REST routes** for webhooks, file uploads, OAuth, and SEO endpoints.

---

## Authentication

All protected endpoints require a valid session cookie set during OAuth login. The platform uses Manus OAuth — there is no email/password login.

### OAuth Flow

1. Client calls `auth.getOAuthConfig` to get the OAuth portal URL
2. User is redirected to Manus OAuth portal
3. On success, callback at `/api/oauth/callback` sets a session cookie
4. Client calls `auth.me` to get the authenticated user

### Session Endpoints (tRPC `auth.*`)

| Procedure | Access | Description |
|-----------|--------|-------------|
| `auth.getOAuthConfig` | Public | Returns OAuth portal URL and redirect configuration |
| `auth.me` | Public | Returns current authenticated user or null |
| `auth.logout` | Protected | Clears session cookie |
| `auth.setUserRole` | Public | Sets user role (artist, venue, fan) during onboarding |
| `auth.checkEmail` | Public | Check if an email is already registered |
| `auth.getUserByEmail` | Public | Look up user by email address |
| `auth.login` | Public | Legacy login endpoint |
| `auth.signup` | Public | Legacy signup endpoint |
| `auth.verifyEmail` | Public | Verify email confirmation token |
| `auth.resendConfirmationEmail` | Public | Resend email confirmation |

---

## tRPC Router Namespaces

The main `appRouter` aggregates 30 namespaces. Below are the key ones grouped by domain.

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

Dedicated router in `routers/venue.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `venue.getById` | Public | Get venue profile by ID |
| `venue.search` | Public | Search venues by name, location, type |
| `venue.getVenueTypes` | Public | List available venue types |
| `venue.verifyEmail` | Public | Verify venue email |

Additional venue procedures in `routers.ts`:

| Procedure | Access | Description |
|-----------|--------|-------------|
| `venue.create` (inline) | Protected (Venue) | Create venue profile |
| `venue.updateProfile` (inline) | Protected (Venue) | Update venue profile |

### Booking (`booking.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `booking.create` | Protected (Venue) | Create a booking request |
| `booking.getById` | Protected | Get booking details |
| `booking.getMyArtistBookings` | Protected (Artist) | Get artist's bookings |
| `booking.getMyVenueBookings` | Protected (Venue) | Get venue's bookings |
| `booking.updateStatus` | Protected | Accept, decline, or cancel a booking |
| `booking.createDepositPayment` | Protected | Create Stripe deposit payment |
| `booking.confirmDepositPayment` | Protected | Confirm deposit payment |
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
| `follows.getMutualFollowers` | Protected | Get mutual followers |
| `follows.getRecommendations` | Protected | Get recommended artists to follow |
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

### Favorites (`favorite.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `favorite.add` | Protected | Add artist to favorites |
| `favorite.remove` | Protected | Remove from favorites |
| `favorite.getMyFavorites` | Protected | Get favorited artists |
| `favorite.isFavorited` | Protected | Check if artist is favorited |
| `favorite.getCount` | Public | Get favorite count for artist |

### Availability (`availability.*`)

Defined inline in `routers.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `availability.getForArtist` | Public | Get artist's availability calendar |
| `availability.set` | Protected (Artist) | Set availability for dates |
| `availability.delete` | Protected (Artist) | Remove availability entries |

### Payouts (`payout.*`)

Dedicated router in `routers/payout.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `payout.getEarnings` | Protected (Artist) | Get earnings summary |
| `payout.getPayoutHistory` | Protected (Artist) | Get payout history |
| `payout.requestPayout` | Protected (Artist) | Request a payout |
| `payout.getPayouts` | Protected (Admin) | Get all pending payouts |
| `payout.processPayout` | Protected (Admin) | Process a payout |
| `payout.completePayout` | Protected (Admin) | Complete a payout |

### Email Preferences (`emailPreferences.*`)

Dedicated router in `routers/emailPreferences.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `emailPreferences.getPreferences` | Protected | Get email preferences |
| `emailPreferences.updatePreferences` | Protected | Update email preferences |
| `emailPreferences.deletePreferences` | Protected | Delete email preferences |
| `emailPreferences.unsubscribeAll` | Public | Unsubscribe from all emails |
| `emailPreferences.resubscribe` | Public | Resubscribe to emails |

### Newsletter (`newsletter.*`)

Dedicated router in `routers/newsletter.ts`.

| Procedure | Access | Description |
|-----------|--------|-------------|
| `newsletter.subscribe` | Public | Subscribe to newsletter |
| `newsletter.confirmSubscription` | Public | Confirm newsletter subscription |
| `newsletter.unsubscribe` | Public | Unsubscribe from newsletter |
| `newsletter.getStats` | Protected (Admin) | Get newsletter statistics |

### Admin (`admin.*`)

Dedicated router in `routers/admin.ts`. All procedures require admin role.

| Procedure | Access | Description |
|-----------|--------|-------------|
| Various admin procedures | Protected (Admin) | User management, analytics, payout processing |

### Additional Inline Namespaces

| Namespace | Description |
|-----------|-------------|
| `account` | Account deletion validation |
| `payment` | Payment history and processing |
| `bookingTemplate` | Booking template management |
| `profileAnalytics` | Profile view tracking |
| `reminders` | Booking reminder management |
| `calendar` | Calendar integration |
| `earnings` | Earnings and tax reporting |
| `emailChange` | Email change verification |
| `emailTesting` | Email testing utilities (dev only) |

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
GET  /api/oauth/login     — Redirect to OAuth portal
GET  /api/oauth/callback   — OAuth callback handler
```

### Health Check

```
GET  /health               — Returns { status: "ok" }
```

### Sitemap & SEO

```
GET  /sitemap.xml          — Dynamic XML sitemap (public pages + artist/venue/event pages)
GET  /robots.txt           — Dynamic robots.txt with sitemap reference
```

### Events REST API

Full CRUD at `/api/events/*` with recurrence, history, photos, and saved events support. See `server/routes/events.ts` for complete endpoint list.

### Email Routes

```
POST /api/email/test       — Send test email (dev only)
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

Rate limits are applied via `createRateLimiter()` middleware in `server/_core/index.ts`.

---

## Test Payment

- **Card:** 4242 4242 4242 4242
- **Expiry:** Any future date
- **CVC:** Any 3 digits
