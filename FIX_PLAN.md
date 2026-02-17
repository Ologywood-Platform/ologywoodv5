# Ologywood Platform: Complete Fix Plan

**Objective:** Fix all ⚠️ and ❌ issues from comprehensive audit to prepare for user launch and growth.

**Timeline:** 2-4 weeks for critical fixes, 4-8 weeks for complete implementation

---

## CRITICAL ISSUES (Fix Before Launch)

### 1. Delete 40+ Disabled Routers
**Status:** ❌ BLOCKER  
**Impact:** HIGH - Reduces confusion, faster builds, cleaner codebase  
**Effort:** 2-3 hours  
**Files to Delete:**
```
server/routers/
  ❌ contracts.ts
  ❌ contractManagement.ts
  ❌ contractAudit.ts
  ❌ contractHistoryRouter.ts
  ❌ contractTemplateRouter.ts
  ❌ contractPdf.ts
  ❌ analytics.ts
  ❌ analyticsRouter.ts
  ❌ paymentAnalyticsRouter.ts
  ❌ bookingAnalyticsExport.ts
  ❌ referrals.ts
  ❌ referralRewards.ts
  ❌ verification.ts
  ❌ artistVerificationRouter.ts
  ❌ venueVerification.ts
  ❌ templates.ts
  ❌ notifications.ts
  ❌ realtimeNotifications.ts
  ❌ realtimeNotificationsRouter.ts
  ❌ smsNotificationsRouter.ts
  ❌ impersonation.ts
  ❌ testdata.ts
  ❌ testdata-seeding.ts
  ❌ admin-seed.ts
  ❌ ai-chat.ts
  ❌ availabilityAlerts.ts
  ❌ bookingEscrow.ts
  ❌ bulkContractRouter.ts
  ❌ contact.ts
  ❌ contract-audit.ts
  ❌ contract-management.ts
  ❌ feedback.ts
  ❌ helpAndSupport.ts
  ❌ helpCenterRouter.ts
  ❌ newsletter.ts
  ❌ test-workflows.ts
  ❌ unsubscribeRouter.ts
  ❌ webhookRouter.ts
  ❌ artistOnboarding.ts
  ❌ verificationRouter.ts
```

**Steps:**
1. Delete all files listed above
2. Remove commented-out imports from `server/routers.ts`
3. Verify no other files import these routers
4. Test build completes successfully

**Verification:**
```bash
grep -r "from.*routers/" server/ | grep -v "appRouter"
# Should return only imports of mounted routers
```

---

### 2. Consolidate Subscription Tables
**Status:** ⚠️ DUPLICATE DATA  
**Impact:** HIGH - Prevents data sync issues  
**Effort:** 3-4 hours  
**Current State:**
- `userSubscriptions` - Stripe subscription data (id, stripeCustomerId, status, etc.)
- `subscriptions` - Unknown purpose (need to audit)

**Steps:**
1. Audit `subscriptions` table to understand its purpose
2. Migrate data from `subscriptions` to `userSubscriptions` if needed
3. Update all queries to use `userSubscriptions` only
4. Drop `subscriptions` table
5. Create migration file

**Verification:**
```bash
grep -r "subscriptions" server/ | grep -v "userSubscriptions"
# Should return no results
```

---

### 3. Add Database Indexes
**Status:** ⚠️ PERFORMANCE  
**Impact:** HIGH - Improves query performance  
**Effort:** 1-2 hours  
**Indexes to Add:**
```sql
-- Artist queries
CREATE INDEX idx_artistProfiles_userId ON artistProfiles(userId);
CREATE INDEX idx_availability_artistId ON availability(artistId);
CREATE INDEX idx_availability_date ON availability(date);

-- Booking queries
CREATE INDEX idx_bookings_venueId ON bookings(venueId);
CREATE INDEX idx_bookings_artistId ON bookings(artistId);
CREATE INDEX idx_bookings_eventDate ON bookings(eventDate);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Event queries
CREATE INDEX idx_events_artistId ON events(artistId);
CREATE INDEX idx_events_eventDate ON events(eventDate);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_location ON events(location);

-- Message queries
CREATE INDEX idx_messages_senderId ON messages(senderId);
CREATE INDEX idx_messages_recipientId ON messages(recipientId);
CREATE INDEX idx_messages_createdAt ON messages(createdAt);

-- Follow queries
CREATE INDEX idx_follows_followerId ON follows(followerId);
CREATE INDEX idx_follows_followingId ON follows(followingId);
```

**Steps:**
1. Create migration file with indexes
2. Apply migration to database
3. Verify indexes were created
4. Test query performance

---

### 4. Resolve OAuth Redirect URI Issue
**Status:** ✅ ESCALATED TO MANUS SUPPORT  
**Impact:** CRITICAL - Blocking user logins  
**Current Action:** Waiting for Manus Support response  
**Workaround:** Users can access via manus.space domain temporarily

**Once Fixed:**
- Test email sign-in flow
- Verify redirect to custom domain works
- Update documentation

---

## HIGH PRIORITY ISSUES (Before 10K Users)

### 5. Create ARCHITECTURE.md
**Status:** ❌ MISSING  
**Impact:** MEDIUM - Helps onboarding, reduces confusion  
**Effort:** 2-3 hours  
**Content:**
```markdown
# Ologywood Architecture

## Folder Structure
- `/server` - Backend (TRPC routers, database, services)
- `/client/src` - Frontend (React components, pages)
- `/drizzle` - Database schema and migrations

## Data Flow
1. User action in React component
2. Component calls TRPC procedure
3. TRPC router validates input with Zod
4. Router calls database functions
5. Response returned to component
6. Component updates UI

## Adding New Features
1. Add database table to schema.ts
2. Create database functions in db.ts
3. Create TRPC router in routers/
4. Mount router in routers.ts
5. Create React components in client/src
6. Connect components to TRPC

## Off-Limit Areas
- Don't modify auth.ts (OAuth flow)
- Don't add new disabled routers
- Don't duplicate database tables
```

**Steps:**
1. Create ARCHITECTURE.md in root
2. Document folder structure
3. Document data flow with diagram
4. Document how to add new features
5. Document off-limit areas

---

### 6. Add Rate Limiting
**Status:** ❌ MISSING  
**Impact:** HIGH - Prevents API abuse  
**Effort:** 2-3 hours  
**Implementation:**
```typescript
// server/_core/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.use('/api/auth/', authLimiter);
```

**Steps:**
1. Install `express-rate-limit`
2. Add rate limiting middleware
3. Configure limits for different endpoints
4. Test rate limiting works
5. Document rate limits

---

### 7. Split SearchFilters Component
**Status:** ⚠️ DUAL MODE  
**Impact:** MEDIUM - Improves maintainability  
**Effort:** 2-3 hours  
**Current:** Single SearchFilters component with conditional rendering  
**Target:** Two separate components

**Steps:**
1. Create `ArtistSearchFilters.tsx` (genre, location, price, availability)
2. Create `EventSearchFilters.tsx` (eventType, location, capacity, rate, date)
3. Update Browse.tsx to use appropriate filter component
4. Remove filterType prop from SearchFilters
5. Test both filter sets work correctly

---

## MEDIUM PRIORITY ISSUES (Before 100K Users)

### 8. Implement Redis Caching
**Status:** ❌ MISSING  
**Impact:** HIGH - Reduces database load  
**Effort:** 4-6 hours  
**Cache Strategy:**
```
- Artist profiles: Cache for 1 hour
- Event listings: Cache for 30 minutes
- Venue profiles: Cache for 1 hour
- Search results: Cache for 5 minutes
```

**Implementation:**
1. Install Redis client
2. Create cache service
3. Add caching to frequently accessed queries
4. Implement cache invalidation
5. Test cache hits/misses

---

### 9. Add Comprehensive Test Suite
**Status:** ❌ MINIMAL TESTS  
**Impact:** HIGH - Prevents regressions  
**Effort:** 8-12 hours  
**Target Coverage:** 80%+

**Test Areas:**
1. **Authentication** - Login, logout, role-based access
2. **Bookings** - Create, update, cancel bookings
3. **Events** - Create, update, delete events
4. **Messaging** - Send, receive messages
5. **Payments** - Stripe integration, webhook handling
6. **API Validation** - Input validation, error handling

**Tools:**
- Vitest (unit tests)
- Playwright (E2E tests)

---

## LOW PRIORITY ISSUES (Nice to Have)

### 10. Add API Documentation
**Status:** ❌ MISSING  
**Impact:** MEDIUM - Helps developers  
**Effort:** 3-4 hours  
**Solution:** OpenAPI/Swagger documentation

### 11. Optimize Frontend Bundle
**Status:** ⚠️ NOT MEASURED  
**Impact:** MEDIUM - Improves load times  
**Effort:** 3-4 hours  
**Actions:**
- Lazy load routes
- Code splitting
- Image optimization
- Remove unused dependencies

### 12. Add Monitoring & Logging
**Status:** ❌ MISSING  
**Impact:** MEDIUM - Helps debugging  
**Effort:** 4-6 hours  
**Tools:** Sentry, LogRocket, or similar

---

## Implementation Order

### Week 1 (CRITICAL):
- [ ] Delete 40+ disabled routers
- [ ] Consolidate subscription tables
- [ ] Add database indexes
- [ ] Verify OAuth fix from Manus Support

### Week 2 (HIGH):
- [ ] Create ARCHITECTURE.md
- [ ] Add rate limiting
- [ ] Split SearchFilters component

### Week 3-4 (MEDIUM):
- [ ] Implement Redis caching
- [ ] Add comprehensive tests

### Week 5+ (LOW):
- [ ] Add API documentation
- [ ] Optimize frontend bundle
- [ ] Add monitoring/logging

---

## Success Criteria

✅ All CRITICAL issues fixed  
✅ All HIGH priority issues fixed  
✅ Zero TypeScript errors  
✅ All tests passing  
✅ OAuth working for user sign-up  
✅ Platform ready for user testing  

---

## Risk Assessment

| Issue | Risk | Mitigation |
|-------|------|-----------|
| Delete routers | Breaking imports | Grep search before deletion |
| Consolidate tables | Data loss | Backup database first |
| Add indexes | Performance impact | Test on staging first |
| Rate limiting | Legitimate users blocked | Set generous limits initially |
| Cache invalidation | Stale data | Implement proper invalidation |

---

## Rollback Plan

Each fix should have a corresponding git commit so we can rollback if needed:
```bash
git commit -m "CRITICAL: Delete disabled routers"
git commit -m "CRITICAL: Consolidate subscription tables"
git commit -m "CRITICAL: Add database indexes"
```

---

## Sign-Off

- [ ] All CRITICAL issues fixed
- [ ] All HIGH priority issues fixed
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Ready for user launch

---

*Plan created: February 17, 2026*  
*Target completion: March 3, 2026 (2-3 weeks)*
