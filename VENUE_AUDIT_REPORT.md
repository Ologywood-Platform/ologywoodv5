# Venue Functionality Audit Report

**Date:** February 19, 2026  
**Status:** CRITICAL ISSUES FOUND - Requires Systematic Repair

---

## Executive Summary

The Venue functionality is **severely fragmented and incomplete**. Venue endpoints are scattered throughout `server/routers.ts` (lines 405-661) instead of being in a dedicated router file. The stub venue router (line 1834) returns empty implementations, causing the dashboard to fail. Multiple disabled components and commented-out code indicate incomplete implementation.

**Critical Issues:** 5  
**High Priority Issues:** 8  
**Medium Priority Issues:** 12  

---

## 1. BACKEND ARCHITECTURE ISSUES

### 1.1 Fragmented Venue Router
**Problem:** Venue endpoints are defined inline in `server/routers.ts` (lines 405-661) instead of a dedicated file.

**Current State:**
- Lines 405-661: Venue profile management endpoints (search, getMyProfile, createProfile, updateProfile, uploadProfilePhoto, etc.)
- Line 1834: Stub venue router with empty implementations
- No dedicated `server/routers/venue.ts` file

**Impact:** 
- Frontend calls `trpc.venue.getMyProfile()` but gets `null` from stub
- Code duplication and maintenance nightmare
- Difficult to extend or debug

**Endpoints Found:**
- `search` - Public venue search
- `getVenueTypes` - Returns hardcoded array
- `getMyProfile` - Returns null (stub)
- `getById` - Get venue profile by ID
- `createProfile` - Create venue profile
- `updateProfile` - Update venue profile
- `uploadProfilePhoto` - Upload profile photo
- `addGalleryPhoto` - Add photo to gallery
- `removeGalleryPhoto` - Remove photo from gallery
- `sendVerificationEmail` - Send verification email
- `verifyEmail` - Verify email with token

### 1.2 Disabled/Commented Code
**Problem:** Multiple venue features are commented out or disabled:

```typescript
// Line 528: profilePhotoUrl field not available on venue profile
// await db.updateVenueProfile(profile.id, { profilePhotoUrl: url });

// Lines 559-566: mediaGallery field not available on venue profile
// const currentGallery = profile.mediaGallery || { photos: [], videos: [] };
// const updatedPhotos = [...(currentGallery.photos || []), url];
// await db.updateVenueProfile(profile.id, {
//   mediaGallery: { photos: updatedPhotos, videos: [] },
// });
```

**Root Cause:** Schema mismatch - venue profile schema doesn't have these fields

### 1.3 Database Functions Missing
**Problem:** Frontend calls endpoints that don't exist:

- `getMyVenueBookings` - Called by dashboard, but endpoint returns empty
- `getVenueBookings` - Exists but not properly integrated
- `getVenueProfileByToken` - Called in verifyEmail but may not exist

### 1.4 Booking Router Integration
**Problem:** Booking endpoints are scattered:

- Lines 728-850+: Booking management inline in routers.ts
- `booking.create` - Create booking request (venue)
- `booking.getMyVenueBookings` - Get venue's bookings
- `booking.getMyArtistBookings` - Get artist's bookings
- `booking.updateStatus` - Update booking status
- `booking.getById` - Get booking details

---

## 2. FRONTEND ISSUES

### 2.1 VenueDashboard Component (Minimal Implementation)
**File:** `client/src/pages/VenueDashboard.tsx`

**Current State:**
- Shows welcome message and organization name
- Settings button shows "Settings component disabled"
- Quick actions buttons navigate but don't load data
- Calls `trpc.venue.getMyProfile()` which returns null
- Calls `trpc.booking.getMyVenueBookings()` which returns empty array

**Missing Features:**
- Venue profile display
- Bookings management
- Messages
- Settings/profile editor
- Calendar view
- Analytics/stats

### 2.2 Disabled Components
**Files:**
- `client/src/components/VenueAccountSettings.tsx.disabled` - Settings component
- `client/src/components/VenueCalendar.tsx` - Calendar (exists but not used)
- `client/src/components/VenueProfileEditor.tsx` - Profile editor (exists but not used)

### 2.3 Incomplete Pages
**Files:**
- `client/src/pages/VenueOnboarding.tsx` - Onboarding flow
- `client/src/pages/VenueProfile.tsx` - Public profile
- `client/src/pages/VenueProfileDetail.tsx` - Profile detail
- `client/src/pages/VenueInvoiceDashboard.tsx` - Invoice dashboard
- `client/src/pages/VenueBrowse.tsx` - Browse artists

---

## 3. DATA FLOW ISSUES

### 3.1 Stub Router Returns Empty Data
```typescript
// Current stub (line 1834)
venue: router({
  search: publicProcedure.query(() => []),           // Returns empty array
  getVenueTypes: publicProcedure.query(() => []),    // Returns empty array
  getMyProfile: protectedProcedure.query(() => null), // Returns null
} as any),
```

### 3.2 Frontend Expects Data That Isn't Returned
```typescript
// VenueDashboard.tsx line 15
const { data: venueProfile } = ((trpc.venue as any)?.getMyProfile?.useQuery?.() || { data: null });
// Gets null from stub, so venueProfile is always null
```

### 3.3 Missing Booking Endpoints
- Frontend calls `booking.getMyVenueBookings()` 
- Backend has implementation but it's inline in routers.ts
- Not properly exposed through the stub venue router

---

## 4. CODE QUALITY ISSUES

### 4.1 Duplication
- Venue endpoints defined in two places (inline + stub)
- Similar patterns repeated for artist and venue (could be abstracted)
- Profile upload logic duplicated for artist and venue

### 4.2 Inconsistent Error Handling
- Some endpoints throw TRPCError, others don't
- No consistent validation
- Missing null checks in several places

### 4.3 Commented-Out Code
- Lines 528, 559-566, 587, 615, 646: Commented venue profile updates
- Indicates incomplete feature implementation
- Creates confusion about what's actually supported

---

## 5. SCHEMA MISMATCH ISSUES

### 5.1 Missing Fields on Venue Profile
**Expected by code but not in schema:**
- `profilePhotoUrl` - For profile photo
- `mediaGallery` - For photo gallery
- `emailVerificationToken` - For email verification
- `emailVerificationSentAt` - For tracking verification
- `capacity` - Referenced in dashboard (line 104)
- `city` - Referenced in dashboard (line 95)

**Current Venue Profile Schema:**
```typescript
export const venueProfiles = mysqlTable("venue_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  bio: text("bio"),
  isListed: boolean("isListed").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
```

---

## 6. MISSING FUNCTIONALITY

### 6.1 Critical Features Not Implemented
- [ ] Venue profile photo upload and display
- [ ] Venue gallery management
- [ ] Email verification for venues
- [ ] Venue settings/account management
- [ ] Venue bookings calendar view
- [ ] Venue invoice generation
- [ ] Venue messaging system integration
- [ ] Venue analytics/dashboard stats

### 6.2 Partially Implemented
- [ ] Venue profile creation (works but incomplete)
- [ ] Venue profile updates (works but some fields disabled)
- [ ] Bookings management (exists but not exposed properly)
- [ ] Venue search (exists but returns empty from stub)

---

## 7. RECOMMENDED FIXES (Priority Order)

### Phase 1: Consolidate Backend (CRITICAL)
1. Create `server/routers/venue.ts` with all venue endpoints
2. Move inline venue code (lines 405-661) to new file
3. Remove stub venue router or replace with proper implementation
4. Ensure all endpoints are properly exported and mounted

### Phase 2: Fix Schema (HIGH)
1. Add missing fields to venue profile schema:
   - `profilePhotoUrl: text("profilePhotoUrl")`
   - `capacity: int("capacity")`
   - `city: varchar("city", { length: 255 })`
   - `emailVerificationToken: varchar("emailVerificationToken", { length: 255 })`
   - `emailVerificationSentAt: timestamp("emailVerificationSentAt")`
2. Run migrations to update database
3. Uncomment venue profile update code

### Phase 3: Fix Frontend (HIGH)
1. Enable VenueAccountSettings component
2. Implement venue profile display properly
3. Connect bookings data to dashboard
4. Add calendar view for bookings
5. Implement settings/profile editor

### Phase 4: Complete Missing Features (MEDIUM)
1. Venue photo upload and gallery
2. Email verification flow
3. Venue analytics dashboard
4. Invoice generation and management
5. Messaging system integration

---

## 8. CODE ORGANIZATION PLAN

### Current (Broken)
```
server/routers.ts (1883 lines)
├── Venue endpoints (lines 405-661) - INLINE
├── Booking endpoints (lines 728-850+) - INLINE
├── Artist endpoints - INLINE
└── venue: router stub (line 1834) - EMPTY

client/src/pages/
├── VenueDashboard.tsx - MINIMAL
├── VenueOnboarding.tsx - INCOMPLETE
├── VenueProfile.tsx - INCOMPLETE
└── ...
```

### Proposed (Clean)
```
server/routers/
├── venue.ts - ALL VENUE ENDPOINTS
├── booking.ts - ALL BOOKING ENDPOINTS
├── artist.ts - ALL ARTIST ENDPOINTS
└── ...

server/routers.ts
├── Import and mount all routers cleanly
└── ~200 lines instead of 1883

client/src/pages/
├── VenueDashboard.tsx - COMPLETE
├── VenueOnboarding.tsx - COMPLETE
├── VenueProfile.tsx - COMPLETE
└── ...
```

---

## 9. TESTING GAPS

- [ ] No tests for venue profile creation
- [ ] No tests for venue bookings
- [ ] No tests for venue search
- [ ] No tests for email verification
- [ ] No integration tests for venue dashboard

---

## 10. NEXT STEPS

1. **Immediate:** Create `server/routers/venue.ts` and consolidate all venue endpoints
2. **Immediate:** Fix schema to include missing fields
3. **Urgent:** Update VenueDashboard to properly display venue data
4. **Urgent:** Enable and fix VenueAccountSettings component
5. **Important:** Implement venue photo upload and gallery
6. **Important:** Complete email verification flow
7. **Important:** Add venue analytics to dashboard

---

## Summary

The Venue functionality is **fragmented and incomplete**. The main issues are:

1. **Architectural:** Venue endpoints scattered in main router file instead of dedicated module
2. **Schema:** Missing fields that code expects to exist
3. **Frontend:** Dashboard is minimal, settings disabled, data not loading
4. **Code Quality:** Duplication, commented-out code, inconsistent error handling

**Estimated effort to fix:** 16-20 hours of systematic refactoring and implementation

**Priority:** CRITICAL - Must be fixed before production launch
