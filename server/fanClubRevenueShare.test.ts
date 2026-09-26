import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import {
  calculateFanClubRevenueShare,
  FAN_CLUB_PLATFORM_FEE_PERCENT,
  FAN_CLUB_TALENT_SHARE_PERCENT,
} from '../shared/platformFees';
import {
  CURRENT_TERMS_EFFECTIVE_DATE,
  CURRENT_TERMS_LAST_UPDATED,
  CURRENT_TERMS_VERSION,
} from '../shared/terms';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Fan Club 90/10 revenue share', () => {
  it('uses one shared 10% platform fee and 90% talent share', () => {
    expect(FAN_CLUB_PLATFORM_FEE_PERCENT).toBe(10);
    expect(FAN_CLUB_TALENT_SHARE_PERCENT).toBe(90);
    expect(calculateFanClubRevenueShare(1_000)).toEqual({
      grossCents: 1_000,
      platformFeeCents: 100,
      talentShareCents: 900,
    });
    expect(calculateFanClubRevenueShare(999)).toEqual({
      grossCents: 999,
      platformFeeCents: 100,
      talentShareCents: 899,
    });
  });

  it('passes the shared percentage to Stripe subscription application fees', () => {
    const router = read('server/routers/fanClub.ts');
    expect(router).toContain('FAN_CLUB_PLATFORM_FEE_PERCENT');
    expect(router).toContain('application_fee_percent = PLATFORM_FEE_PERCENT');
    expect(router).toContain('platformFeePercent: String(PLATFORM_FEE_PERCENT)');
    expect(router).not.toContain('const PLATFORM_FEE_PERCENT = 15');
  });

  it('keeps public, creator, Help, Terms, and AI guidance aligned', () => {
    const sources = [
      read('client/src/pages/Home.tsx'),
      read('client/src/pages/HowItWorks.tsx'),
      read('client/src/pages/Help.tsx'),
      read('client/src/pages/TermsOfService.tsx'),
      read('server/routers/aiChat.ts'),
    ].join('\n');
    expect(sources).toContain('You Keep 90%');
    expect(sources).toContain('you keep 90%, platform takes 10%');
    expect(sources).toContain('90% of each subscription payment goes to the Talent');
    expect(sources).toContain('Fan Club: 10%');
    expect(sources).not.toContain('15% of subscription amount');
    expect(sources).not.toContain('85% of each subscription payment goes to the Talent');
    expect(sources).not.toContain('Fan Club: 15%');
    expect(sources).not.toContain('You Keep 85%');
    expect(sources).not.toContain('85/15 revenue split');
  });

  it('versions the Terms notice and preserves every other approved fee', () => {
    expect(CURRENT_TERMS_VERSION).toBe('2026-09-26-fan-club-90-10');
    expect(CURRENT_TERMS_LAST_UPDATED).toBe('September 26, 2026');
    expect(CURRENT_TERMS_EFFECTIVE_DATE).toBe('September 26, 2026');

    const terms = read('client/src/pages/TermsOfService.tsx');
    const ai = read('server/routers/aiChat.ts');
    const live = read('server/routers/ologyLive.ts');
    const booking = read('server/routes/bookingCheckout.ts');
    const release = read('server/routes/releaseCheckout.ts');
    const ticketing = read('server/routers/ticketing.ts');

    expect(terms).toContain('Ology Live virtual sessions');
    expect(terms).toContain('15% technology marketplace service fee');
    expect(ai).toContain('Bookings: 1%');
    expect(ai).toContain('Music: 1%');
    expect(ai).toContain('Creator Shop: 1%');
    expect(ai).toContain('Tickets: $0.99/ticket');
    expect(ai).toContain('Ology Live: 15%');
    expect(ai).toContain('Tips: 0%');
    expect(booking).toContain('const PLATFORM_FEE_PERCENT = 1');
    expect(release).toContain('const PLATFORM_FEE_PERCENT = 1');
    expect(live).toContain('const PLATFORM_FEE_PERCENT = 15');
    expect(ticketing).toContain('$0.99 ×');
  });

  it('shows a new in-app Terms notice with shared version state', () => {
    const banner = read('client/src/components/TermsConsentBanner.tsx');
    const header = read('client/src/components/SiteHeader.tsx');
    expect(banner).toContain('CURRENT_TERMS_VERSION');
    expect(banner).toContain("reduces Ologywood's Fan Club platform fee from 15% to 10%");
    expect(header).toContain('CURRENT_TERMS_VERSION');
    expect(banner).not.toContain("const TERMS_VERSION = '2026-09-15-nil-readiness'");
    expect(header).not.toContain("const TERMS_VERSION = '2026-09-15-nil-readiness'");
  });
});
