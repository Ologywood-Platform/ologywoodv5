import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/emailPreferences.ts'), 'utf8');

describe('email preference security boundaries', () => {
  it('uses safe strict creator consent inputs and bounded revisions', () => {
    expect(source).toContain('const creatorIdSchema = z.number().int().safe().positive()');
    expect(source).toContain('.input(z.object({ creatorId: creatorIdSchema }).strict())');
    expect(source).toContain('expectedRevision: z.number().int().safe().min(0).max(1_000_000_000)');
    expect(source).toContain('}).strict())');
  });

  it('validates signed unsubscribe capability shape and caps public calls', () => {
    expect(source).toContain("const fanUnsubscribeToken = z.string().trim().min(20).max(512).regex(/^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/u");
    expect(source).toContain('const publicUnsubscribeLimiter = new RateLimiter({ maxRequests: 60');
    expect(source).toContain("publicUnsubscribeLimiter.check(`ip:${clientIp(ctx)}`)");
  });

  it('keeps preference mutations strict and does not log raw exceptions', () => {
    expect(source).toContain("At least one preference is required");
    expect(source).toContain('reason: z.string().trim().min(1).max(100)');
    expect(source).not.toContain('Error updating email preferences:", error');
    expect(source).not.toContain('Error saving unsubscribe feedback:", error');
  });
});
