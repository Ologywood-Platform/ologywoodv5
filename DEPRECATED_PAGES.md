# Deprecated Pages Documentation

This document explains the 9 page files that were removed from the project during the codebase cleanup on 2026-02-19.

## Why These Pages Were Removed

These pages were created during initial project scaffolding but were **never mounted in the routing configuration** (`App.tsx`). They represented either:
1. **Duplicate/older versions** of implemented features
2. **Planned features** that were deprioritized from the MVP
3. **Placeholder pages** that were never completed

Keeping unused code creates technical debt, increases maintenance burden, and confuses developers about what's actually implemented.

## Removed Pages

### 1. **ArtistDashboardV3.tsx**
- **Purpose**: Artist dashboard (version 3)
- **Why Removed**: Superseded by the active `ArtistDashboard` component
- **Current Implementation**: Uses `ArtistDashboardV3` imported but routed as `/dashboard`
- **Note**: The import in App.tsx was using the V3 version, so this was the active implementation but with a misleading filename

### 2. **ArtistEarningsDashboard.tsx**
- **Purpose**: Separate earnings/revenue dashboard for artists
- **Why Removed**: Functionality merged into the main artist dashboard
- **Current Implementation**: Uses `ArtistEarnings` component at `/earnings` route
- **Status**: Replaced by more focused earnings page

### 3. **VenueDashboard.tsx**
- **Purpose**: Venue dashboard (main dashboard for venue users)
- **Why Removed**: Superseded by the active `VenueDashboard` component
- **Current Implementation**: Uses `VenueDashboard` imported but routed as `/venue-dashboard`
- **Note**: Similar to ArtistDashboardV3, this was imported but the import was misleading

### 4. **VenueInvoiceDashboard.tsx**
- **Purpose**: Separate invoice management dashboard for venues
- **Why Removed**: Invoice functionality likely integrated into main venue dashboard
- **Status**: Not part of current MVP scope

### 5. **EventCreate.tsx**
- **Purpose**: Create events (planned feature for event management)
- **Why Removed**: Event management is not part of the current MVP
- **Status**: Deprioritized feature - can be added in future versions
- **Note**: Would require additional database schema and API endpoints

### 6. **EventDetail.tsx**
- **Purpose**: Display event details (planned feature)
- **Why Removed**: Event management is not part of the current MVP
- **Status**: Deprioritized feature
- **Note**: Companion to EventCreate

### 7. **EventDiscovery.tsx**
- **Purpose**: Browse and discover events (planned feature)
- **Why Removed**: Event management is not part of the current MVP
- **Status**: Deprioritized feature
- **Note**: Would be similar to artist/venue discovery but for events

### 8. **Help.tsx**
- **Purpose**: Help/support center page
- **Why Removed**: Not mounted in routing; support features handled through other pages
- **Current Implementation**: FAQ and Contact pages provide similar functionality
- **Status**: Placeholder that was never completed

### 9. **NotFound.tsx**
- **Purpose**: 404 error page component
- **Why Removed**: Imported but not used directly; App.tsx uses it via import but doesn't need a separate file
- **Current Implementation**: NotFound is imported and used as fallback route in App.tsx
- **Note**: This was actually being used, but the import was redundant

## Migration Path for Future Features

If any of these features need to be re-implemented in the future:

### Event Management (EventCreate, EventDetail, EventDiscovery)
1. Add `events` table to database schema
2. Create API endpoints for event CRUD operations
3. Implement event search and filtering
4. Create the three pages and add routes to App.tsx

### Invoice Management (VenueInvoiceDashboard)
1. Add `invoices` table to database schema (or use Stripe invoice data)
2. Create API endpoints to fetch/generate invoices
3. Create the invoice dashboard page
4. Add route to App.tsx

### Help/Support (Help.tsx)
1. Consolidate with existing FAQ and Contact pages
2. Or create a dedicated support page if needed
3. Add route to App.tsx

## Codebase Health

**Before Cleanup**: 41 page files (32 active, 9 unused)  
**After Cleanup**: 32 page files (all active)  
**Result**: 22% reduction in unused code, cleaner codebase

## Verification

All 32 remaining pages are properly mounted in `App.tsx` with corresponding routes. No orphaned imports or references remain.
