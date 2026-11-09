import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Promotion security boundaries', () => {
  it('bounds AI and budget calculator inputs', () => {
    const source = read('./routers/promote.ts');
    expect(source).toContain('name: z.string().trim().min(1).max(255)');
    expect(source).toContain('dailyBudget: z.number().min(5).max(1000)');
    expect(source).toContain('days: z.number().int().min(1).max(90)');
    expect(source).toContain('}).strict())');
  });

  it('strictly bounds paid promotion requests and platform selection', () => {
    const source = read('./routers/promote.ts');
    expect(source).toContain('targetId: z.number().int().safe().positive().optional()');
    expect(source).toContain('budget: z.number().int().min(5000).max(10_000_000)');
    expect(source).toContain('platforms: z.array(z.enum([');
    expect(source).toContain('Duplicate platforms are not allowed');
    expect(source).toContain('additionalNotes: z.string().trim().max(2000).optional()');
  });

  it('binds supplied event, release, and profile targets to the submitting artist', () => {
    const source = read('./routers/promote.ts');
    expect(source).toContain('You can only promote your own content.');
    expect(source).toContain('targetProfile.userId !== ctx.user.id');
    expect(source).toContain('artistUserId: ctx.user.id.toString()');
  });

  it('keeps the client platform state typed to the validated server enum', () => {
    const source = read('../client/src/pages/Promote.tsx');
    expect(source).toContain('type PromotionPlatform =');
    expect(source).toContain('useState<PromotionPlatform[]>(["instagram"])');
  });

  it('uses an admin procedure for status transitions and redacts payment/database failures', () => {
    const source = read('./routers/promote.ts');
    expect(source).toContain('import { adminProcedure, router, protectedProcedure }');
    expect(source).toContain('updateRequestStatus: adminProcedure');
    expect(source).toContain("Payment intent creation failed', { kind: error instanceof Error ? error.name : 'UnknownError' }");
    expect(source).toContain('Unable to start promotion payment. Please try again.');
    expect(source).toContain('Promotion request persistence failed');
    expect(source).toContain('Failed to cancel abandoned promotion payment');
    expect(source).toContain('Request edit failed');
    expect(source).not.toContain('console.error("[Promote] AI generation error:", error.message)');
  });

  it('does not allow changing a paid promotion budget after payment setup', () => {
    const source = read('./routers/promote.ts');
    expect(source).toContain('The budget cannot be changed after payment setup.');
    expect(source).toContain('input.budget !== request.budget');
  });
});
