import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/aiChat.ts'), 'utf8');
const limiterSource = readFileSync(resolve(__dirname, 'utils/rateLimiter.ts'), 'utf8');

describe('AI chat security boundaries', () => {
  it('strictly bounds the current prompt and conversation history', () => {
    expect(source).toContain('message: z.string().trim().min(1).max(2000)');
    expect(source).toContain('content: z.string().trim().min(1).max(2000)');
    expect(source).toContain('}).strict()).max(20).optional()');
    expect(source).toContain('}).strict())');
  });

  it('rate-limits expensive public LLM calls per client IP', () => {
    expect(source).toContain('aiChatLimiter.check(`ip:${getClientIp(ctx)}`)');
    expect(source).toContain("code: 'TOO_MANY_REQUESTS'");
    expect(limiterSource).toContain('export const aiChatLimiter');
    expect(limiterSource).toContain('maxRequests: 30');
    expect(limiterSource).toContain('windowMs: 60 * 1000');
  });

  it('caps generated responses and does not log raw LLM errors', () => {
    expect(source).toContain('responseContent.slice(0, 4000)');
    expect(source).toContain('[AIChat] LLM request failed');
    expect(source).not.toContain('console.error("[AIChat] LLM error:", error)');
  });
});
