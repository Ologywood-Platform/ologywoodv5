# Ologywood - Artist Booking Platform

**Current Status:** MVP Golden Path - Production Ready  
**Last Updated:** February 19, 2026

A subscription-based booking platform connecting artists and performers with venues, featuring comprehensive rider management, availability calendars, and automated booking workflows.

## Platform Overview

Ologywood is a full-featured artist booking platform built to streamline the connection between performing artists and event venues. The platform provides a complete end-to-end booking experience with professional tools for both artists and venues.

### Core Features (MVP Golden Path)

#### For Artists
- **Profile Management** - Create and manage artist profiles with photos, bio, genre, and fee information
- **Rider Templates** - Create and manage comprehensive performance rider templates with technical requirements, hospitality needs, and equipment specifications
- **Booking Management** - Accept/decline booking requests with real-time status updates
- **Messaging** - Direct communication with venues about bookings and requirements
- **Earnings Dashboard** - Track completed bookings and earnings
- **Availability Calendar** - Manage performance availability

#### For Venues
- **Venue Profile** - Create and manage venue profiles with contact information and location
- **Artist Discovery** - Browse and search available artists by genre, location, and fee range
- **Booking Requests** - Create booking requests with event details and budget
- **Booking Management** - View booking status and manage confirmations
- **Rider Viewing** - Access artist rider templates to understand performance requirements
- **Messaging** - Communicate directly with artists about event details

#### Shared Features
- **Secure Authentication** - OAuth-based login with email verification
- **Payment Processing** - Stripe integration for deposits and full payments
- **Subscription Management** - Tiered subscription plans for artists and venues
- **Real-Time Notifications** - Polling-based message updates (2-second intervals)
- **Email Delivery Tracking** - Email logs for all system communications
- **Admin Dashboard** - Platform administration and user management

## Technical Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + tRPC
- **Database:** MySQL with Drizzle ORM
- **Authentication:** OAuth with JWT tokens
- **Payment:** Stripe (test mode for MVP)
- **Hosting:** Manus Platform

## Project Structure

```
ologywood/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── pages/         # Page components (dashboards, profiles, booking flows)
│   │   ├── components/    # Reusable UI components
│   │   ├── _core/         # Core hooks and utilities
│   │   └── lib/           # TRPC client setup
├── server/                # Node.js backend
│   ├── routers/           # TRPC route handlers
│   │   ├── artist.ts      # Artist endpoints
│   │   ├── venue.ts       # Venue endpoints
│   │   ├── booking.ts     # Booking endpoints
│   │   ├── rider.ts       # Rider template endpoints
│   │   ├── message.ts     # Messaging endpoints
│   │   ├── payment.ts     # Payment endpoints
│   │   └── auth.ts        # Authentication endpoints
│   ├── middleware/        # Express middleware
│   └── db.ts             # Database utilities
├── drizzle/              # Database schema and migrations
└── package.json          # Dependencies and scripts
```

## MVP Golden Path Workflow

### Artist Booking Flow
1. Artist signs up and completes profile
2. Artist creates rider template with performance requirements
3. Artist browses available venues
4. Artist views booking requests from venues
5. Artist accepts/declines bookings
6. Artist communicates with venue via messaging
7. Booking confirmed with payment processing
8. Artist receives earnings after event completion

### Venue Booking Flow
1. Venue signs up and completes profile
2. Venue browses available artists
3. Venue creates booking request with event details
4. Venue waits for artist response
5. Venue views artist's rider requirements
6. Venue communicates with artist via messaging
7. Booking confirmed with payment processing
8. Venue receives invoice after event completion

## Key Implementations (MVP)

### Critical Features Completed
- ✅ Profile Completion Redirect - Incomplete profiles redirected to onboarding
- ✅ Rider Data Fetching - Rider templates properly linked to bookings
- ✅ Real-Time Messaging - 2-second polling for automatic message updates
- ✅ Email Logging - Email delivery tracking system
- ✅ Booking Actions - Accept/Decline buttons on pending bookings
- ✅ Confirmation Page - Dedicated confirmation page after booking creation
- ✅ Phone Validation - Phone number validation (10-15 digits) in venue profiles

### Database
- 43 tables covering all platform features
- 753 test users (627 artists, 100 venues)
- Proper relationships and constraints
- Email logging for delivery tracking

### API Endpoints
- 22 active TRPC routers
- Complete CRUD operations for all resources
- Real-time data fetching with automatic refetching
- Proper error handling and validation

## Getting Started

### Prerequisites
- Node.js 22.13.0+
- MySQL database
- Stripe account (test keys provided)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Copy .env.example to .env and fill in values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Development Server
- Frontend: http://localhost:3000
- Backend: http://localhost:3000 (same port via proxy)

## Testing

### Test Users
- **Artist:** ologywood5@gmail.com (role: artist)
- **Venue:** garychisolm30@gmail.com (role: venue)
- **Admin:** Use any admin account

### Test Payment
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

## Deployment

The platform is configured for Manus hosting with automatic deployments from checkpoints. See DEPLOYMENT_GUIDE.md for detailed deployment instructions.

## Documentation

- **ARCHITECTURE.md** - System architecture and data flow
- **ENVIRONMENT_SETUP.md** - Environment configuration
- **DEPLOYMENT_GUIDE.md** - Deployment procedures
- **DEVELOPER_QUICK_REFERENCE.md** - Quick reference for developers
- **RYDER_CONTRACT_TEMPLATE.md** - Official Ryder contract template
- **todo.md** - Current project tracking and completed features

## Support

For issues, questions, or feature requests, please refer to the documentation or contact the development team.

## License

Proprietary - Ologywood Platform

---

**Built with ❤️ on Manus Platform**
