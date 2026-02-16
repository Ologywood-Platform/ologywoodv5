# Phase 3 Audit Report: TRPC Router, Browse Enhancement, VenueCalendar Integration

## Current State Analysis

### 1. TRPC Router Structure
**Status:** No events router exists yet
- **Existing Routers:** 60+ routers in `/server/routers/` (artist, venue, booking, contract, etc.)
- **Pattern:** Each router exports a `router` object with procedures (query, mutation)
- **Main Router:** `/server/routers.ts` imports and merges all routers
- **Client Hook:** `trpc.{routerName}.{procedureName}.useQuery/useMutation()`

**What Needs to Be Built:**
- Create `/server/routers/events.ts` following existing router pattern
- Add event procedures: create, read, update, delete, search, saveEvent, getHistory, addPhoto
- Register in main routers.ts file

### 2. Browse Page Structure
**Status:** Artist-only browsing, no tabs
- **Current:** Single search + filter for artists only
- **Uses:** `trpc.artist.search.useQuery(filters)` 
- **Filter Component:** `<SearchFilters>` component exists for artist filters
- **No Tab Structure:** Browse.tsx is flat, no Tabs component used

**What Needs to Be Built:**
- Add Tabs component (already in UI library)
- Create "Artists" tab (move existing content)
- Create "Events" tab (use EventDiscovery component logic)
- Extend SearchFilters to handle both artist and event filters
- Use `trpc.events.search.useQuery()` for events tab

### 3. VenueCalendar Integration
**Status:** Calendar exists, shows bookings + artist availability
- **Current:** Displays bookings and favorited artists' availability
- **Uses:** `trpc.calendar.getVenueBookings()` and `trpc.calendar.getFavoritedArtistsAvailability()`
- **Grid Layout:** Month view with day cells
- **Interactions:** Message artists, navigate to bookings

**What Needs to Be Built:**
- Add events layer to calendar display
- Fetch posted events: `trpc.events.search()` with date range
- Display events as visual indicators on calendar days
- Add event click handler to show event details
- Color-code events vs bookings vs availability

## Reuse Strategy

### Components to Reuse
1. **EventCard** - Already built, can be used in Browse Events tab
2. **EventDiscovery** - Already built, can be adapted for Browse tab
3. **SearchFilters** - Extend existing component for event-specific filters
4. **VenueCalendar** - Extend existing calendar with event layer

### Code Patterns to Follow
1. **Router Pattern:** Follow existing router structure (artist.ts, venue.ts, etc.)
2. **TRPC Hooks:** Use `trpc.events.{procedure}.useQuery/useMutation()`
3. **Filter Pattern:** Extend SearchFilters component with event filter options
4. **Calendar Pattern:** Add event data fetch alongside existing booking/availability fetches

## Implementation Plan

### Phase 3 Tasks (Updated)
1. **Create TRPC Events Router** - Add `/server/routers/events.ts` with full CRUD + search procedures
2. **Extend SearchFilters** - Add event-specific filter options (type, capacity, rate range)
3. **Add Tabs to Browse** - Create Artists/Events tabs, move content accordingly
4. **Integrate Events into Browse** - Use EventDiscovery logic in Events tab
5. **Extend VenueCalendar** - Add event visualization layer
6. **Test Integration** - Verify all TRPC calls work end-to-end

## Risk Mitigation
- ✅ No duplicate router code (follow existing patterns)
- ✅ Reuse existing components where possible
- ✅ Extend SearchFilters instead of creating new filter component
- ✅ Leverage existing calendar infrastructure
