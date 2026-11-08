import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const auditPath = path.resolve(__dirname, '../scripts/data-quality-audit.ts');
const source = fs.readFileSync(auditPath, 'utf8');

describe('reusable data-quality audit', () => {
  it('covers the major duplicate-prone domains and schema email columns', () => {
    expect(source).toContain("['users', 'openId'");
    expect(source).toContain("['artist_profiles', 'userId'");
    expect(source).toContain("['venue_profiles', 'userId'");
    expect(source).toContain("['events', 'artistId+venueId+title+date+time'");
    expect(source).toContain("['bookings', 'artistId+venueId+date+time'");
    expect(source).toContain("['release_purchases', 'stripeCheckoutSessionId'");
    expect(source).toContain("['ticket_orders', 'orderNumber'");
    expect(source).toContain("['merch_orders', 'orderNumber'");
    expect(source).toContain("['fan_club_memberships', 'fanId+talentId+tierId'");
    expect(source).toContain("name === 'email' || name.endsWith('email')");
  });

  it('is aggregate-only and cannot mutate or delete records', () => {
    expect(source).not.toMatch(/\b(INSERT\s+INTO|UPDATE\s+[^\n]+\s+SET|DELETE\s+FROM|REPLACE\s+INTO|TRUNCATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i);
    expect(source).toContain('never deletes, merges, or updates records');
    expect(source).toContain('duplicateChecksWithCandidates');
    expect(source).toContain('rawEmailColumnsWithIssues');
  });
});
