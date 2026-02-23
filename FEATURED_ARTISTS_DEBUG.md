# Featured Artists Carousel Debug - Systematic Approach

## Problem Statement
Homepage Featured Artists carousel shows only 3-4 test artists instead of all 6 production artists + test artists.
Browse page shows all 10 artists correctly.

## Phase 1: Database Verification
- [ ] Query database directly: SELECT COUNT(*) FROM artist_profiles
- [ ] List all artists with their IDs and names
- [ ] Verify 6 production artists are present
- [ ] Verify 4 test artists are present

## Phase 2: API Endpoint Testing
- [ ] Call artist.search({}) directly via API
- [ ] Check response: How many artists returned?
- [ ] Compare with Browse page query
- [ ] Check if there's a LIMIT clause in searchArtists()

## Phase 3: Component Data Flow
- [ ] Check Home.tsx: What query is it using?
- [ ] Check FeaturedArtistsCarousel: Does it filter data?
- [ ] Check if filteredArtists variable is working correctly
- [ ] Verify artists data is being passed correctly

## Phase 4: Root Cause Analysis
- [ ] Is searchArtists() limiting results?
- [ ] Is there a "featured" flag filtering artists?
- [ ] Is there pagination/offset issue?
- [ ] Are test artists being prioritized over production artists?

## Phase 5: Fix Implementation
- [ ] Implement systemic fix
- [ ] Test end-to-end

## Phase 6: Verification
- [ ] Homepage shows all 10 artists
- [ ] Browse page still works
- [ ] No regressions
