import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { positiveRouteId } from './routes/routeInput';
import { trustedCheckoutOrigin } from './services/trustedOrigin';

const source = readFileSync('server/routes/bookingCheckout.ts', 'utf8');

describe('legacy booking checkout security boundaries', () => {
  it('uses the shared strict ID parser for body and status-route booking IDs', () => {
    expect(source).toContain('positiveRouteId(rawBookingId)');
    expect(source).toContain('positiveRouteId(req.params.bookingId)');
    expect(source).not.toContain('Number(rawBookingId)');
    expect(source).not.toContain('Number(req.params.bookingId)');
    expect(positiveRouteId('12junk')).toBeNull();
    expect(positiveRouteId('0')).toBeNull();
  });

  it('uses the approved checkout origin instead of request-origin interpolation', () => {
    expect(source).toContain('trustedCheckoutOrigin(process.env.BASE_URL, req.headers.origin)');
    expect(source).not.toContain('success_url: `${req.headers.origin}');
    expect(source).not.toContain('cancel_url: `${req.headers.origin}');
    expect(trustedCheckoutOrigin('', 'https://attacker.example')).toBe('https://www.ologywood.com');
  });

  it('keeps booking payment types explicit and amounts finite, cents-safe, and capped', () => {
    expect(source).toContain("paymentType !== 'deposit' && paymentType !== 'final'");
    expect(source).toContain('parseUsdCents(booking.totalFee)');
    expect(source).toContain('totalFeeCents === null || totalFeeCents < 50');
    expect(source).toContain('amountCents <= 100_000_000');
  });

  it('resolves artist payment-status access through the artist profile user ID', () => {
    expect(source).toContain('select({ userId: artistProfiles.userId })');
    expect(source).toContain('const isArtist = artistProfile?.userId === userId');
    expect(source).not.toContain('booking.artistId === userId');
  });

  it('does not expose connected-account identifiers or raw exception details in logs', () => {
    expect(source).toContain('Using Stripe Connect with platform fee');
    expect(source).toContain("error: error instanceof Error ? error.name : 'UnknownError'");
    expect(source).not.toContain('account: ${connectAccount.stripeAccountId}');
    expect(source).not.toContain('for artist ${booking.artistId}');
    expect(source).not.toContain('for booking #${bookingId}');
    expect(source).not.toContain("console.error('[BookingCheckout] Error:', error.message)");
    expect(source).not.toContain("console.error('[BookingPaymentStatus] Error:', error.message)");
  });
});
