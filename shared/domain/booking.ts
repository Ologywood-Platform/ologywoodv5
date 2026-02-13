/**
 * Centralized Booking Domain Types
 * Single source of truth for all booking-related types across client, server, and shared layers
 * 
 * Note: BookingStatus is defined in server/types/enums.ts
 * This file uses the canonical enum values: pending, confirmed, cancelled, completed
 */

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus = 
  | "unpaid" 
  | "deposit_paid" 
  | "fully_paid" 
  | "refunded";

export interface Booking {
  id: number;
  artistId: number;
  venueId: number;
  riderId?: number;
  eventDate: string;
  location: string;
  message: string;
  status: BookingStatus;
  budget: number;
  paymentStatus: PaymentStatus;
  depositAmount?: number;
  depositPaidAt?: Date;
  fullPaymentAt?: Date;
  stripePaymentIntentId?: string;
  stripeRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingRequest {
  artistId: number;
  venueId: number;
  eventDate: string;
  location: string;
  message: string;
  budget: number;
  riderId?: number;
}

export interface BookingUpdate {
  status?: BookingStatus;
  message?: string;
  budget?: number;
}
