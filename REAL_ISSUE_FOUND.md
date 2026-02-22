# Real Issue Found - Featured Artists Carousel

## Current State
The Featured Artists carousel is displaying:
- Only 2 artists (not 5)
- Both showing "Unknown Artist" (artistName is null/empty)
- Both showing "No image" (profilePhotoUrl is null/empty)
- No genre visible

## Root Cause Analysis
The carousel is calling `trpc.artist.search.useQuery({})` which should return all artists.

Looking at the data flow:
1. **Frontend (Home.tsx)**: Calls `trpc.artist.search.useQuery({})`
2. **TRPC Router**: Routes to `db.searchArtists(input)`
3. **Database (db.ts)**: Executes `SELECT * FROM artist_profiles`

The problem is that `searchArtists()` is returning artists with:
- `artistName: null` or empty
- `profilePhotoUrl: null` or empty
- But we seeded 5 artists with proper data!

## What We Know
- Database has 5 artists seeded (verified in previous sessions)
- All 5 have profile photos (S3 CDN URLs)
- All 5 have proper artistName values
- But searchArtists() is only returning 2 artists with empty data

## Hypothesis
The issue is in the `searchArtists()` function's data transformation. When we added `parseArtistProfile()`, something may have broken the data mapping.

Let me check:
1. What does the raw SQL query return?
2. Is parseArtistProfile() corrupting the data?
3. Why are only 2 artists returned instead of 5?

## Next Steps
1. Add logging to searchArtists to see raw query results
2. Verify parseArtistProfile doesn't null out artistName/profilePhotoUrl
3. Check if there's filtering happening that removes 3 artists
