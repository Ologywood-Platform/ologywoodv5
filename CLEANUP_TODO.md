# Ologywood Cleanup & Production Setup TODO

## Phase 1: Fix TypeScript Compilation Errors
- [ ] Fix server/routes/events.ts line 202 - void expression truthiness check
- [ ] Implement updateBookingPaymentStatus() in server/db.ts
- [ ] Implement upsertSubscription() in server/db.ts
- [ ] Fix Stripe webhook handlers to use implemented functions
- [ ] Verify all 88 TypeScript errors resolved

## Phase 2: Migrate Database Schema
- [ ] Run `pnpm db:push` to sync Drizzle schema to TiDB
- [ ] Verify all tables created with correct columns
- [ ] Verify foreign key relationships intact
- [ ] Test database connectivity after migration

## Phase 3: Seed 6 Production Artists
- [ ] Create seed data for 6 real artists with:
  - Professional names
  - Multiple genres
  - Locations
  - Professional rates
  - Bio/description
  - Profile photos (S3 URLs)
- [ ] Insert into database

## Phase 4: Seed 6 Production Venues
- [ ] Create seed data for 6 real venues with:
  - Venue names
  - Locations
  - Capacity
  - Event types
  - Contact info
  - Venue photos (S3 URLs)
- [ ] Insert into database

## Phase 5: End-to-End Verification
- [ ] Test artist browse page shows 6 artists
- [ ] Test artist detail pages load correctly
- [ ] Test venue browse page shows 6 venues
- [ ] Test booking flow works
- [ ] Test search and filters work
- [ ] Verify no console errors

## Phase 6: Final Checkpoint
- [ ] Save production-ready checkpoint
- [ ] Document what was fixed
