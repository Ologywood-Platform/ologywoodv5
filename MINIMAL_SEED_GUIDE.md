# Minimal Seed Data Guide

## Overview

This guide explains how to seed the Ologywood database with minimal test data (6 artists and 6 venues) for development and testing purposes.

## What Gets Seeded

### 6 Sample Artists
1. **Luna Echo** - Indie/Pop artist from Los Angeles
2. **The Jazz Collective** - Jazz/Soul ensemble from New York
3. **Electric Dreams** - Electronic/Dance producer from Miami
4. **Country Roads** - Country/Folk artist from Nashville
5. **Soul Harmony** - R&B/Soul vocalist from Atlanta
6. **Rock Legends** - Rock/Alternative band from Austin

### 6 Sample Venues
1. **The Grand Ballroom** - 500 capacity, Los Angeles
2. **Brooklyn Music Hall** - 300 capacity, New York
3. **Miami Beach Club** - 800 capacity, Miami
4. **Nashville Honky Tonk** - 400 capacity, Nashville
5. **Atlanta Event Center** - 1000 capacity, Atlanta
6. **Austin Live Stage** - 600 capacity, Austin

## Running the Seed Script

### Prerequisites
- Node.js installed
- Database connection configured (DATABASE_URL or individual DB_* env vars)
- All database migrations applied (`pnpm db:push`)

### Steps

1. **In Development (Local Database)**
   ```bash
   # Set up local MySQL database (if using docker-compose)
   docker-compose up -d mysql
   
   # Wait for database to be ready
   sleep 10
   
   # Run migrations
   pnpm db:push
   
   # Run seed script
   node seed-minimal.mjs
   ```

2. **In Production (Manus Built-in Database)**
   ```bash
   # After deploying to Manus production
   # The database connection will be automatically configured
   
   # Run the seed script in production environment
   node seed-minimal.mjs
   ```

## What the Script Does

1. **Clears existing data** - Removes all artists, venues, and associated user accounts
2. **Creates user accounts** - Creates 12 user accounts (6 artists, 6 venues) with appropriate roles
3. **Creates artist profiles** - Inserts 6 artist profiles with:
   - Name, genre, bio, location
   - Fee range (min/max)
   - Touring party size
   - Profile photo URL
   - Website and social links

4. **Creates venue profiles** - Inserts 6 venue profiles with:
   - Name, location, capacity
   - Profile photo URL
   - Description
   - Website URL

## Testing After Seeding

### Verify Artists Display
1. Go to "Browse Artists" page
2. Should see 6 artist cards with photos and information
3. Try searching by genre, location, or name
4. Click on artist cards to view full profiles

### Verify Venues Display
1. Go to "Browse Venues" page (if implemented)
2. Should see 6 venue cards
3. Try searching for venues by name or location

### Test Booking Flow
1. Log in as a venue user
2. Browse artists
3. Create a booking request for an artist
4. Log in as that artist
5. Accept or decline the booking
6. Verify booking status updates

### Test Messaging
1. After accepting a booking, send a message
2. Switch to the other user's account
3. Verify message appears in real-time (2-second polling)

### Test Rider Templates
1. Log in as an artist
2. Create a rider template
3. Create a booking as a venue
4. Verify rider template displays in booking details

## Troubleshooting

### Script Fails with "Database not available"
- **Cause**: DATABASE_URL is not set or invalid
- **Solution**: 
  - In development: Start local MySQL with `docker-compose up -d mysql`
  - In production: Ensure Manus has configured the database

### Script Fails with "Table doesn't exist"
- **Cause**: Database migrations haven't been applied
- **Solution**: Run `pnpm db:push` before running the seed script

### Script Fails with "Duplicate entry"
- **Cause**: Data already exists in database
- **Solution**: The script clears existing data first, so this shouldn't happen. If it does, manually clear the tables:
  ```sql
  DELETE FROM artistProfiles;
  DELETE FROM venueProfiles;
  DELETE FROM users WHERE role IN ('artist', 'venue');
  ```

## Next Steps

After seeding with minimal data:

1. **Test all endpoints** - Verify all TRPC routers work correctly
2. **Test UI flows** - Go through complete booking workflow
3. **Test messaging** - Send messages between users
4. **Test payments** - Create test payments with Stripe test cards
5. **Test notifications** - Verify emails are sent for bookings and messages

## Scaling Up

When ready to add more data:

1. **Use the original seed script** - `seed-production-data.mjs` has 627 artists and 100 venues
2. **Create custom seed data** - Modify `seed-minimal.mjs` to add more artists/venues as needed
3. **Use the database UI** - Manus Management UI has a Database panel for manual data entry

## Notes

- All artist and venue accounts are created with test email addresses
- Profile photos use real Unsplash URLs (may change if links expire)
- Social links are placeholder values - update as needed for testing
- Fee ranges are realistic for different genres and locations
- Venue capacities match typical venue sizes in each city
