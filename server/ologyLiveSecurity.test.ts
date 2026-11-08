import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Ology Live security boundaries', () => {
  it('uses strict safe IDs and bounded booking/management fields', () => {
    const source = read('./routers/ologyLive.ts');
    expect(source).toContain('id: z.number().int().safe().positive()');
    expect(source).toContain('experienceId: z.number().int().safe().positive()');
    expect(source).toContain('slotId: z.number().int().safe().positive()');
    expect(source).toContain('bookingId: z.number().int().safe().positive()');
    expect(source).toContain('limit: z.number().int().min(1).max(50).default(20)');
    expect(source).toContain('offset: z.number().int().min(0).max(1_000_000).default(0)');
    expect(source).toContain("notes: z.string().trim().max(500).optional()");
  });

  it('bounds money and schedule payloads instead of accepting arbitrary JSON', () => {
    const source = read('./routers/ologyLive.ts');
    expect(source).toContain("Price must have at most two decimal places");
    expect(source).toContain('recurringSchedule: recurringScheduleSchema.optional()');
    expect(source).toContain('Duplicate days are not allowed');
    expect(source).toContain('Recurring schedule must end after it starts.');
    expect(source).not.toContain('recurringSchedule: z.unknown().optional()');
  });

  it('does not expose paused experiences through the public detail route', () => {
    const source = read('./routers/ologyLive.ts');
    expect(source).toContain('eq(ologyLiveExperiences.isActive, true),');
  });

  it('keeps checkout metadata tied to the locked reservation participants', () => {
    const source = read('./routers/ologyLive.ts');
    expect(source).toContain("type: 'ology_live_booking'");
    expect(source).toContain('fanId: String(ctx.user.id)');
    expect(source).toContain('talentId: String(reservation.talentId)');
    expect(source).toContain('if (experience.talentId === fanId)');
    expect(source).toContain('booking.paymentStatus !== \'unpaid\' || booking.stripePaymentIntentId');
  });
});
