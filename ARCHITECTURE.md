# Ologywood Architecture Guide

**Last Updated:** February 12, 2026  
**Status:** MVP Production-Ready

---

## Overview

Ologywood is a **booking platform for performing artists and venues**. This document explains the codebase structure, data flow, and where to add new features.

### Core Purpose
- **Artists** create profiles, set availability, define riders, and receive booking requests
- **Venues** browse artists, send booking requests, manage events, and communicate with artists
- **Platform** handles payments, contracts, messaging, and dispute resolution

---

## Folder Structure

```
ologywood/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── pages/            # Page components (one per route)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (TRPC client, etc.)
│   │   ├── _core/            # Core infrastructure (auth, context)
│   │   └── App.tsx           # Main routing
│   └── package.json
│
├── server/                    # Node.js backend (Express + TRPC)
│   ├── _core/                # Core infrastructure (TRPC, auth, middleware)
│   ├── routers/              # TRPC router definitions
│   ├── handlers/             # Business logic handlers
│   ├── email.ts              # Email service
│   ├── db.ts                 # Database queries
│   ├── imageOptimization.ts  # Image processing
│   └── index.ts              # Server entry point
│
├── drizzle/                  # Database schema & migrations
│   └── schema.ts             # Zod + Drizzle ORM schema
│
├── shared/                   # Shared types & utilities
│   └── types.ts              # TypeScript interfaces
│
└── ARCHITECTURE.md           # This file
```

---

## Data Flow

### User Authentication
```
Browser → Login Form → authRouter.register/login → JWT Token → Stored in Cookie
         ↓
    useAuth() hook → User context available throughout app
```

### Booking Flow
```
Venue browses artists
    ↓
Clicks "Request Booking"
    ↓
booking.create mutation → Server validates → Saves to DB → Sends email to artist
    ↓
Artist receives notification
    ↓
Artist accepts/rejects/proposes modifications
    ↓
booking.update mutation → Updates DB → Sends confirmation email
    ↓
Payment processed → Contract generated → Booking confirmed
```

### Data Fetching
```
React Component
    ↓
trpc.artist.getProfile.useQuery() → TRPC client
    ↓
Server router → Database query → Response
    ↓
Component re-renders with data
```

---

## Key Routers (Server-Side)

All routers are defined in `/server/routers.ts` and mounted in `appRouter`.

| Router | Purpose | Key Endpoints |
|--------|---------|---------------|
| `auth` | Authentication | register, login, logout, updateRole |
| `artist` | Artist profiles | getMyProfile, getProfile, updateProfile, uploadPhoto |
| `venue` | Venue profiles | getMyProfile, getProfile, updateProfile, uploadPhoto |
| `booking` | Booking management | create, getMyBookings, update, cancel |
| `rider` | Performance riders | saveTemplate, getTemplates, getById |
| `message` | Messaging | getMyMessages, send, markAsRead |
| `review` | Reviews & ratings | create, getByArtist, getByVenue |
| `payment` | Payments | createCheckoutSession, webhook |
| `subscription` | Subscriptions | create, cancel, update |
| `availability` | Artist availability | set, get, block |
| `calendar` | Calendar sync | sync, disconnect |
| `newsletter` | Email subscriptions | subscribe |

---

## Authentication & Authorization

### Procedures (Middleware)
```typescript
publicProcedure       // No auth required
protectedProcedure    // User must be logged in
artistProcedure       // User must be logged in + role === 'artist'
venueProcedure        // User must be logged in + role === 'venue'
adminProcedure        // User must be logged in + role === 'admin'
```

### Usage
```typescript
// Public endpoint
export const getArtists = publicProcedure.query(async () => {
  return await db.getAllArtists();
});

// Protected endpoint (artists only)
export const updateProfile = artistProcedure
  .input(artistProfileSchema)
  .mutation(async ({ ctx, input }) => {
    return await db.updateArtistProfile(ctx.user.id, input);
  });
```

---

## Database Schema

### Core Tables
- **users** — Authentication & basic profile
- **artists** — Artist-specific data (stage name, genre, bio, photos, availability)
- **venues** — Venue-specific data (organization name, capacity, location, photos)
- **bookings** — Booking requests and confirmations
- **contracts** — Signed contracts and riders
- **messages** — Direct messaging between artists and venues
- **reviews** — Ratings and reviews
- **payments** — Payment records (Stripe integration)
- **subscriptions** — Subscription plans and billing

### Key Relationships
```
users → artists (one-to-one)
users → venues (one-to-one)
artists ← bookings → venues
artists ← reviews → venues
artists ← contracts → venues
users ← messages → users
```

---

## Frontend Architecture

### Pages (Routes)
Each page in `/client/src/pages/` corresponds to a route in `App.tsx`.

**Core Pages:**
- `Home.tsx` — Landing page
- `Browse.tsx` — Browse artists
- `ArtistProfile.tsx` — Artist profile (public)
- `VenueBrowse.tsx` — Browse venues
- `VenueProfile.tsx` — Venue profile (public)
- `ArtistDashboardV3.tsx` — Artist dashboard (protected)
- `VenueDashboard.tsx` — Venue dashboard (protected)
- `BookingsList.tsx` — Booking management
- `Messages.tsx` — Messaging interface
- `Riders.tsx` — Rider management
- `Help.tsx` — Help center & FAQs

**Settings Pages:**
- `AccountSettings.tsx` — Profile, photos, preferences

### Component Hierarchy
```
App.tsx (routing)
  ├── Layout (header, footer)
  ├── Pages
  │   ├── ArtistDashboardV3
  │   │   ├── ProfileCard
  │   │   ├── QuickActions
  │   │   ├── BookingsList
  │   │   └── MessagePreview
  │   └── Browse
  │       ├── SearchBar
  │       ├── FilterPanel
  │       └── ArtistGrid
  └── Modals
      ├── ShareProfileModal
      ├── BookingRequestModal
      └── etc.
```

---

## Adding New Features

### Step 1: Plan the Data
Ask yourself:
- What data needs to be stored?
- Which tables does it belong in?
- What relationships exist?

### Step 2: Update Database Schema
1. Edit `/drizzle/schema.ts`
2. Add new table or columns
3. Run migration: `pnpm db:push`

### Step 3: Create Server Endpoint
1. Add procedure to appropriate router in `/server/routers.ts`
2. Use `publicProcedure`, `protectedProcedure`, or role-specific procedure
3. Define input schema with Zod
4. Implement business logic

Example:
```typescript
export const myNewFeature = artistProcedure
  .input(z.object({ name: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Your logic here
    return await db.saveData(ctx.user.id, input);
  });
```

### Step 4: Create Frontend Component
1. Create component in `/client/src/components/`
2. Use `trpc.myRouter.myNewFeature.useMutation()` or `.useQuery()`
3. Handle loading and error states

Example:
```typescript
const mutation = trpc.myRouter.myNewFeature.useMutation();

const handleSubmit = async () => {
  await mutation.mutateAsync({ name: "test" });
};

return (
  <button onClick={handleSubmit} disabled={mutation.isPending}>
    {mutation.isPending ? "Loading..." : "Submit"}
  </button>
);
```

### Step 5: Add Route (if needed)
1. Create page in `/client/src/pages/MyFeature.tsx`
2. Add route to `App.tsx`:
```typescript
<Route path="/my-feature" component={MyFeature} />
```

### Step 6: Write Tests
1. Create test file in `/server/` for backend logic
2. Use Vitest for unit tests
3. Run: `pnpm test`

---

## Common Patterns

### Fetching Data
```typescript
const { data, isLoading, error } = trpc.artist.getProfile.useQuery({ id: 123 });

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;

return <div>{data.stageName}</div>;
```

### Mutations (Create/Update/Delete)
```typescript
const mutation = trpc.artist.updateProfile.useMutation();

const handleUpdate = async (data) => {
  try {
    await mutation.mutateAsync(data);
    toast.success("Profile updated!");
  } catch (error) {
    toast.error("Failed to update profile");
  }
};
```

### Authentication Check
```typescript
const { user } = useAuth();

if (!user) {
  return <Navigate to="/login" />;
}

if (user.role !== 'artist') {
  return <AccessDenied />;
}
```

---

## Email System

### Email Templates
Located in `/server/email.ts` and `/server/email-templates.ts`.

**Available Templates:**
- `sendBookingRequestEmail` — Notify artist of new booking request
- `sendBookingConfirmationEmail` — Confirm booking to both parties
- `sendContractForSignatureEmail` — Send contract to sign
- `sendPaymentReceiptEmail` — Payment confirmation
- `sendReviewNotificationEmail` — Notify of new review
- And 9+ more...

### Sending Emails
```typescript
await email.sendBookingRequestEmail({
  artistEmail: artist.email,
  artistName: artist.stageName,
  venueName: booking.venueName,
  eventDate: booking.eventDate,
});
```

---

## Image Handling

### Upload & Optimization
Images are automatically optimized on upload:
- Compressed to WebP format
- Reduced file size by 40-60%
- Stored in S3
- Lazy-loaded on frontend

### Usage
```typescript
const { data } = trpc.artist.uploadPhoto.useMutation();

const handleUpload = async (file) => {
  const result = await data.mutateAsync({ file });
  console.log(result.url); // S3 URL
};
```

---

## Performance Considerations

### Lazy Loading
Images use Intersection Observer API to load only when visible.

### Database Queries
- Use `.select()` to fetch only needed columns
- Paginate large result sets
- Use indexes on frequently queried fields

### Caching
- TRPC caches queries automatically
- Invalidate cache after mutations with `utils.invalidate()`

---

## What NOT to Do

❌ **Don't:**
- Add complex UI components to dashboards (keep them minimal)
- Create new routers without consulting the team
- Store sensitive data in the database (use Stripe, etc.)
- Hardcode URLs (use BASE_URL environment variable)
- Create new pages without updating routing
- Add features without tests

✅ **Do:**
- Keep components small and focused
- Use existing patterns and components
- Follow the data flow (client → TRPC → server → DB)
- Write tests before shipping
- Update this documentation when adding major features
- Ask for code review before merging

---

## Deployment

### Environment Variables
Required secrets (set in Settings → Secrets):
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET` — Session signing key
- `STRIPE_SECRET_KEY` — Stripe API key
- `SENDGRID_API_KEY` — Email service
- `AWS_ACCESS_KEY_ID` — S3 storage
- `BASE_URL` — Production domain

### Build & Deploy
```bash
# Build
pnpm build

# Deploy (via Manus UI)
Click "Publish" button in Management UI
```

---

## Getting Help

### Documentation
- This file (ARCHITECTURE.md)
- `/RIDER_CONTRACT_TEMPLATE.md` — Rider system docs
- `/EMAIL_SYSTEM_DOCUMENTATION.md` — Email system docs

### Code Examples
- Look at existing routers in `/server/routers.ts`
- Look at existing pages in `/client/src/pages/`
- Look at existing components in `/client/src/components/`

### Testing
```bash
# Run all tests
pnpm test

# Run specific test
pnpm test server/myFeature.test.ts

# Watch mode
pnpm test --watch
```

---

## Summary

**Ologywood is structured as:**
1. **Clean separation** — Client, server, database are isolated
2. **Type-safe** — TypeScript + Zod validation everywhere
3. **Minimal** — MVP features only, no bloat
4. **Testable** — All business logic is unit tested
5. **Scalable** — Easy to add new features following patterns

**To add a feature:**
1. Update schema
2. Create server endpoint
3. Create frontend component
4. Add route
5. Write tests
6. Deploy

That's it. Keep it simple.
