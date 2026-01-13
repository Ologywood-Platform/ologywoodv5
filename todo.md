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
