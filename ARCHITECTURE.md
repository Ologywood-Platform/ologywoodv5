# Ologywood Architecture Documentation

**Current Status:** MVP Golden Path - Production Ready  
**Last Updated:** February 19, 2026  
**Version:** 1.0 (MVP)

---

## Overview

Ologywood is a **booking platform for performing artists and venues**. This document explains the codebase structure, data flow, and architecture decisions for the MVP Golden Path.

### Core Purpose
- **Artists** create profiles, manage rider templates, and accept/decline booking requests
- **Venues** browse artists, create booking requests, and manage confirmations
- **Platform** handles payments, messaging, and booking lifecycle management

---

## Folder Structure

```
ologywood/
├── client/                           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/                   # Page components (one per route)
│   │   │   ├── Home.tsx             # Landing page with role-based routing
│   │   │   ├── ArtistDashboardV3.tsx # Artist dashboard with profile check
│   │   │   ├── VenueDashboard.tsx   # Venue dashboard with artist discovery
│   │   │   ├── BookingCreate.tsx    # Booking request creation
│   │   │   ├── BookingDetail.tsx    # Booking details with rider viewing
│   │   │   ├── BookingConfirmation.tsx # Post-booking confirmation
│   │   │   ├── BookingsList.tsx     # Bookings list with Accept/Decline
│   │   │   ├── RiderTemplates.tsx   # Rider template management
│   │   │   ├── Messages.tsx         # Messaging with 2-second polling
│   │   │   └── [other pages]
│   │   ├── components/              # Reusable UI components
│   │   │   ├── RyderContractForm.tsx # Rider template form
│   │   │   ├── ui/                  # Shadcn UI components
│   │   │   └── [other components]
│   │   ├── _core/                   # Core infrastructure
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts       # Authentication hook with refresh
│   │   │   └── contexts/
│   │   ├── lib/
│   │   │   └── trpc.ts              # TRPC client setup
│   │   └── App.tsx                  # Main routing (wouter-based)
│   └── package.json
│
├── server/                          # Node.js backend (Express + TRPC)
│   ├── _core/                       # Core infrastructure
│   │   ├── middleware/
│   │   │   └── rateLimiter.ts       # Rate limiting (cleared on restart)
│   │   └── auth.ts                  # Authentication logic
│   ├── routers/                     # TRPC route handlers
│   │   ├── artist.ts                # Artist profile endpoints
│   │   ├── venue.ts                 # Venue profile endpoints
│   │   ├── booking.ts               # Booking CRUD + status updates
│   │   ├── rider.ts                 # Rider template endpoints
│   │   ├── message.ts               # Messaging endpoints
│   │   ├── payment.ts               # Payment/subscription endpoints
│   │   ├── auth.ts                  # Authentication endpoints
│   │   └── [other routers]
│   ├── routers.ts                   # Main TRPC router mounting
│   ├── middleware/                  # Express middleware
│   ├── email.ts                     # Email service (SendGrid)
│   ├── db.ts                        # Database query utilities
│   └── index.ts                     # Server entry point
│
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                    # 43 tables with relationships
│   └── migrations/                  # Auto-generated migrations
│
└── ARCHITECTURE.md                  # This file
```

---

## Data Flow

### Authentication Flow
```
Browser → Login Form → authRouter.register/login → JWT Token → Stored in Cookie
         ↓
    useAuth() hook → User context available throughout app
         ↓
    Home page → Role-based redirect (artist → /dashboard, venue → /venue-dashboard)
```

### Booking Creation Flow
```
Venue → Browse Artists → Select Artist → /booking/create?artistId=X
         ↓
    BookingCreate form → Create booking via trpc.booking.create
         ↓
    Booking created (status: pending) → Redirect to /booking-confirmation/:id
         ↓
    Artist receives notification → Sees pending booking in BookingsList
         ↓
    Artist clicks Accept/Decline → updateStatus mutation → Status updated
         ↓
    Venue sees status change → Booking confirmed
```

### Messaging Flow
```
User opens Messages page → useEffect sets up 2-second polling
         ↓
    Poll trpc.message.getByBooking every 2 seconds
         ↓
    New messages fetched automatically
         ↓
    User sends message → trpc.message.create → Message appears immediately
```

### Rider Template Flow
```
Artist → /rider-templates → Create/Edit rider template
         ↓
    RyderContractForm component → Save to database
         ↓
    Rider linked to artist profile
         ↓
    Venue views booking → BookingDetail shows rider section
         ↓
    Rider data fetched from database → Displayed to venue
```

---

## Database Schema (43 Tables)

### Core Tables
- **users** - All platform users (753 total: 627 artists, 100 venues, 26 admins)
- **artistProfiles** - Artist profile information
- **venueProfiles** - Venue profile information
- **bookings** - Booking records with status tracking
- **rider_templates** - Rider template storage
- **messages** - Direct messaging between users
- **email_logs** - Email delivery tracking

### Payment Tables
- **subscriptions** - User subscription records
- **payments** - Payment transaction records
- **invoices** - Invoice records

### Supporting Tables
- **favorites** - Artist favorites for venues
- **follows** - Artist follows for venues
- **reviews** - Booking reviews and ratings
- **reminders** - Event reminders
- **calendar_events** - Event calendar entries
- **[and 26 more supporting tables]**

---

## API Endpoints (22 TRPC Routers)

### Artist Router
- `artist.getProfile()` - Get artist profile
- `artist.updateProfile()` - Update artist profile
- `artist.getAll()` - Browse all artists
- `artist.search()` - Search artists

### Venue Router
- `venue.getMyProfile()` - Get venue profile
- `venue.updateProfile()` - Update venue profile
- `venue.getAll()` - Browse all venues

### Booking Router
- `booking.create()` - Create booking request
- `booking.getById()` - Get booking details
- `booking.getMyArtistBookings()` - Artist's bookings
- `booking.getMyVenueBookings()` - Venue's bookings
- `booking.updateStatus()` - Update booking status (pending → confirmed → completed)
- `booking.cancel()` - Cancel booking

### Rider Router
- `rider.create()` - Create rider template
- `rider.getByArtist()` - Get artist's riders
- `rider.getById()` - Get rider details
- `rider.update()` - Update rider
- `rider.delete()` - Delete rider

### Message Router
- `message.create()` - Send message
- `message.getByBooking()` - Get messages for booking
- `message.markAsRead()` - Mark message as read

### Payment Router
- `payment.createCheckoutSession()` - Create Stripe checkout
- `payment.getPaymentStatus()` - Get payment status

### Auth Router
- `auth.me()` - Get current user (fresh from DB)
- `auth.logout()` - Logout user

---

## Key Architectural Decisions

### 1. Role-Based Routing
- Home page checks user role and redirects to appropriate dashboard
- Artist → `/dashboard` (ArtistDashboardV3)
- Venue → `/venue-dashboard` (VenueDashboard)
- Admin → `/admin` (AdminDashboard)

### 2. Real-Time Messaging (MVP Approach)
- Uses 2-second polling instead of WebSocket
- Simple, reliable, and works across all environments
- Can be upgraded to WebSocket in Phase 2

### 3. Profile Completion Enforcement
- Incomplete profiles redirect to onboarding
- Prevents incomplete data from affecting bookings

### 4. Booking Status Workflow
- Pending → Confirmed → Completed → Archived
- Cancel option available at any stage
- Email notifications at each stage

### 5. Rider Template Integration
- Riders attached to bookings via artistId
- Fetched on-demand in BookingDetail
- Displayed to venues for transparency

### 6. Email Logging
- All emails logged in email_logs table
- Tracks delivery status and timestamps
- Enables audit trail for compliance

---

## Adding New Features

### To Add a New Page
1. Create component in `client/src/pages/[FeatureName].tsx`
2. Add route in `client/src/App.tsx`
3. Add navigation link in appropriate component
4. Test with both artist and venue roles

### To Add a New API Endpoint
1. Create or update router in `server/routers/[feature].ts`
2. Add mutation/query to `routers.ts`
3. Use in component via `trpc.[router].[endpoint].useMutation/useQuery()`
4. Add tests in `server/[feature].test.ts`

### To Add a New Database Table
1. Add table definition to `drizzle/schema.ts`
2. Run `pnpm db:push` to migrate
3. Add query utilities to `server/db.ts`
4. Create TRPC endpoint to access data

---

## Performance Considerations

### Current Optimizations
- TRPC for type-safe API calls
- Automatic query refetching on mutations
- Lazy loading of components
- Image optimization for profile photos

### Future Optimizations
- WebSocket for real-time messaging
- Caching layer for artist/venue browsing
- Pagination for large datasets
- Database query optimization

---

## Security Considerations

### Current Implementation
- JWT-based authentication
- Rate limiting on login (cleared on server restart)
- Email verification for new accounts
- Role-based access control

### Best Practices
- Never store sensitive data in localStorage
- Always validate input on backend
- Use HTTPS in production
- Regular security audits

---

## Deployment

The platform is deployed on Manus with automatic deployments from checkpoints. See DEPLOYMENT_GUIDE.md for detailed instructions.

---

## Support & Questions

For architectural questions or design decisions, refer to the relevant documentation or contact the development team.
