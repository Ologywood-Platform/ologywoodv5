/**
 * Enum Definitions for Domain Models
 * 
 * Centralized enum definitions for type-safe enum usage throughout the application.
 */

// ============================================================================
// Booking Status Enum
// ============================================================================

export const BookingStatusEnum = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type BookingStatus = typeof BookingStatusEnum[keyof typeof BookingStatusEnum];

export const BOOKING_STATUS_VALUES = Object.values(BookingStatusEnum);

// ============================================================================
// Contract Status Enum
// ============================================================================

export const ContractStatusEnum = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SIGNED: 'signed',
  EXECUTED: 'executed',
  CANCELLED: 'cancelled',
} as const;

export type ContractStatus = typeof ContractStatusEnum[keyof typeof ContractStatusEnum];

export const CONTRACT_STATUS_VALUES = Object.values(ContractStatusEnum);

// ============================================================================
// Payment Method Enum
// ============================================================================

export const PaymentMethodEnum = {
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer',
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
} as const;

export type PaymentMethod = typeof PaymentMethodEnum[keyof typeof PaymentMethodEnum];

export const PAYMENT_METHOD_VALUES = Object.values(PaymentMethodEnum);

// ============================================================================
// Payment Status Enum
// ============================================================================

export const PaymentStatusEnum = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PaymentStatusEnum[keyof typeof PaymentStatusEnum];

export const PAYMENT_STATUS_VALUES = Object.values(PaymentStatusEnum);

// ============================================================================
// Rider Status Enum
// ============================================================================

export const RiderStatusEnum = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACKNOWLEDGED: 'acknowledged',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
} as const;

export type RiderStatus = typeof RiderStatusEnum[keyof typeof RiderStatusEnum];

export const RIDER_STATUS_VALUES = Object.values(RiderStatusEnum);

// ============================================================================
// User Role Enum
// ============================================================================

export const UserRoleEnum = {
  ARTIST: 'artist',
  VENUE: 'venue',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRoleEnum[keyof typeof UserRoleEnum];

export const USER_ROLE_VALUES = Object.values(UserRoleEnum);

// ============================================================================
// Event Type Enum
// ============================================================================

export const EventTypeEnum = {
  CONCERT: 'concert',
  FESTIVAL: 'festival',
  PRIVATE_EVENT: 'private_event',
  CORPORATE_EVENT: 'corporate_event',
  WEDDING: 'wedding',
  CONFERENCE: 'conference',
  OTHER: 'other',
} as const;

export type EventType = typeof EventTypeEnum[keyof typeof EventTypeEnum];

export const EVENT_TYPE_VALUES = Object.values(EventTypeEnum);

// ============================================================================
// Rider Type Enum
// ============================================================================

export const RiderTypeEnum = {
  TECHNICAL: 'technical',
  HOSPITALITY: 'hospitality',
  SECURITY: 'security',
  PRODUCTION: 'production',
  CATERING: 'catering',
  ACCOMMODATION: 'accommodation',
  TRANSPORTATION: 'transportation',
  OTHER: 'other',
} as const;

export type RiderType = typeof RiderTypeEnum[keyof typeof RiderTypeEnum];

export const RIDER_TYPE_VALUES = Object.values(RiderTypeEnum);

// ============================================================================
// Venue Type Enum
// ============================================================================

export const VenueTypeEnum = {
  CLUB: 'club',
  THEATER: 'theater',
  ARENA: 'arena',
  FESTIVAL_GROUNDS: 'festival_grounds',
  OUTDOOR: 'outdoor',
  PRIVATE_VENUE: 'private_venue',
  CORPORATE_VENUE: 'corporate_venue',
  OTHER: 'other',
} as const;

export type VenueType = typeof VenueTypeEnum[keyof typeof VenueTypeEnum];

export const VENUE_TYPE_VALUES = Object.values(VenueTypeEnum);

// ============================================================================
// Genre Enum
// ============================================================================

export const GenreEnum = {
  ROCK: 'rock',
  POP: 'pop',
  HIP_HOP: 'hip_hop',
  JAZZ: 'jazz',
  CLASSICAL: 'classical',
  ELECTRONIC: 'electronic',
  COUNTRY: 'country',
  R_AND_B: 'r_and_b',
  INDIE: 'indie',
  METAL: 'metal',
  FOLK: 'folk',
  REGGAE: 'reggae',
  LATIN: 'latin',
  OTHER: 'other',
} as const;

export type Genre = typeof GenreEnum[keyof typeof GenreEnum];

export const GENRE_VALUES = Object.values(GenreEnum);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is a valid booking status
 */
export function isValidBookingStatus(value: any): value is BookingStatus {
  return BOOKING_STATUS_VALUES.includes(value);
}

/**
 * Check if a value is a valid contract status
 */
export function isValidContractStatus(value: any): value is ContractStatus {
  return CONTRACT_STATUS_VALUES.includes(value);
}

/**
 * Check if a value is a valid payment method
 */
export function isValidPaymentMethod(value: any): value is PaymentMethod {
  return PAYMENT_METHOD_VALUES.includes(value);
}

/**
 * Check if a value is a valid payment status
 */
export function isValidPaymentStatus(value: any): value is PaymentStatus {
  return PAYMENT_STATUS_VALUES.includes(value);
}

/**
 * Check if a value is a valid user role
 */
export function isValidUserRole(value: any): value is UserRole {
  return USER_ROLE_VALUES.includes(value);
}

/**
 * Check if a value is a valid event type
 */
export function isValidEventType(value: any): value is EventType {
  return EVENT_TYPE_VALUES.includes(value);
}

/**
 * Check if a value is a valid rider type
 */
export function isValidRiderType(value: any): value is RiderType {
  return RIDER_TYPE_VALUES.includes(value);
}

/**
 * Check if a value is a valid venue type
 */
export function isValidVenueType(value: any): value is VenueType {
  return VENUE_TYPE_VALUES.includes(value);
}

/**
 * Check if a value is a valid genre
 */
export function isValidGenre(value: any): value is Genre {
  return GENRE_VALUES.includes(value);
}
