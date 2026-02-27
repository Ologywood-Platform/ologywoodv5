# Ologywood Platform - Production Audit TODO

## Phase 1: Code Quality & TypeScript (IN PROGRESS)

### Database Functions
- [x] Add getFavoritedArtistsAvailability stub
- [x] Add getPaymentHistory stub
- [x] Add recordRefund stub
- [x] Add getVenueBookingsByDateRange stub
- [x] Export all stubs from db.ts

### TypeScript Errors
- [x] Fix missing database function exports (4 errors resolved)
- [x] Fix client component type inference issues (56 errors → 0 errors)
  - [x] BookingTemplatesTab.tsx - template parameter type
  - [x] EmailPreferencesCenter.tsx - email preference types
  - [x] PaymentSection.tsx - deposit property types
  - [x] ReviewsTabContent.tsx - review data structure types
  - [x] VenueDashboard.tsx - artist possibly undefined
  - [x] VenueProfile.tsx - averageRating property names
  - [x] ArtistProfile.tsx - avgRating.average → avgRating.averageRating
  - [x] Browse.tsx - implicit any on genre filter
  - [x] dashboardUrl.ts - User type missing admin role
  - [x] db-stubs.ts - proper return types for calendar/email stubs

### Code Standards
- [x] Remove all console.log statements (175+ stale logs removed)
- [x] Add error boundaries to React components (page/section/component levels)
- [ ] Implement proper error handling in all API routes
- [ ] Add input validation to all endpoints

---

## Phase 2: Database & Data Integrity

### Data Quality
- [ ] Remove test data (4 test artists)
- [ ] Verify 6 production artists are correct
- [ ] Check for duplicate records
- [ ] Validate email addresses in database

### Performance
- [x] Add database indexes for common queries (70 indexes across 20+ tables)
- [ ] Optimize slow queries
- [ ] Test database with production load

---

## Phase 3: Critical Features Testing

### Artist Discovery & Browsing
- [ ] Test artist search functionality
- [ ] Verify filtering works correctly
- [ ] Check featured artists carousel
- [ ] Test pagination
- [ ] Verify artist profiles display correctly

### Booking Workflow
- [ ] Test complete booking creation flow
- [ ] Verify booking status updates
- [ ] Test booking cancellation
- [ ] Check booking notifications

### Payments (Stripe)
- [ ] Test Stripe integration in test mode
- [ ] Verify payment processing
- [ ] Test refund functionality
- [ ] Check payment history

### Messaging
- [ ] Test message sending between users
- [ ] Verify message notifications
- [ ] Check message history

---

## Phase 4: Security & Performance

### Security
- [ ] Verify HTTPS enforcement
- [ ] Check for SQL injection vulnerabilities
- [ ] Validate all user inputs
- [ ] Check for XSS vulnerabilities
- [ ] Verify sensitive data is encrypted

### Performance
- [ ] Measure page load times
- [ ] Check Core Web Vitals
- [ ] Optimize images
- [ ] Minify CSS/JS
- [ ] Enable caching

---

## Phase 5: UI/UX & Content

### Responsive Design
- [ ] Test on mobile devices (320px - 768px)
- [ ] Test on tablets (768px - 1024px)
- [ ] Test on desktop (1024px+)
- [ ] Verify touch interactions work

### Content
- [ ] Verify all text is correct and complete
- [ ] Check all links are working
- [ ] Verify all images are displaying
- [ ] Check email templates

---

## Phase 6: Final Production Readiness

### Deployment
- [ ] Verify custom domain is configured
- [ ] Check SSL certificate
- [ ] Test auto-scaling
- [ ] Verify backups are enabled

### Monitoring
- [ ] Set up application logging
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Create dashboards

### OAuth (Waiting for Manus)
- [ ] Waiting for Manus to register redirect URIs
- [ ] Test OAuth flow once URIs are registered

---

## Known Issues

- OAuth login blocked: Waiting for Manus support to register redirect URIs
  - Production: https://www.ologywood.com/api/oauth/callback
  - Dev: https://3000-i9qad3khhqtrn65ly2mg5-47d7cd70.us2.manus.computer/api/oauth/callback
- 0 TypeScript errors (all 56 fixed on Feb 24, 2026)
- 4 test artists still in database (should be removed)

---

## Archive

See `PRODUCTION_AUDIT.md` for detailed audit checklist and progress tracking.


## URGENT ISSUES

- [x] Fix missing artist images on homepage - featured artists showing "No image" placeholder
- [x] Verify artist profilePhotoUrl is being populated in database
- [x] Check if images are being loaded correctly for public/unauthenticated users


## DATA CLEANUP

- [x] Remove four test artists from production database (Retrieval Test Artist, Update Test Artist, etc.)
- [x] Verify follow functionality works for remaining artists
- [x] Test homepage displays only production artists (will show clean data on production)


## ARTIST PROFILE IMAGES

- [x] Add profile image for The Rhythm Kings from S3
- [x] Generate professional reggae band image for The Rhythm Kings
- [x] Upload to S3 and update database with CDN URL

## EMAIL INTEGRATION (SendGrid)

- [x] Create SendGrid email templates (booking confirmation, payment receipt, status updates)
- [x] Build email service integration layer
- [x] Integrate emails into booking workflow
- [x] Test email sending with test account
- [x] Add unsubscribe link to all emails
- [ ] Deploy and verify on production


## DATABASE CONNECTION FIX

- [x] Enhanced database connection with detailed logging
- [x] Added connection test endpoint (debug.testDatabase)
- [x] Fixed SSL configuration for TiDB compatibility
- [x] Verified dev server database connection working
- [ ] Deploy to production and verify artists display


## PRODUCTION DATABASE SETUP

- [ ] Run database migrations on production TiDB cluster
- [ ] Seed 6 production artists with complete data
- [ ] Verify all tables created successfully
- [ ] Verify artist data in production database
- [ ] Test production site displays artists


## PRODUCTION DEPLOYMENT FIX (Feb 24, 2026)

- [x] Fix www redirect causing infinite loop on Cloud Run (only redirect ologywood.com, not internal domains)
- [x] Fix static file serving path in vite.ts serveStatic()
- [x] Fix service worker caching old JS bundles - changed from cache-first to network-first strategy
- [x] Bump service worker cache version from v1 to v3 to invalidate old caches
- [x] Add service worker force-update on page load
- [x] Fix tRPC httpBatchLink causing 'Failed to fetch' on production - Cloudflare blocks batch=1 single query requests, switched to httpLink


## TYPESCRIPT ERROR CLEANUP (Feb 24, 2026)

- [x] Audit all 56 TypeScript errors and categorize by type
- [x] Fix server-side TypeScript errors (schema mismatches, missing properties)
- [x] Fix client-side TypeScript errors (component type inference)
- [x] Verify zero TypeScript errors after cleanup


## PRODUCTION POLISH (Feb 24, 2026)

- [x] Audit and remove all stale console.log statements from client code (62 removed, 0 remaining)
- [x] Audit and remove all stale console.log statements from server code (113+ removed, 36 essential kept)
- [x] Create React ErrorBoundary component (page/section/component levels)
- [x] Integrate ErrorBoundary into App.tsx wrapping 10 key routes
- [x] Add fallback UI for error states (full-page, card, inline variants)
- [x] Verify zero TypeScript errors after changes
- [x] Verify dev server working correctly


## DATABASE INDEXES (Feb 24, 2026)

- [x] Audit current schema and identify common query patterns
- [x] Add indexes for artist search (artistName, location, fee range)
- [x] Add indexes for bookings by user (artistId, venueId, status, eventDate, paymentStatus + composites)
- [x] Add indexes for messages (bookingId, senderId, recipientId + unread composite)
- [x] Add indexes for favorites (venueId, artistId + composite)
- [x] Add indexes for reviews (artistId, venueId, rating composite)
- [x] Add indexes for notifications, contracts, invoices, signatures, follows, profile_views, rider_templates, booking_templates, artist_payouts, artist_earnings
- [x] Push schema changes to database (70 total indexes created)
- [x] Verify indexes created successfully


## RIDER CONTRACT TEMPLATE SYSTEM (Feb 24, 2026)

- [x] Audit existing rider builder page and database schema
- [x] Design rider contract template data model with sections (technical, hospitality, stage, payment)
- [x] Create/update database schema for rider contract templates
- [x] Build API routes for CRUD operations on rider templates
- [x] Create pre-built default rider templates (Solo Artist, Band, DJ, Speaker)
- [x] Build Rider Contract Template Builder UI page
- [x] Add template selection and customization flow
- [x] Integrate rider templates into booking workflow
- [x] Add rider contract preview generation
- [x] Test all rider template functionality end-to-end

## E-SIGNATURE SUPPORT FOR RIDER CONTRACTS
- [x] Audit existing contract/signature schema and booking detail page
- [x] Design and implement rider_signatures database table
- [x] Build backend API routes for signing, verifying, and retrieving signatures
- [x] Build signature pad component (draw or type signature)
- [x] Build signing UI in booking detail page with rider preview
- [x] Integrate signatures into rider contract preview and PDF export
- [x] Write unit tests for e-signature functionality

## UX FIXES FROM COLLEAGUE'S OBSERVATIONS
- [x] Fix 1: Add clear X icon to search inputs (Home, Browse, SearchFilters location, ArtistSearchFilters, AdvancedSearchFilters)
- [x] Fix 2: Add empty state messages for blank sections (Events tab, Browse, VenueBrowse, EventDiscovery)
- [x] Fix 3: Improve no-results message visibility on search/filter (auto-scroll + prominent styling)
- [x] Fix 4: Scroll-to-top on route navigation changes

## STALE TEST CLEANUP
- [x] Delete redundant riderTemplateService.test.ts (covered by rider.test.ts)
- [x] Rewrite emailPreferences.test.ts to match current implementation

## WIRE UP REAL EMAIL PREFERENCES
- [x] Replace getEmailPreferences and createEmailPreferences stubs with real DB implementations
- [x] Add deleteEmailPreferences real implementation
- [x] Update all consumers (routers, Unsubscribe page, email settings) to use real functions
- [x] Write/update tests for the real email preferences functions

## WIRE UP REMAINING STUBS
- [x] Audit all remaining stubs in db-stubs.ts (22 stubs, 5 tables need creation)
- [x] Replace getUserById stub with real implementation
- [x] Replace setAvailability/deleteAvailability stubs with real implementations
- [x] Replace getPaymentHistory/recordRefund stubs with real implementations
- [x] Replace event-related stubs (getArtistEvents, searchPublicEvents, etc.)
- [x] Replace saved events stubs (saveEvent, removeSavedEvent, isEventSaved, getUserSavedEvents)
- [x] Replace event photos stubs (getEventPhotos, addEventPhoto, deleteEventPhoto)
- [x] Replace getVenueProfileByToken and getVenueBookingsByDateRange stubs
- [x] Replace getFavoritedArtistsAvailability stub

## EMAIL NOTIFICATION TRIGGERS
- [x] Add booking confirmation email trigger (already wired in routers.ts)
- [x] Add booking status change email trigger (already wired: confirmed + cancelled)
- [x] Add rider contract signing notification email (countersign request + fully-signed)
- [x] Add payment receipt email trigger (Stripe webhook: payment_intent.succeeded)
- [x] Add refund notification email trigger (Stripe webhook: charge.refunded)
- [x] Add review notification email triggers (already wired in routers.ts)
- [x] Add availability update notification (already wired in routers.ts)
- [x] Booking reminder email (already wired in routers.ts)
- [x] Respect user email preferences before sending any notification (emailService checks preferences)

## TRAINING DOCUMENTATION
- [x] Create e-signature process training document for artists and venues

## DASHBOARD ERROR FIXES (Feb 24, 2026)
- [x] Fix events table query failure (recreated 5 tables with correct column names matching Drizzle schema)
- [x] Fix venue user hitting artist-only endpoint on /dashboard (added role guards + auto-redirect)

## OAUTH CALLBACK FIX
- [x] Fix OAuth callback to match original reference implementation (simple redirect to /)
- [x] Remove custom state encoding/parsing that conflicted with SDK's decodeState
- [x] Remove role-based redirects from OAuth (handled by frontend routing instead)

## OPEN GRAPH LINK PREVIEW FIX
- [x] Add og:image, og:title, og:description meta tags to index.html (already existed, fixed URL)
- [x] Upload OG preview image to CDN for reliable access
- [x] Fix Twitter Card meta tags to use same CDN image

## PAGE-SPECIFIC OG TAGS & SITEMAP
- [x] Add server-side OG meta tag injection for artist profile pages (/artist/:id)
- [x] Add server-side OG meta tag injection for venue profile pages (/venue/:id, /venues/:id)
- [x] Add server-side OG meta tag injection for event pages (/events/:id)
- [x] Updated sitemap.xml to include events, venues browse, and pricing pages
- [x] robots.txt already existed with sitemap reference

## JSON-LD STRUCTURED DATA
- [x] Add JSON-LD to server-side OG middleware for crawlers (artist MusicGroup, venue EventVenue, event Event, homepage Organization+WebSite)
- [x] Add client-side JSON-LD React component for artist profile pages
- [x] Add client-side JSON-LD React component for venue profile pages (VenueProfile + VenueProfileDetail)
- [x] Add client-side JSON-LD React component for event detail pages
- [x] Add JSON-LD for homepage (Organization + WebSite + SearchAction schema)
- [x] Write tests for JSON-LD generation (13 tests passing)

## BREADCRUMBLIST & FAQ SCHEMA
- [x] Add BreadcrumbList JSON-LD generator utility
- [x] Inject BreadcrumbList into Home, Browse, Artist Profile, Venue Profile, Event Detail pages
- [x] Add server-side BreadcrumbList for crawlers in OG middleware (artist, venue, event pages)
- [x] Add FAQPage JSON-LD to the pricing page
- [x] Write tests for BreadcrumbList and FAQ schema generators (covered by existing 19 structured data tests)

## SIMILAR EVENTS FEATURE
- [x] Add backend API endpoint to find similar events (by event type, location, date proximity)
- [x] Build SimilarEvents frontend component with event cards
- [x] Integrate SimilarEvents component into EventDetail page
- [x] Write unit tests for similar events API and component (20 tests passing)
- [x] Verify TypeScript correctness and all tests passing (0 TS errors, 483 tests passing)

## HOME PAGE SEARCH FIX
- [x] Build ArtistSearchDropdown component (live autocomplete with artist cards)
- [x] Integrate dropdown into Home page search bar
- [x] Support Enter key to navigate to Browse page with query pre-filled
- [x] Ensure Browse page reads query param from URL on load
- [x] Write tests for search dropdown behavior (21 tests passing)

## BUG FIX: Book Artist button in Venue Dashboard
- [x] Investigate and fix non-functioning Book Artist button in Venue Dashboard Artist tab
- [x] Write/update tests to verify the fix (4 tests passing)

## BUG FIX: Invalid booking ID error on BookingCreate
- [x] Investigate and fix 'Invalid booking ID' error when navigating to /booking/create?artistId=X (route order collision)
- [x] Verify the full booking creation flow works end-to-end (5 tests passing)

## BUG FIX: Reviews not displaying for G.Chizo artist
- [x] Check database for existing reviews (reviews table is empty - user wasn't registered)
- [x] Investigate review display logic on artist profile page
- [x] Add "Sign up as a venue to leave a review" prompt for unauthenticated/non-venue users
- [x] Keep existing reviews publicly visible to all visitors
- [x] Write tests for review prompt states (11 tests passing)

## UX TWEAK: Review button text
- [x] Change "Write a Review" to "Leave a Review" for clarity

## WIRE REVIEWS TO BACKEND API
- [x] Review existing review schema and tRPC endpoints
- [x] Wire ReviewSystem form to backend create review mutation
- [x] Load persisted reviews from database on artist profile
- [x] Remove photo upload (keep it lean — text only for now)
- [x] Write tests and verify TypeScript correctness (20 tests passing)

## BUG FIX: Review submission error for venue users
- [x] Investigate server logs for review submission error (venue_profiles table empty)
- [x] Fix the root cause (use reviewerUserId instead of requiring venue profile)
- [x] Verify fix works end-to-end (23 tests passing, server running clean)

## BUG FIX: Empty link preview when sharing artist profile URLs
- [x] Investigate OG tag injection for artist profile pages (production SPA fallback bypasses middleware)
- [x] Fix the OG tag rendering issue (inject dynamic OG tags in serveStatic SPA fallback for bots)
- [x] Verify fix works with social media preview tools (543 tests passing, 0 TS errors)

## FOLLOW FEATURE
- [x] Create follows database table (already present in schema)
- [x] Add backend tRPC endpoints (follow, unfollow, isFollowing, getFollowerCount, getFollowedArtists)
- [x] Build Follow/Unfollow button on artist profile page
- [x] Display follower count on artist profile
- [x] Add "Fans" section in Artist Dashboard
- [x] Write tests for follow feature
- [x] Verify TypeScript correctness

## FAN + FOLLOW FEATURE
- [x] Add "fan" to user role enum in schema
- [x] Remove tier gate from follow/unfollow endpoints (free for all)
- [x] Build FollowButton component with auth-aware states (follow/unfollow/sign up)
- [x] Show "Sign Up to Follow" prompt for unauthenticated users
- [x] Show follower count on artist profile
- [x] Add email consent dialog when following ("By following, you agree to receive email updates")
- [x] Add FansSection to Artist Dashboard
- [x] Free tier: show follower count and names (emails blurred)
- [x] Paid tier: show full fan list with emails and CSV export
- [x] Add upgrade prompt for free tier artists to unlock email list
- [x] Write tests for fan + follow feature (32 tests passing, 575 total)
- [x] Verify TypeScript correctness (0 errors)

## FAN FOLLOW-UP FEATURES
- [x] Build fan email notification system (notify fans when artist creates events/updates profile)
- [x] Add notification trigger in event creation flow (public events only, fire-and-forget)
- [x] Add notification trigger in artist profile update flow
- [x] Include unsubscribe link in all fan notification emails (CAN-SPAM compliant)
- [x] Build "Following" page for fans to see all followed artists
- [x] Add route registration for /following in App.tsx
- [x] Verify full follow flow end-to-end (dev server running clean)
- [x] Write tests for all new features (23 tests passing, 598 total)

## NAVIGATION: Following Link
- [x] Add "Following" link to main navigation bar for logged-in users
- [x] Create reusable SiteHeader component with auth-aware nav (Following, Browse, Dashboard, Sign In)
- [x] Integrate SiteHeader into 7 key pages (Home, Browse, ArtistProfile, VenueProfile, EventDetail, EventDiscovery, Following)
- [x] Write 30 tests for SiteHeader component and page integration (631 total tests passing)

## SEND UPDATE FEATURE (Artist Email Blasts)
- [x] Design artist_updates database table (subject, body, sentAt, recipientCount, artistId)
- [x] Create tRPC endpoint for sending updates (paid-tier only)
- [x] Build email blast logic using existing fan notification service
- [x] Add rate limiting (prevent spam, e.g., max 1 update per day)
- [x] Build "Send Update" UI in Artist Dashboard Fans section
- [x] Add compose form with subject, body (rich text or plain), preview
- [x] Add send confirmation dialog
- [x] Show update history (past blasts with date, subject, recipient count)
- [x] Gate behind paid tier with upgrade prompt for free-tier artists
- [x] Write tests for backend and frontend integration (43 new tests, 674 total passing)
- [x] Verify TypeScript correctness (0 errors)

## PLATFORM CONTENT AUDIT
- [x] Audit homepage feature descriptions vs actual implemented features
- [x] Audit pricing page tier features vs actual tier gating (fixed Free/$0, Starter/$9, Professional/$29)
- [x] Audit get-started page claims vs actual onboarding flow
- [x] Audit footer links and content accuracy (fixed /cookie-policy → /cookies, added Events/Pricing/Following/Earnings/Invoices links)
- [x] Audit How It Works page (fixed /onboarding → /get-started CTA, added Step 6: Grow Your Fan Base)
- [x] Audit FAQ page (added 16 comprehensive topics covering all built features)
- [x] Audit Help page (fixed phone number, fixed email, added 6 new feature help articles)
- [x] Audit Trust Badges (removed 24/7 claim, toned down exaggerated claims)
- [x] Update outdated or inaccurate content across all pages
- [x] Ensure new features (Following, Send Update, E-Signatures, Events, Riders, Contracts) are mentioned where appropriate
- [x] Write 52 content audit tests (726 total tests passing, 0 TypeScript errors)

## SITEHEADER INTEGRATION — Remaining Pages
- [x] Add SiteHeader to Contact page
- [x] Add SiteHeader to Help page
- [x] Add SiteHeader to How It Works page
- [x] Verify TypeScript and run tests (726 passing, 0 TS errors)

## MOBILE HAMBURGER MENU
- [x] Add hamburger icon toggle for mobile screens (<768px)
- [x] Create slide-down/overlay mobile menu with all nav links
- [x] Close menu on link click and outside tap
- [x] Ensure smooth animation and accessible markup

## STRIPE SUBSCRIPTION CHECKOUT FROM PRICING PAGE
- [x] Create backend tRPC endpoint for subscription checkout session (updated to accept plan param)
- [x] Define Stripe products/prices for Starter ($9) and Professional ($29)
- [x] Wire Pricing page buttons to create checkout and redirect
- [x] Handle success/cancel redirects
- [x] Write tests for both features (43 new tests, 769 total passing, 0 TS errors)

## SUBSCRIPTION MANAGEMENT IN DASHBOARD
- [x] Create SubscriptionManagement component showing current plan, status, billing period
- [x] Show upgrade options for Free/Starter users
- [x] Add cancel/reactivate subscription functionality
- [x] Display trial info when applicable
- [x] Integrate into artist dashboard layout

## MOBILE-OPTIMIZED PRICING CARDS
- [x] Stack pricing cards vertically on mobile with swipeable carousel
- [x] Add plan indicator dots or tabs for mobile navigation
- [x] Ensure touch-friendly interactions
- [x] Write tests for both features (47 new tests, 816 total passing, 0 TS errors)
