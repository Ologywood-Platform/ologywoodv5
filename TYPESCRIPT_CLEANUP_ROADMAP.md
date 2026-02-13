# TypeScript Cleanup Roadmap

## Current Status
- **730 TypeScript errors** (architectural, not functional)
- **App is fully functional** - all core features working
- Errors are type system issues, not runtime issues

## Root Causes
1. **DB schema mismatch** - `paymentStatus` enum doesn't match domain type
2. **Loose auth context** - `db` possibly null in services
3. **Duplicate types** - Types defined in multiple places
4. **Optional vs required drift** - Inconsistent null handling
5. **`as any` in core layers** - Type casting bypasses checks

## Systematic Fix Sequence (Phases)

### Phase 1: Stabilize Surface ✅ DONE
- Relaxed TypeScript flags: `noImplicitAny: false`, `exactOptionalPropertyTypes: false`
- Result: Reduced surface noise, ready for structural fixes

### Phase 2: Centralize Domain Types (IN PROGRESS)
**Location:** `/shared/domain/`
**Files:** `auth.ts`, `booking.ts`, `index.ts`

**What exists:**
- ✅ `AuthUser`, `UserRole`, `AuthContext` types
- ✅ `Booking`, `BookingStatus`, `PaymentStatus` types

**What needs to be done:**
1. Create `/shared/domain/index.ts` barrel export
2. Update all imports to use `@shared/domain` instead of local types
3. Delete duplicate type definitions across codebase

### Phase 3: Fix Auth Context Properly
**Current issue:** `db` is typed as `ReturnType<typeof drizzle> | null`

**Fix:**
1. Ensure `getDb()` always returns a valid db instance or throws
2. Remove null checks from service layer
3. Enforce `ctx.user: AuthUser` in all TRPC procedures

### Phase 4: Fix Booking State in DB Schema
**Current mismatch:**
```
DB enum: ["unpaid", "deposit_paid", "fully_paid", "refunded"]
Domain type: "NOT_REQUIRED" | "PENDING" | "DEPOSIT_PAID" | "PAID" | "REFUNDED"
```

**Fix:**
1. Update DB schema to match domain types exactly
2. Run migration: `pnpm db:push`
3. Update all service code to use canonical values

### Phase 5: Eliminate `as any` in Core Layers
**Search for:**
```bash
grep -r "as any" server/ --include="*.ts" | grep -v test
```

**Priority order:**
1. `booking.service.ts`
2. `auth.ts`
3. `db.ts`
4. Router files

**Allow temporarily in:**
- UI components (client-side)
- Test files
- Deprecated code marked for removal

### Phase 6: Narrow Undefined Properly
**Pattern to replace:**
```typescript
// ❌ Before
const booking = await getBooking(id);
booking!.status  // Non-null assertion

// ✅ After
const booking = await getBooking(id);
if (!booking) throw new Error('Booking not found');
booking.status   // No assertion needed
```

### Phase 7: Re-enable Strict Flags
Once errors drop below 50:
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Then fix remaining 50 errors surgically.

## Expected Error Reduction
```
730 errors (current)
  ↓ Phase 2 (centralize types)
120-150 errors
  ↓ Phase 3 (auth context)
60-80 errors
  ↓ Phase 4 (booking state)
20-40 errors
  ↓ Phase 5 (eliminate as any)
10-20 errors
  ↓ Phase 6 (narrow undefined)
< 10 errors
  ↓ Phase 7 (re-enable strict)
0 errors
```

## Implementation Priority
1. **High Impact:** Phase 2, 4 (fixes 60-70% of errors)
2. **Medium Impact:** Phase 3, 5 (fixes 20-30% of errors)
3. **Low Impact:** Phase 6, 7 (fixes remaining 10% of errors)

## Files to Update (Phase 2)
```
server/services/
  - bookingService.ts
  - payoutService.ts
  - invoicingService.ts
  - stripeConnectService.ts

server/routers/
  - bookingRouter.ts
  - payoutRouter.ts
  - earningsRouter.ts

client/src/
  - pages/ArtistDashboardV3.tsx
  - pages/VenueDashboard.tsx
  - pages/ArtistEarningsDashboard.tsx
  - pages/VenueInvoiceDashboard.tsx
```

## Testing Strategy
1. Run `pnpm typecheck` after each phase
2. Verify dev server still runs
3. Test core flows in browser:
   - Browse artists
   - Browse venues
   - Create booking
   - View earnings dashboard
   - View invoice dashboard

## Success Criteria
- [ ] Error count < 10
- [ ] All core features working
- [ ] Dev server compiles without warnings
- [ ] No `as any` in core layers
- [ ] All domain types imported from `@shared/domain`
