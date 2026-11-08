import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

describe('legacy artist availability security boundaries', () => {
  it('uses safe artist IDs and validated optional date windows for public reads', () => {
    expect(source).toContain('artistId: artistProfileId');
    expect(source).toContain('startDate: scheduleDateSchema.optional()');
    expect(source).toContain('endDate: scheduleDateSchema.optional()');
    expect(source).toContain("path: ['endDate'], message: 'End date must be after start date'");
  });

  it('uses strict mutation objects and bounds free-form notes', () => {
    expect(source).toContain('notes: z.string().trim().max(2_000).optional()');
    expect(source).toContain("status: z.enum(['available', 'booked', 'unavailable'])");
    expect(source).toContain(".input(z.object({ id: z.number().int().safe().positive() }).strict())");
    expect(source).toContain('fromDate: scheduleDateSchema');
    expect(source).toContain(".input(z.object({\n        fromDate: scheduleDateSchema,\n        toDate: scheduleDateSchema,\n      }).strict())");
  });

  it('retains the existing bounded 90-day range guard before writes', () => {
    expect(source).toContain('if (dates.length > 91) throw new TRPCError({code:\'BAD_REQUEST\',message:\'Date range cannot exceed 90 days\'})');
    expect(source).toContain("if(input.toDate < input.fromDate || input.toDate > addCalendarDays(input.fromDate,90))");
  });
});
