# Database Schema Issues - TiDB Migration

## Critical Issues Found

The Drizzle ORM schema defines many tables that are **missing from the TiDB database**. This is causing the app to fail when trying to access certain features.

### Missing Tables (Not in TiDB)
- `users` - Core user table (required for authentication)
- `venue_profiles` - Venue information (required for venue management)
- `bookings` - Booking records (required for booking system)
- `messages` - User messages (required for messaging)
- `events` - Event/gig listings (required for event discovery)
- `availability` - Artist availability (partially working)
- `userSubscriptions` - Subscription management
- `stripeConnectAccounts` - Stripe integration
- And many others...

### Tables That DO Exist
- `artist_profiles` ✅ (fully functional)
- `reviews` ✅ (partially functional)
- `bookings` ❌ (schema mismatch - missing columns)
- `availability` ✅ (exists but may have schema issues)
- `favorites` ✅
- `follows` ✅
- `contracts` ✅

## Current Status

### What's Working
- ✅ Artist browsing and discovery (6 production artists seeded)
- ✅ Artist detail pages
- ✅ Genre filtering
- ✅ Location-based search
- ✅ Featured artists carousel

### What's Broken
- ❌ Venue management (no venue_profiles table)
- ❌ Booking system (incomplete schema)
- ❌ User authentication (no users table)
- ❌ Messaging system (no messages table)
- ❌ Event creation (no events table)
- ❌ Stripe webhooks (missing subscription tables)

## Solution

Run the full database migration to create all missing tables:

```bash
pnpm db:push
```

This will:
1. Create all missing tables defined in Drizzle schema
2. Sync column definitions
3. Set up foreign key relationships
4. Ensure data consistency

## Workaround (Current State)

The app is partially functional with only artist_profiles table. To use the full platform, all tables must be migrated.

## Next Steps

1. **Fix Database Migration**: Run `pnpm db:push` to create missing tables
2. **Verify Schema**: Check that all 50+ tables are created with correct columns
3. **Seed Venues**: Once venue_profiles table exists, seed 6 production venues
4. **Test End-to-End**: Verify booking flow works with complete schema
