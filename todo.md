# Ologywood Platform TODO

## Database & Schema
- [x] Update database schema with artist profiles, venue profiles, rider templates, availability, bookings, and messages tables
- [x] Push database migrations

## Artist Features
- [x] Artist profile creation and editing (bio, photos, genre, location, social links)
- [ ] Media upload system for photos, videos, and press kit materials
- [ ] Rider template CRUD (create, read, update, delete) with technical and hospitality requirements
- [x] Artist dashboard showing bookings and profile stats

## Availability & Calendar
- [ ] Visual availability calendar component
- [ ] Mark dates as available/booked/unavailable
- [ ] Real-time calendar sync to prevent double-bookings
- [ ] Automatic date blocking when booking is confirmed

## Booking System
- [x] Booking request form for venues
- [x] Booking management dashboard (pending, confirmed, completed)
- [x] Accept/decline booking functionality for artists
- [ ] Booking status updates and tracking
- [x] Double-booking prevention logic

## Search & Discovery
- [x] Artist search page with filters (genre, location, availability)
- [x] Artist listing cards with key information)
- [x] Browse all artists functionality

## Communication
- [ ] In-platform messaging system for each booking
- [ ] Message thread UI with real-time updates
- [ ] Email notifications for booking requests
- [ ] Email notifications for booking confirmations
- [ ] Email notifications for cancellations
- [ ] Event reminder emails (7 days, 3 days, 1 day before)

## Payments & Subscriptions
- [ ] Stripe subscription integration for artists ($29/month Basic plan)
- [ ] Subscription checkout flow
- [ ] Subscription status management
- [ ] Optional Stripe Connect for booking deposits (future enhancement)

## UI/UX & Design
- [x] Design system and color palette selection
- [x] Landing page for platform introduction
- [x] Navigation structure (public vs authenticated)
- [x] Responsive design for mobile and tablet
- [x] Loading states and error handling
- [ ] Success messages and user feedback

## Authentication & Roles
- [x] Role-based access (artist vs venue)
- [x] Artist-only features protection
- [x] Venue-only features protection
- [ ] Profile completion checks

## Bug Fixes
- [x] Fix nested anchor tag error on homepage (Link wrapping <a> elements)

## Onboarding
- [x] Artist onboarding wizard with multi-step form
- [x] Venue onboarding wizard with multi-step form
- [x] Role selection page for new users
- [x] Redirect logic to onboarding when profile is incomplete

## Photo Upload
- [x] Add photo upload API endpoint using S3 storage
- [x] Integrate photo upload into artist onboarding wizard
- [x] Display uploaded photo preview in onboarding

## Profile Photo Display
- [x] Display artist photos on browse page
- [x] Show photos in search results
- [x] Add photos to artist cards in dashboard
- [x] Add fallback avatar for artists without photos

## Availability Calendar
- [x] Create interactive calendar component with date selection
- [x] Add availability management page to artist dashboard
- [x] Display read-only calendar on artist profile pages
- [x] Visual indicators for available, booked, and unavailable dates
- [x] Prevent double-booking when confirming bookings

## Rider Template Manager
- [x] Create rider template management page with list view
- [x] Build rider template form with technical requirements section
- [x] Add hospitality requirements section to rider form
- [x] Implement create, edit, delete operations for rider templates
- [x] Integrate rider templates into booking workflow
- [x] Display rider details in booking requests

## Stripe Subscription System
- [x] Add Stripe feature to project
- [x] Configure Stripe subscription products and pricing
- [x] Build subscription management UI
- [x] Implement payment flow with Stripe Checkout
- [x] Add subscription status tracking
- [x] Implement trial period logic
- [x] Configure Stripe webhook handler
- [x] Add subscription tab to artist dashboard
- [x] Add access control based on subscription status
- [x] Create subscription management page for artists

## Email Notifications
- [x] Set up email service configuration
- [x] Create email notification helper functions
- [x] Add booking request notification (to artist)
- [x] Add booking confirmation notification (to both parties)
- [x] Add booking cancellation notification (to both parties)
- [x] Add subscription created notification
- [ ] Add subscription trial ending notification (requires scheduled job)
- [ ] Add subscription renewal notification (handled by Stripe)
- [x] Add subscription canceled notification

## In-Platform Messaging
- [x] Create messaging UI component for booking conversations
- [x] Add message thread view to booking details
- [x] Integrate messaging into dashboard
- [ ] Add real-time message notifications
- [ ] Display unread message count

## Review and Rating System
- [x] Add reviews table to database schema
- [x] Create review API endpoints (create, get by artist, get by booking)
- [x] Build review submission form for completed bookings
- [x] Display reviews on artist profile pages
- [x] Show average rating and review count
- [ ] Add review moderation (optional)

## Review Response Feature
- [x] Add artistResponse field to reviews table
- [x] Add respondedAt timestamp field to reviews table
- [x] Create API endpoint for artists to respond to reviews
- [x] Build response form UI in artist dashboard
- [x] Display artist responses on profile pages below reviews
- [x] Add Reviews tab to artist dashboard with response functionality

## Review Response Notifications
- [x] Create email template for review response notifications
- [x] Add email notification function for venue when artist responds
- [x] Integrate notification into review response API endpoint
- [x] Test email delivery for review responses

## Unread Message Indicators
- [x] Add lastReadAt field to track when users last viewed messages
- [x] Create API endpoint to get unread message counts per booking
- [x] Add badge indicator to dashboard navigation showing total unread count
- [x] Add visual indicators to booking cards showing unread messages
- [x] Update message view to mark messages as read

## Venue Review System
- [x] Add venueReviews table to database schema
- [x] Create API endpoints for creating venue reviews (artist only)
- [x] Create API endpoints for fetching venue reviews
- [x] Add venue review form for artists on completed bookings
- [x] Display submitted venue reviews on booking detail page
- [x] Add API endpoint for average venue rating and review count
- [x] Add venue response capability to venue reviews

## Venue Profile Pages
- [x] Create VenueProfile page component with route
- [x] Display venue information (name, contact, phone, website)
- [x] Display aggregate venue rating and review count
- [x] List all venue reviews from artists with ratings
- [x] Show venue responses to reviews
- [x] Add link to venue profiles from booking pages
- [x] Allow venue owners to respond to reviews directly on profile page

## Venue Review Email Notifications
- [x] Create email template for venue review notifications
- [x] Add email notification function for venue when artist submits review
- [x] Integrate notification into venue review creation API endpoint
- [x] Test email delivery for venue reviews

## Photo and Media Upload Feature
- [x] Add photos array field to artist profiles schema
- [x] Add photos array field to venue profiles schema
- [x] Create API endpoints for uploading photos to S3
- [x] Create API endpoints for deleting photos
- [x] Build photo upload component with drag-and-drop
- [x] Add photo gallery display to artist profile pages
- [x] Add photo gallery display to venue profile pages
- [x] Add photo management UI in dashboard

## Advanced Search Filters
- [x] Enhance search API to support price range filtering
- [x] Add availability date filtering to search API
- [x] Create SearchFilters component with price range slider
- [x] Add date picker for availability filtering
- [x] Add location search filter
- [x] Integrate filters with browse page
- [x] Add filter reset functionality

## Favorites/Wishlist System
- [x] Create favorites table in database schema
- [x] Add API endpoints for adding/removing favorites
- [x] Add API endpoint to get user's favorited artists
- [x] Add favorite/unfavorite button to artist profile pages
- [x] Add favorite button to artist cards on browse page
- [x] Create Saved Artists tab in venue dashboard
- [x] Display favorited artists with unfavorite option

## Availability Update Notifications
- [x] Create email template for availability update notifications
- [x] Add function to get venues who favorited an artist
- [x] Send email notifications when artist adds availability
- [x] Integrate notification into availability creation API

## Booking Request Templates
- [x] Create bookingTemplates table in database schema
- [x] Add API endpoints for creating/updating/deleting templates
- [x] Add API endpoint to get user's templates
- [x] Create template management UI in venue dashboard
- [x] Add template selector to booking request form
- [x] Auto-fill booking form fields from selected template
- [x] Allow editing template values before submitting booking

## Artist Analytics Dashboard
- [x] Create profileViews table to track artist profile visits
- [x] Add view tracking to artist profile page
- [x] Create API endpoints for analytics data (views, bookings, revenue)
- [x] Build analytics dashboard component with charts
- [x] Display profile view count and trends
- [x] Show booking request metrics (total, pending, confirmed, conversion rate)
- [x] Display revenue trends over time
- [x] Add Analytics tab to artist dashboard

## Automated Booking Reminders
- [x] Create bookingReminders table to track sent reminders
- [x] Create email templates for 7-day, 3-day, and 1-day reminders
- [x] Build API endpoint to check and send due reminders
- [x] Add cron job or scheduled task to run reminder checks daily
- [x] Send reminders to both artist and venue with event details
- [x] Track sent reminders to avoid duplicates

## Calendar View for Venues
- [x] Create API endpoint to get venue's bookings by date range
- [x] Create API endpoint to get favorited artists' availability
- [x] Build calendar component with monthly view
- [x] Display confirmed bookings on calendar
- [x] Display pending requests on calendar
- [x] Show favorited artists' availability dates
- [x] Add color coding for different event types
- [x] Add Calendar tab to venue dashboard
- [x] Add click-through to booking details from calendar events

## Calendar Direct Messaging
- [x] Add message dialog to artist availability slots in calendar
- [x] Create quick message form with pre-filled context
- [x] Allow venues to send messages directly from calendar
- [x] Create new booking conversation when messaging from calendar
- [x] Add visual feedback for sent messages

## Stripe Payment Integration
- [x] Add payment tracking fields to bookings table (paymentStatus, depositAmount, depositPaidAt, fullPaymentAt, stripePaymentIntentId, stripeRefundId)
- [x] Create Stripe checkout session API endpoint for deposits
- [x] Create Stripe checkout session API endpoint for full payments
- [x] Add payment webhook handler for Stripe events
- [x] Build payment button UI on booking detail page
- [x] Add payment status badges and indicators
- [x] Implement refund API endpoint
- [x] Generate and email payment receipts automatically
- [x] Add payment history view in dashboard
