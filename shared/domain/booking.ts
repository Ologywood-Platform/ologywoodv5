/**
 * Centralized Booking Domain Types
 * Single source of truth for all booking-related types across client, server, and shared layers
 */

export type BookingStatus = 
  | "PENDING" 
  | "ACCEPTED" 
  | "DECLINED" 
  | "CANCELLED" 
  | "COMPLETED"
  | "NO_SHOW";

export type PaymentStatus = 
  | "NOT_REQUIRED" 
  | "PENDING" 
  | "DEPOSIT_PAID" 
  | "PAID" 
  | "REFUNDED";

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
