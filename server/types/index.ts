/**
 * Domain Model Type Definitions
 * 
 * This file contains all type definitions for the artist booking platform.
 * Centralized type management for consistency and maintainability.
 */

import type { BookingStatus, ContractStatus, PaymentMethod, PaymentStatus, RiderStatus, UserRole } from './enums';

// ============================================================================
// Booking Types
// ============================================================================

export interface BookingRequest {
  artistId: number;
  venueId: number;
  eventDate: Date;
  eventType: string;
  estimatedAttendees?: number;
  budget: number;
  specialRequirements?: string;
  notes?: string;
}

export interface BookingResponse {
  id: number;
  artistId: number;
  venueId: number;
  eventDate: Date;
  eventType: string;
  status: BookingStatus;
  budget: number;
  createdAt: Date;
  updatedAt: Date;
}

// BookingStatus is defined in enums.ts

// ============================================================================
// Contract Types
// ============================================================================

export interface ContractRequest {
  bookingId: number;
  artistId: number;
  venueId: number;
  eventDate: Date;
  eventType: string;
  budget: number;
  terms?: string;
  specialRequirements?: string;
}

export interface ContractResponse {
  id: number;
  bookingId: number;
  artistId: number;
  venueId: number;
  status: ContractStatus;
  eventDate: Date;
  budget: number;
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
}

// ContractStatus is defined in enums.ts

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentRequest {
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  description?: string;
}

export interface PaymentResponse {
  id: number;
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}



// ============================================================================
// Artist Types
// ============================================================================

export interface ArtistProfile {
  id: number;
  userId: number;
  artistName: string;
  bio?: string;
  genres: string[];
  location: string;
  feeRangeMin: number;
  feeRangeMax: number;
  touringPartySize?: number;
  profilePhotoUrl?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    twitter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Venue Types
// ============================================================================

export interface VenueProfile {
  id: number;
  userId: number;
  venueName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  venueType: string;
  description?: string;
  amenities?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface ErrorMetrics {
  errors: number;
  warnings: number;
  timestamp: Date;
  errorsByEndpoint: Array<{
    endpoint: string;
    count: number;
    lastOccurred: Date;
  }>;
}

export interface BookingStats {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  completed: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

// ============================================================================
// Ryder/Rider Types
// ============================================================================

export interface RiderRequest {
  contractId: number;
  artistId: number;
  venueId: number;
  eventDate: Date;
  eventType: string;
  riderType: string;
  content: Record<string, any>;
  notes?: string;
}

export interface RiderResponse {
  id: number;
  contractId: number;
  artistId: number;
  venueId: number;
  riderType: string;
  status: RiderStatus;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
}



// ============================================================================
// Template Types
// ============================================================================

export interface BookingTemplate {
  id: number;
  venueId: number;
  templateName: string;
  templateData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractTemplate {
  id: number;
  userId: number;
  templateName: string;
  templateContent: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// User Types
// ============================================================================

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}



// ============================================================================
// Query Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}
