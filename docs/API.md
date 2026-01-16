# Ologywood API Documentation

## Overview

The Ologywood platform uses TRPC (TypeScript RPC) for all API communications. This document provides comprehensive documentation for all available endpoints.

## Authentication

All protected endpoints require a valid authentication session. Users must be logged in to access protected routes.

### Authentication Endpoints

#### `auth.login`
- **Type**: Public
- **Description**: Authenticate user with email/password
- **Input**: `{ email: string, password: string }`
- **Output**: `{ user: User, token: string }`

#### `auth.logout`
- **Type**: Protected
- **Description**: Logout current user
- **Input**: None
- **Output**: `{ success: boolean }`

#### `auth.getSession`
- **Type**: Protected
- **Description**: Get current user session
- **Input**: None
- **Output**: `{ user: User }`

---

## User Management

### `user.getProfile`
- **Type**: Protected
- **Description**: Get current user's profile
- **Input**: None
- **Output**: `{ id, email, name, role, createdAt, updatedAt }`

### `user.updateProfile`
- **Type**: Protected
- **Description**: Update user profile
- **Input**: `{ name?: string, email?: string }`
- **Output**: `{ success: boolean, user: User }`

---

## Artist Features

### `artist.getProfile`
- **Type**: Public
- **Description**: Get artist profile by ID
- **Input**: `{ artistId: number }`
- **Output**: `{ artistProfile: ArtistProfile }`

### `artist.updateProfile`
- **Type**: Protected (Artist only)
- **Description**: Update artist profile
- **Input**: `{ artistName, bio, genres, hourlyRate, ... }`
- **Output**: `{ success: boolean, profile: ArtistProfile }`

### `artist.getReviews`
- **Type**: Public
- **Description**: Get reviews for an artist
- **Input**: `{ artistId: number }`
- **Output**: `{ reviews: Review[], averageRating: number, totalReviews: number }`

### `artist.respondToReview`
- **Type**: Protected (Artist only)
- **Description**: Respond to a review
- **Input**: `{ reviewId: number, response: string }`
- **Output**: `{ success: boolean }`

---

## Venue Features

### `venue.getProfile`
- **Type**: Public
- **Description**: Get venue profile by ID
- **Input**: `{ venueId: number }`
- **Output**: `{ venueProfile: VenueProfile }`

### `venue.updateProfile`
- **Type**: Protected (Venue only)
- **Description**: Update venue profile
- **Input**: `{ venueName, address, city, state, zipCode, ... }`
- **Output**: `{ success: boolean, profile: VenueProfile }`

### `venue.getReviews`
- **Type**: Public
- **Description**: Get reviews for a venue
- **Input**: `{ venueId: number }`
- **Output**: `{ reviews: VenueReview[], averageRating: number }`

---

## Booking Management

### `booking.create`
- **Type**: Protected (Venue only)
- **Description**: Create a new booking request
- **Input**: `{ artistId, eventDate, eventTime, venueName, totalFee, depositAmount }`
- **Output**: `{ success: boolean, booking: Booking }`

### `booking.getList`
- **Type**: Protected
- **Description**: Get user's bookings
- **Input**: `{ status?: 'pending' | 'confirmed' | 'completed' }`
- **Output**: `{ bookings: Booking[] }`

### `booking.getDetail`
- **Type**: Protected
- **Description**: Get booking details
- **Input**: `{ bookingId: number }`
- **Output**: `{ booking: Booking }`

### `booking.updateStatus`
- **Type**: Protected
- **Description**: Update booking status
- **Input**: `{ bookingId: number, status: 'confirmed' | 'declined' | 'cancelled' }`
- **Output**: `{ success: boolean }`

### `booking.submitReview`
- **Type**: Protected
- **Description**: Submit review for completed booking
- **Input**: `{ bookingId: number, rating: number, comment?: string }`
- **Output**: `{ success: boolean, review: Review }`

---

## Messaging

### `message.send`
- **Type**: Protected
- **Description**: Send message in booking conversation
- **Input**: `{ bookingId: number, content: string }`
- **Output**: `{ success: boolean, message: Message }`

### `message.getThread`
- **Type**: Protected
- **Description**: Get all messages for a booking
- **Input**: `{ bookingId: number }`
- **Output**: `{ messages: Message[] }`

### `message.getUnreadCount`
- **Type**: Protected
- **Description**: Get unread message count
- **Input**: None
- **Output**: `{ unreadCount: number }`

---

## Subscriptions

### `subscription.getMy`
- **Type**: Protected (Artist only)
- **Description**: Get current user's subscription
- **Input**: None
- **Output**: `{ subscription: Subscription | null }`

### `subscription.createCheckoutSession`
- **Type**: Protected (Artist only)
- **Description**: Create Stripe checkout session
- **Input**: `{ successUrl: string, cancelUrl: string }`
- **Output**: `{ checkoutUrl: string }`

### `subscription.cancel`
- **Type**: Protected (Artist only)
- **Description**: Cancel subscription
- **Input**: None
- **Output**: `{ success: boolean }`

---

## Rider Templates

### `riderTemplate.create`
- **Type**: Protected (Artist only)
- **Description**: Create new rider template
- **Input**: `{ templateName, technicalRequirements, hospitality, ... }`
- **Output**: `{ success: boolean, template: RiderTemplate }`

### `riderTemplate.getList`
- **Type**: Protected (Artist only)
- **Description**: Get artist's rider templates
- **Input**: None
- **Output**: `{ templates: RiderTemplate[] }`

### `riderTemplate.update`
- **Type**: Protected (Artist only)
- **Description**: Update rider template
- **Input**: `{ templateId: number, ...updates }`
- **Output**: `{ success: boolean, template: RiderTemplate }`

### `riderTemplate.delete`
- **Type**: Protected (Artist only)
- **Description**: Delete rider template
- **Input**: `{ templateId: number }`
- **Output**: `{ success: boolean }`

---

## Availability

### `availability.getCalendar`
- **Type**: Public
- **Description**: Get artist's availability calendar
- **Input**: `{ artistId: number, month: number, year: number }`
- **Output**: `{ availability: AvailabilityDay[] }`

### `availability.updateDates`
- **Type**: Protected (Artist only)
- **Description**: Update availability for date range
- **Input**: `{ startDate: string, endDate: string, status: 'available' | 'unavailable' }`
- **Output**: `{ success: boolean }`

---

## Search & Discovery

### `search.artists`
- **Type**: Public
- **Description**: Search for artists
- **Input**: `{ query?: string, genre?: string, location?: string, minPrice?: number, maxPrice?: number }`
- **Output**: `{ artists: ArtistProfile[], total: number }`

### `search.venues`
- **Type**: Public
- **Description**: Search for venues
- **Input**: `{ query?: string, location?: string }`
- **Output**: `{ venues: VenueProfile[], total: number }`

---

## Error Handling

All API responses follow a standard error format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED`: User is not authenticated
- `FORBIDDEN`: User does not have permission
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input
- `CONFLICT`: Resource already exists
- `INTERNAL_SERVER_ERROR`: Server error

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Default**: 100 requests per minute per user
- **Booking creation**: 10 requests per hour
- **Message sending**: 30 requests per minute

---

## Pagination

List endpoints support pagination:

```typescript
{
  page?: number;      // 1-indexed, default: 1
  limit?: number;     // default: 20, max: 100
  sort?: string;      // field name
  order?: 'asc' | 'desc'; // default: 'desc'
}
```

---

## Webhooks

### Stripe Webhooks

The platform listens for Stripe webhooks at `/api/stripe/webhook`:

- `payment_intent.succeeded`: Payment completed
- `customer.subscription.created`: Subscription created
- `customer.subscription.deleted`: Subscription cancelled
- `invoice.paid`: Invoice paid

---

## Best Practices

1. **Always handle errors**: Check for error responses and handle them gracefully
2. **Use pagination**: Don't fetch all records at once for large datasets
3. **Cache results**: Use appropriate caching strategies for frequently accessed data
4. **Validate input**: Always validate user input before sending to API
5. **Use HTTPS**: Always use HTTPS in production
6. **Implement retry logic**: Implement exponential backoff for failed requests

---

## Support

For API support, please contact: support@ologywood.com
