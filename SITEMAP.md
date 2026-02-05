# Ologywood Platform Sitemap

## Public Pages

### Home & Discovery
- **Home** (`/`) - Landing page with featured artists, search, and CTA
- **Browse Artists** (`/browse`) - Artist search and discovery with filters
- **Browse Venues** (`/venues`) - Venue directory and discovery
- **Artist Profile** (`/artist/:id`) - Individual artist profile with reviews and availability
- **Venue Profile** (`/venue/:id`) - Individual venue profile with reviews

### Authentication & Onboarding
- **Get Started** (`/get-started`) - Role selection (Artist vs Venue)
- **Onboarding** (`/onboarding`) - Main onboarding flow
- **Artist Onboarding** (`/onboarding/artist`) - Artist profile setup wizard
- **Venue Onboarding** (`/onboarding/venue`) - Venue profile setup wizard
- **Email Verification** (`/verify-email`) - Email verification page
- **Certificate Verification** (`/verify-certificate`) - Artist/venue verification

### Legal & Support
- **Terms of Service** (`/terms`) - Platform terms and conditions
- **Privacy Policy** (`/privacy`) - Privacy and data protection policy
- **Cookie Policy** (`/cookies`) - Cookie usage and management
- **Accessibility Statement** (`/accessibility`) - WCAG 2.1 compliance information
- **Contact Us** (`/contact`) - Contact form and information
- **FAQ** (`/faq`) - Frequently asked questions
- **Help Center** (`/help`) - Support resources and documentation

## Artist Dashboard & Features

### Main Dashboard
- **Artist Dashboard** (`/artist-dashboard`) - Main artist hub with tabs
  - Overview tab - Quick stats and recent bookings
  - Bookings tab - Booking management
  - Calendar tab - Availability calendar
  - Messages tab - Conversations with venues
  - Reviews tab - Artist reviews and responses
  - Subscription tab - Subscription management
  - Analytics tab - Performance metrics

### Artist Features
- **Availability** (`/availability`) - Manage available dates
- **Rider Templates** (`/rider-templates`) - Create and manage rider templates
- **Rider Builder** (`/rider-builder`) - Advanced rider creation tool
- **Saved Riders** (`/saved-riders`) - View saved rider templates
- **Bookings** (`/bookings`) - View all bookings
- **Booking Detail** (`/booking/:id` or `/bookings/:id`) - Individual booking details
- **Messages** (`/messages`) - Message inbox
- **Messages Detail** (`/messages/:id`) - Individual conversation thread
- **Calendar** (`/calendar`) - Calendar view of bookings
- **Reviews** (`/reviews`) - Manage artist reviews and responses
- **Payments** (`/payments`) - View payment history
- **Settings** (`/settings`) - Account and profile settings
- **Artist Analytics** (`/artist-analytics`) - Detailed performance analytics

### Artist Subscription
- **Subscription** (`/subscription`) - Subscription management page
- **Upgrade Plan** (`/upgrade`) - Plan upgrade options

## Venue Dashboard & Features

### Main Dashboard
- **Venue Dashboard** (`/venue-dashboard`) - Main venue hub
- **Venue Analytics** (`/venue-analytics`) - Venue performance metrics
- **Venue Gallery** (`/venue-gallery`) - Manage venue photos
- **Venue Reviews** (`/venue-reviews`) - Manage venue reviews

### Venue Features
- **Bookings** (`/bookings`) - View all bookings
- **Booking Create** (`/bookings/create`) - Create new booking request
- **Booking Detail** (`/booking/:id`) - Individual booking details
- **Booking Calendar** (`/booking-calendar`) - Calendar view of bookings
- **Booking Calendar View** (`/booking-calendar`) - Alternative calendar view
- **Booking Status** (`/booking-status`) - Booking status dashboard
- **Messages** (`/messages`) - Message inbox
- **Messages Detail** (`/messages/:id`) - Individual conversation thread
- **Calendar** (`/calendar`) - Calendar view
- **Riders** (`/riders`) - View artist riders
- **Rider Documents** (`/rider-documents`) - Upload and manage rider documents
- **Payments** (`/payments`) - View payment history
- **Settings** (`/settings`) - Account and profile settings

## Admin & Support Features

### Support System
- **Support Tickets** (`/support`) - View support tickets
- **Create Support Ticket** (`/support/create`) - Create new support ticket
- **Support Ticket Detail** (`/support/:id`) - Individual ticket details
- **Admin Support Dashboard** (`/admin/support`) - Admin support management
- **Support Metrics Dashboard** (`/admin/support/metrics`) - Support metrics and analytics
- **Support Team Management** (`/admin/support-team`) - Manage support team
- **SLA Tracking Dashboard** (`/admin/sla-tracking`) - SLA performance tracking

### Admin Features
- **Dispute Resolution** (`/disputes`) - Handle booking disputes
- **Testing Dashboard** (`/testing-dashboard`) - Testing utilities

## Additional Pages

### Marketing & Engagement
- **Referral Program** (`/referral`) - Referral program details
- **Marketing** (`/marketing`) - Marketing materials and resources
- **Tutorials** (`/tutorials`) - Onboarding tutorials
- **Analytics** (`/analytics`) - General analytics page
- **Booking Analytics** (`/analytics`) - Booking analytics

### Demo & Examples
- **Demo Venue Profile** (`/demo-venue`) - Example venue profile
- **Venue Profile Tutorial** (`/tutorial-example`) - Tutorial example
- **Venue Profile Detail** (`/venues/:id`) - Detailed venue profile

### Legacy Routes (Deprecated)
- **Privacy Policy (Legacy)** (`/privacy-policy`) - Redirects to `/privacy`
- **Terms of Service (Legacy)** (`/terms-of-service`) - Redirects to `/terms`
- **Contact Form** (`/contact-form`) - Legacy contact form
- **DashboardV2** (`/dashboard-v2`) - Legacy dashboard

## Error Pages
- **404 Not Found** (`/404`) - Page not found error
- **Default Route** - Catch-all for undefined routes

## Navigation Structure

### Header Navigation
- Logo (links to home)
- Browse (dropdown)
- Sign In / Dashboard (conditional)
- Mobile menu (hamburger)

### Footer Navigation
- **Company**: About Us, Blog, Careers, Press Kit, Contact Us
- **For Artists**: How It Works, Pricing, Artist Resources, Verification, Success Stories
- **For Venues**: How It Works, Venue Directory, Venue Resources, Verification, Partner With Us
- **Support & Legal**: Help Center, FAQ, Contact Support, Terms, Privacy, Cookies, Accessibility
- **Social Media**: Facebook, Instagram, Twitter, LinkedIn, YouTube
- **Contact Info**: Email, Phone, Address

### Mobile Navigation
- Home
- Browse
- Messages
- Calendar
- Profile

## Route Protection & Access Control

### Public Routes
- Home, Browse, Venues, Artist/Venue Profiles
- Legal pages (Terms, Privacy, Cookies, Accessibility)
- Support pages (Help Center, FAQ, Contact)

### Artist-Only Routes
- Artist Dashboard, Availability, Rider Templates
- Artist Analytics, Artist Subscription
- Artist Reviews management

### Venue-Only Routes
- Venue Dashboard, Venue Analytics
- Booking creation and management
- Venue Reviews management

### Authenticated Routes (Both)
- Messages, Calendar, Bookings, Payments
- Settings, Support Tickets

### Admin Routes
- Admin Support Dashboard, Support Metrics
- SLA Tracking, Dispute Resolution

## Booking Flow Routes

1. Browse Artists (`/browse`) or Venues (`/venues`)
2. View Artist Profile (`/artist/:id`)
3. Create Booking Request (`/bookings/create`)
4. Booking Detail (`/booking/:id`)
5. Payment (`/payments`)
6. Messages (`/messages/:id`)

## Subscription Flow Routes

1. Artist Dashboard (`/artist-dashboard`)
2. Subscription Tab (`/subscription`)
3. Upgrade Plan (`/upgrade`)
4. Payment (`/payments`)

## Support Flow Routes

1. Help Center (`/help`)
2. Create Support Ticket (`/support/create`)
3. Support Ticket Detail (`/support/:id`)
4. Admin Support Dashboard (`/admin/support`)
