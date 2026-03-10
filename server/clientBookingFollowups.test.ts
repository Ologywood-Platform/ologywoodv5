/**
 * Tests for Client Booking Follow-ups:
 * 1. Messaging from My Bookings
 * 2. Stripe deposit/payment flow for client bookings
 * 3. Email confirmations for client bookings
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, '..', relativePath), 'utf-8');
}

// ============= FOLLOW-UP 1: MESSAGING FROM MY BOOKINGS =============

describe('Follow-up 1: Messaging from My Bookings', () => {
  const myBookingsSrc = readFile('client/src/pages/MyBookings.tsx');

  it('has a Message Artist button in the booking card', () => {
    expect(myBookingsSrc).toContain('Message Artist');
    expect(myBookingsSrc).toContain('MessageCircle');
  });

  it('navigates to messages with bookingId query param', () => {
    expect(myBookingsSrc).toContain('/messages?bookingId=${booking.id}');
  });

  it('stops event propagation on message button click', () => {
    expect(myBookingsSrc).toContain('e.stopPropagation()');
  });
});

// ============= FOLLOW-UP 2: STRIPE DEPOSIT/PAYMENT FLOW =============

describe('Follow-up 2: Stripe Deposit/Payment for Client Bookings', () => {
  const myBookingsSrc = readFile('client/src/pages/MyBookings.tsx');
  const bookingCheckoutSrc = readFile('server/routes/bookingCheckout.ts');

  describe('My Bookings Payment UI', () => {
    it('has a Pay Deposit button', () => {
      expect(myBookingsSrc).toContain('Pay Deposit (50%)');
    });

    it('has a Pay Remaining Balance button', () => {
      expect(myBookingsSrc).toContain('Pay Remaining Balance');
    });

    it('shows payment status badges', () => {
      expect(myBookingsSrc).toContain('Paid in Full');
      expect(myBookingsSrc).toContain('Deposit Paid');
      expect(myBookingsSrc).toContain('Refunded');
    });

    it('calls booking-checkout API for deposit payments', () => {
      expect(myBookingsSrc).toContain('/api/booking-checkout');
      expect(myBookingsSrc).toContain("paymentType: 'deposit'");
    });

    it('calls booking-checkout API for final payments', () => {
      expect(myBookingsSrc).toContain("paymentType: 'final'");
    });

    it('shows loading state during payment', () => {
      expect(myBookingsSrc).toContain('payingBookingId');
      expect(myBookingsSrc).toContain('Loader2');
    });

    it('disables button while payment is processing', () => {
      expect(myBookingsSrc).toContain('disabled={isPaying}');
    });

    it('redirects to Stripe checkout URL on success', () => {
      expect(myBookingsSrc).toContain('window.location.href = data.url');
    });

    it('handles payment errors gracefully', () => {
      expect(myBookingsSrc).toContain("'Failed to start payment. Please try again.'");
    });

    it('only shows deposit button when fee exists and status is unpaid', () => {
      expect(myBookingsSrc).toContain("isPayable && booking.paymentStatus === 'unpaid'");
    });

    it('only shows final payment button when deposit is paid', () => {
      expect(myBookingsSrc).toContain("isPayable && booking.paymentStatus === 'deposit_paid'");
    });
  });

  describe('Booking Checkout Route', () => {
    it('accepts both venue and client booking payments', () => {
      // Should allow the booking owner (venueId stores client userId for client bookings)
      expect(bookingCheckoutSrc).toContain('Only the booking owner can make payments');
    });

    it('creates Stripe checkout sessions for deposits', () => {
      expect(bookingCheckoutSrc).toContain("paymentType === 'deposit'");
      expect(bookingCheckoutSrc).toContain('50% Deposit');
    });

    it('creates Stripe checkout sessions for final payments', () => {
      // The else branch handles final payments when paymentType is not 'deposit'
      expect(bookingCheckoutSrc).toContain('final payment');
      expect(bookingCheckoutSrc).toContain('Final Payment');
    });

    it('validates booking is not cancelled before payment', () => {
      expect(bookingCheckoutSrc).toContain("booking.status === 'cancelled'");
      expect(bookingCheckoutSrc).toContain('Cannot pay for a cancelled booking');
    });

    it('validates minimum fee amount', () => {
      expect(bookingCheckoutSrc).toContain('totalFeeCents < 50');
    });

    it('supports Stripe Connect for artist payouts', () => {
      expect(bookingCheckoutSrc).toContain('stripeConnectAccounts');
      expect(bookingCheckoutSrc).toContain('application_fee_amount');
      expect(bookingCheckoutSrc).toContain('transfer_data');
    });

    it('includes booking metadata in checkout session', () => {
      expect(bookingCheckoutSrc).toContain("bookingId: bookingId.toString()");
      expect(bookingCheckoutSrc).toContain('paymentType');
    });

    it('has payment status endpoint', () => {
      expect(bookingCheckoutSrc).toContain('/api/booking-payment-status/:bookingId');
    });
  });
});

// ============= FOLLOW-UP 3: EMAIL CONFIRMATIONS =============

describe('Follow-up 3: Email Confirmations for Client Bookings', () => {
  const emailSrc = readFile('server/email.ts');
  const routersSrc = readFile('server/routers.ts');

  describe('Client Booking Confirmation Email (to client)', () => {
    it('exports sendClientBookingConfirmationEmail function', () => {
      expect(emailSrc).toContain('export async function sendClientBookingConfirmationEmail');
    });

    it('accepts all required booking parameters', () => {
      expect(emailSrc).toContain('clientEmail: string');
      expect(emailSrc).toContain('clientName: string');
      expect(emailSrc).toContain('artistName: string');
      expect(emailSrc).toContain('bookingId: number');
      expect(emailSrc).toContain('eventType: string');
      expect(emailSrc).toContain('eventDate: string');
    });

    it('uses branded Ologywood email template', () => {
      expect(emailSrc).toContain('Booking Request Sent!');
      expect(emailSrc).toContain('linear-gradient(135deg, #6D28D9');
    });

    it('includes booking reference number', () => {
      expect(emailSrc).toContain('#${bookingId}');
    });

    it('includes event details in the email', () => {
      expect(emailSrc).toContain('eventTypeLabel');
      expect(emailSrc).toContain('venueName');
      expect(emailSrc).toContain('venueAddress');
    });

    it('includes link to My Bookings page', () => {
      expect(emailSrc).toContain('/my-bookings');
    });

    it('includes link to message the artist', () => {
      expect(emailSrc).toContain('/messages?bookingId=');
    });

    it('includes unsubscribe link', () => {
      expect(emailSrc).toContain('unsubscribeUrl');
      expect(emailSrc).toContain('Unsubscribe');
    });

    it('includes what happens next section', () => {
      expect(emailSrc).toContain('What happens next?');
    });
  });

  describe('Client Booking Notification Email (to artist)', () => {
    it('exports sendClientBookingNotificationToArtist function', () => {
      expect(emailSrc).toContain('export async function sendClientBookingNotificationToArtist');
    });

    it('includes client contact information', () => {
      expect(emailSrc).toContain('clientEmailAddr');
      expect(emailSrc).toContain('clientName');
    });

    it('uses branded Ologywood email template', () => {
      // Check for the branded header in the artist notification
      expect(emailSrc).toContain('New Booking Request!');
    });

    it('includes link to artist dashboard', () => {
      expect(emailSrc).toContain('/artist-dashboard');
      expect(emailSrc).toContain('Review & Respond');
    });

    it('includes unsubscribe link', () => {
      // Both email functions should have unsubscribe
      const artistNotifSection = emailSrc.substring(emailSrc.indexOf('sendClientBookingNotificationToArtist'));
      expect(artistNotifSection).toContain('Unsubscribe');
    });
  });

  describe('Email Integration in clientCreate Mutation', () => {
    it('sends confirmation email to client after booking creation', () => {
      expect(routersSrc).toContain('sendClientBookingConfirmationEmail');
    });

    it('sends notification email to artist after booking creation', () => {
      expect(routersSrc).toContain('sendClientBookingNotificationToArtist');
    });

    it('catches email errors without failing the booking', () => {
      // Both email calls should have .catch() to not break the booking flow
      expect(routersSrc).toContain('[ClientBooking] Artist email failed');
      expect(routersSrc).toContain('[ClientBooking] Client confirmation email failed');
    });

    it('passes all booking details to the email functions', () => {
      expect(routersSrc).toContain('eventType: input.eventType');
      expect(routersSrc).toContain('eventDate: formattedDate');
      expect(routersSrc).toContain('venueName: input.venueName');
    });
  });
});
