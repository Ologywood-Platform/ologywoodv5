import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/contractAnalyzer.ts'), 'utf8');
const limiterSource = readFileSync(resolve(__dirname, 'utils/rateLimiter.ts'), 'utf8');

describe('contract analyzer security boundaries', () => {
  it('keeps analysis authenticated, athlete-owned, and strict', () => {
    expect(source).toContain('analyzeContract: protectedProcedure');
    expect(source).toContain('}).strict()');
    expect(source).toContain('await requireOwnedAthleteProfile(ctx.user.id)');
    expect(source).toContain('contractText: z.string().min(50');
    expect(source).toContain('.max(50000');
  });

  it('limits expensive analysis per signed-in user', () => {
    expect(source).toContain('contractAnalyzerLimiter.check(`user:${ctx.user.id}`)');
    expect(source).toContain("code: 'TOO_MANY_REQUESTS'");
    expect(limiterSource).toContain('export const contractAnalyzerLimiter');
    expect(limiterSource).toContain('maxRequests: 6');
    expect(limiterSource).toContain('15 * 60 * 1000');
  });

  it('does not log raw contract-analysis exceptions', () => {
    expect(source).toContain('[ContractAnalyzer] Analysis failed');
    expect(source).not.toContain('console.error("[ContractAnalyzer] Error:", error)');
  });
});
