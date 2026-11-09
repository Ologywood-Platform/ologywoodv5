import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const router = readFileSync(resolve(__dirname, 'routers/ologyLivePhase2.ts'), 'utf8');

describe('legacy Ology Live Phase 2 security boundaries', () => {
  it('uses safe positive identifiers and strict input objects throughout', () => {
    expect(router).toContain('const phase2Id = z.number().int().safe().positive()');
    expect(router).not.toContain('bookingId: z.number()');
    expect(router).not.toContain('contractId: z.number()');
    expect(router).not.toContain('reviewId: z.number()');
    expect(router).toContain('}).strict())');
  });

  it('bounds signatures, reviews, questions, statuses, and list limits', () => {
    expect(router).toContain('const contractStatus = z.string().trim().min(1).max(30)');
    expect(router).toContain('const phase2Text = (max: number) => z.string().trim().min(1).max(max)');
    expect(router).toContain('signature: phase2Text(500)');
    expect(router).toContain('rating: z.number().int().min(1).max(5)');
    expect(router).toContain('questionText: z.string().trim().min(5');
    expect(router).toContain('limit: z.number().int().min(1).max(50).default(20)');
  });

  it('validates earnings date ranges and report years', () => {
    expect(router).toContain('const earningsDate = z.string().trim().max(40).refine');
    expect(router).toContain('End date must not be before start date.');
    expect(router).toContain('year: z.number().int().min(2024).max(2030)');
    expect(router).toContain('recentEarnings: recent');
  });

  it('retains party ownership checks for contracts, reviews, earnings, and questions', () => {
    expect(router).toContain('booking.talentId !== ctx.user.id && booking.fanId !== ctx.user.id');
    expect(router).toContain('booking.fanId !== ctx.user.id) throw new Error("Only the fan can submit a review")');
    expect(router).toContain('booking.talentId !== ctx.user.id) throw new Error("Only talent can record earnings")');
    expect(router).toContain('booking.fanId !== ctx.user.id) throw new Error("Only the booked fan can submit questions")');
    expect(router).toContain('question.talentId !== ctx.user.id');
    expect(router).toContain('question.fanId !== ctx.user.id');
  });
});
