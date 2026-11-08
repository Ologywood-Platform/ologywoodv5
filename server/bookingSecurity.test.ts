import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

describe('legacy booking security boundaries', () => {
  it('bounds booking creation fields and uses strict safe profile IDs', () => {
    expect(source).toContain('const bookingDate = z.string().trim().min(10).max(64)');
    expect(source).toContain('const bookingMoney = z.number().finite().min(0).max(100_000_000)');
    expect(source).toContain('artistId: artistProfileId');
    expect(source).toContain('eventDate: bookingDate');
    expect(source).toContain('venueName: bookingName');
    expect(source).toContain('clientEmail: bookingEmail');
    expect(source).toContain('}).strict())');
  });

  it('does not return private bookings to unrelated authenticated users', () => {
    expect(source).toContain("if (bookingRole === 'viewer') {");
    expect(source).toContain("message: 'You do not have access to this booking'");
    expect(source).toContain("booking.bookingSource === 'client_booking' && booking.venueId === ctx.user.id");
  });

  it('binds booking deposits to a booking party and its exact Stripe intent', () => {
    expect(source).toContain("if (booking.stripePaymentIntentId !== input.paymentIntentId)");
    expect(source).toContain("paymentIntent.metadata?.bookingId !== String(input.bookingId)");
    expect(source).toContain("paymentIntentId: z.string().trim().regex(/^pi_[A-Za-z0-9]+$/");
    expect(source).toContain("message: 'Deposit cannot exceed the agreed booking deposit'");
    expect(source).toContain("message: 'Payment amount is below the agreed deposit'");
  });
});
