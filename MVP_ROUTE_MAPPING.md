# Ologywood MVP Route Mapping

## Executive Summary
**Total Routes: 70+**
- **KEEP (MVP Core): 18 routes** - Essential for golden path
- **DISABLE (Future): 32 routes** - Non-essential, disable for now
- **DELETE (Conflicts): 20 routes** - Duplicate or conflicting features

---

## 🟢 KEEP - MVP CORE ROUTES (18)

### Authentication & Accounts
- ✅ `/` - Landing page
- ✅ `/get-started` - Signup entry point
- ✅ `/login` - OAuth login (already working)
- ✅ `/onboarding/artist` - Artist profile setup
- ✅ `/onboarding/venue` - Venue profile setup
- ✅ `/dashboard` - Main dashboard (artist/venue)

### Discovery
- ✅ `/browse` - Browse all artists
- ✅ `/artist/:id` - Artist profile view
- ✅ `/venue/:id` - Venue profile view
- ✅ `/venues` - Browse all venues

### Core Booking Flow
- ✅ `/bookings/create` - Create booking request
- ✅ `/bookings` - List user's bookings
- ✅ `/booking/:id` - Booking detail & acceptance
- ✅ `/booking-status` - Booking status tracking

### Rider System (Differentiator)
- ✅ `/rider-builder` - Create/edit riders
- ✅ `/saved-riders` - List saved riders
- ✅ `/riders` - Rider management

### Basic Communication
- ✅ `/messages` - Messaging list
- ✅ `/messages/:id` - Message thread

---

## 🟡 DISABLE (Future Features - 32 Routes)

These are valuable but NOT essential for MVP. Disable in router to reduce complexity.

### Analytics & Reporting
- ❌ `/artist-analytics` - Artist performance dashboard
- ❌ `/venue-analytics` - Venue performance dashboard
- ❌ `/analytics` - General analytics
- ❌ `/admin/support/metrics` - Support metrics dashboard
- ❌ `/admin/sla-tracking` - SLA tracking dashboard

### Payment & Subscription
- ❌ `/payments` - Payment history
- ❌ `/subscription` - Subscription management
- ❌ `/pricing` - Pricing page

### Advanced Features
- ❌ `/disputes` - Dispute resolution
- ❌ `/contracts/:id` - Contract management
- ❌ `/rider-documents` - Rider document storage
- ❌ `/referral` - Referral program
- ❌ `/verification` - Artist verification
- ❌ `/verify-certificate` - Certificate verification

### Admin Features
- ❌ `/admin/support` - Support ticket admin
- ❌ `/admin/support-team` - Support team management
- ❌ `/admin/sla-tracking` - SLA tracking

### Content & Marketing
- ❌ `/blog` - Blog/news
- ❌ `/tutorials` - Tutorial videos
- ❌ `/resources/artists` - Artist resources
- ❌ `/resources/venues` - Venue resources
- ❌ `/success-stories` - Success stories
- ❌ `/press` - Press kit
- ❌ `/careers` - Careers page
- ❌ `/partner` - Partner program
- ❌ `/pricing` - Pricing page
- ❌ `/venue-gallery` - Venue photo gallery
- ❌ `/venue-reviews` - Venue review system
- ❌ `/demo-venue` - Demo venue showcase

### Support
- ❌ `/support` - Support page
- ❌ `/support/create` - Create support ticket
- ❌ `/support/:id` - Support ticket detail
- ❌ `/help` - Help center

---

## 🔴 DELETE (Conflicts/Duplicates - 20 Routes)

These routes conflict with MVP focus or are redundant. Remove entirely.

### Duplicate Dashboards
- ❌ `/artist-dashboard` - Duplicate of `/dashboard`
- ❌ `/venue-dashboard` - Duplicate of `/dashboard`
- ❌ `/artist-profile-edit` - Use onboarding instead
- ❌ `/availability` - Manage in profile, not separate page

### Conflicting/Incomplete Features
- ❌ `/booking-calendar` - Conflicts with `/bookings`
- ❌ `/calendar` - Duplicate calendar
- ❌ `/contact` - Duplicate support
- ❌ `/contact-form` - Duplicate support
- ❌ `/tutorial-example` - Test route
- ❌ `/demo-venue` - Demo/test route
- ❌ `/upgrade` - Premature feature
- ❌ `/team` - Not MVP scope
- ❌ `/verify-email` - Handle in onboarding
- ❌ `/settings` - Handle in dashboard

### Legal/Meta (Keep but Don't Feature)
- ⚠️ `/privacy-policy` - Keep but don't link
- ⚠️ `/terms-of-service` - Keep but don't link
- ⚠️ `/cookies` - Keep but don't link
- ⚠️ `/accessibility` - Keep but don't link
- ⚠️ `/about` - Keep but don't link
- ⚠️ `/how-it-works-artist` - Simplify to onboarding
- ⚠️ `/how-it-works-venue` - Simplify to onboarding
- ⚠️ `/faq` - Integrate into help
- ⚠️ `/home` - Redirect to `/`

---

## 📋 Implementation Plan

### Step 1: Disable Routes in App.tsx
Comment out or remove route definitions for all DISABLE and DELETE routes.

### Step 2: Disable Endpoints in routers.ts
Comment out TRPC endpoints that aren't in KEEP list.

### Step 3: Remove Unused Services
- Disable `recommendationsService` (already done)
- Disable `referralRewardsService` (already done)
- Disable `riderReminderService` (already done)
- Disable `analyticsService` (if exists)
- Disable `disputeService` (if exists)

### Step 4: Simplify Navigation
- Remove links to disabled routes from dashboards
- Simplify header/footer navigation
- Focus on golden path only

### Step 5: Test Golden Path
- Artist: Sign up → Profile → Rider → Booking request
- Venue: Sign up → Browse → Accept booking

---

## 🎯 Expected Outcome

**Before MVP Reduction:**
- 70+ routes
- 30+ database tables
- 567+ TypeScript errors
- Complex navigation
- Unstable experience

**After MVP Reduction:**
- 18 core routes
- 12-15 essential tables
- <50 TypeScript errors
- Clear golden path
- Stable, testable product

---

## 📊 Route Category Breakdown

| Category | KEEP | DISABLE | DELETE | Total |
|----------|------|---------|--------|-------|
| Auth/Accounts | 6 | 0 | 2 | 8 |
| Discovery | 4 | 2 | 3 | 9 |
| Booking | 4 | 3 | 2 | 9 |
| Riders | 3 | 0 | 0 | 3 |
| Communication | 2 | 1 | 0 | 3 |
| Analytics | 0 | 5 | 1 | 6 |
| Payments | 0 | 3 | 1 | 4 |
| Admin | 0 | 3 | 2 | 5 |
| Content/Marketing | 0 | 12 | 8 | 20 |
| Support | 0 | 4 | 1 | 5 |
| **TOTAL** | **18** | **32** | **20** | **70** |

---

## Next Steps

1. ✅ Review this mapping with stakeholders
2. ⏳ Implement route disabling in code
3. ⏳ Test golden path end-to-end
4. ⏳ Document simplified architecture
5. ⏳ Create checkpoint with MVP-focused codebase
