# Role-Based Browsing - Implementation Roadmap

## Current State (MVP - Open Browsing)

**Browse Pages:**
- ✅ `/browse` - Artists listing (public, no auth required)
- ✅ `/venues` - Venues listing (public, no auth required)

**Access Model:**
- Anyone can view all artists and venues
- Signup/login required only to book or message
- No role-based filtering

---

## Future Implementation: Role-Based Browsing

When you have test users, implement the following role-based access model:

### Phase 1: Artist-Only Venue Browsing

**Requirement:** Only artists can browse venues

**Implementation:**
1. Change `venue.search` endpoint from `publicProcedure` to `artistProcedure`
2. Update VenueBrowse.tsx to redirect non-artists to signup
3. Add role check in Browse.tsx for artist-only access

**Code Changes Required:**

```typescript
// server/routers/venueRouter.ts
export const venueRouter = router({
  search: artistProcedure  // Changed from publicProcedure
    .input(z.object({...}))
    .query(async ({ ctx, input }) => {
      // ctx.user.id is now available
      // Can track which artist viewed which venue
      // ...
    }),
});
```

```typescript
// client/src/pages/VenueBrowse.tsx
export default function VenueBrowse() {
  const { user, isAuthenticated } = useAuth();
  
  // Add role check
  if (isAuthenticated && user?.role !== 'artist') {
    return <div>Only artists can browse venues</div>;
  }
  
  if (!isAuthenticated) {
    return <QuickSignupModal actionType="browse" targetType="venue" />;
  }
  
  // ... rest of component
}
```

### Phase 2: Venue-Only Artist Browsing

**Requirement:** Only venues can browse artists

**Implementation:**
1. Change `artist.search` endpoint from `publicProcedure` to `venueProcedure`
2. Update Browse.tsx to redirect non-venues to signup
3. Add role check in Browse.tsx for venue-only access

**Code Changes Required:**

```typescript
// server/routers/artistRouter.ts
export const artistRouter = router({
  search: venueProcedure  // Changed from publicProcedure
    .input(z.object({...}))
    .query(async ({ ctx, input }) => {
      // ctx.user.id is now available
      // Can track which venue viewed which artist
      // ...
    }),
});
```

### Phase 3: Analytics & Tracking

Once role-based browsing is implemented, track:

**For Artists:**
- Which venues they viewed
- Search patterns and preferences
- Favorite venues (wishlist)

**For Venues:**
- Which artists they viewed
- Search patterns and preferences
- Favorite artists (watchlist)

**Database Schema Additions:**
```sql
-- Track venue views by artists
CREATE TABLE artist_venue_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  artistId INT NOT NULL,
  venueId INT NOT NULL,
  viewedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artistId) REFERENCES users(id),
  FOREIGN KEY (venueId) REFERENCES venue_profiles(id)
);

-- Track artist views by venues
CREATE TABLE venue_artist_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venueId INT NOT NULL,
  artistId INT NOT NULL,
  viewedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venueId) REFERENCES venue_profiles(id),
  FOREIGN KEY (artistId) REFERENCES artist_profiles(id)
);

-- Wishlists/Favorites
CREATE TABLE artist_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  artistId INT NOT NULL,
  venueId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (artistId, venueId),
  FOREIGN KEY (artistId) REFERENCES users(id),
  FOREIGN KEY (venueId) REFERENCES venue_profiles(id)
);

CREATE TABLE venue_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venueId INT NOT NULL,
  artistId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (venueId, artistId),
  FOREIGN KEY (venueId) REFERENCES venue_profiles(id),
  FOREIGN KEY (artistId) REFERENCES artist_profiles(id)
);
```

---

## Current Foundation (Already Implemented)

✅ **Venue Router Structure:**
- `venue.search` - Supports all filters (location, type, capacity, rating)
- `venue.getById` - Get single venue details
- `venue.getFeatured` - Get top-rated venues
- `venue.getByLocation` - Get venues by location
- `venue.getVenueTypes` - Get all venue type options
- `venue.incrementViews` - Track analytics

✅ **VenueBrowse Component:**
- Fetches from database via TRPC
- Full filtering UI (location, type, capacity, rating)
- Search functionality
- Share buttons (Facebook, Twitter, LinkedIn)
- Copy link functionality
- Responsive grid layout

✅ **Artist Browse Component:**
- Already has artist search via `artist.search` TRPC endpoint
- Similar filtering capabilities

---

## Migration Checklist

When ready to implement role-based browsing:

- [ ] Create `artistProcedure` and `venueProcedure` in TRPC core
- [ ] Update `venue.search` to use `artistProcedure`
- [ ] Update `artist.search` to use `venueProcedure`
- [ ] Update VenueBrowse.tsx with role check
- [ ] Update Browse.tsx with role check
- [ ] Add analytics tables to database
- [ ] Create TRPC endpoints for favorites/wishlists
- [ ] Add UI for favorites/wishlists
- [ ] Test with real artist and venue accounts
- [ ] Update documentation

---

## Benefits of Role-Based Browsing

1. **Better UX** - Users only see relevant content
2. **Reduced Noise** - Artists don't see artist listings, venues don't see venue listings
3. **Analytics** - Track which venues/artists are most viewed
4. **Recommendations** - Build recommendation engine based on view history
5. **Trust** - Ensures proper use of the platform

---

## Notes

- Current implementation is **intentionally open** for MVP testing
- All infrastructure is ready for role-based restrictions
- Just need to change `publicProcedure` to `artistProcedure`/`venueProcedure`
- No database schema changes needed for basic role-based browsing
- Analytics tables are optional but recommended for future features
