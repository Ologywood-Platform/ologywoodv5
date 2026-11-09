import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from './_core/logger';

const trpcSource = readFileSync(resolve(__dirname, '_core/trpc.ts'), 'utf8');
const loggerSource = readFileSync(resolve(__dirname, '_core/logger.ts'), 'utf8');

describe('global error logging safety', () => {
  it('does not emit raw exception messages or stacks', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      logger.error('test failure', new Error('secret database password and token'), {
        endpoint: 'test.secret',
        error: 'raw context should not survive',
        stack: 'raw stack should not survive',
      });
      const output = String(errorSpy.mock.calls[0]?.[0] ?? '');
      expect(output).toContain('errorType');
      expect(output).not.toContain('secret database password and token');
      expect(output).not.toContain('raw context should not survive');
      expect(output).not.toContain('raw stack should not survive');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('passes only endpoint, user, duration, and status context to the global logger', () => {
    expect(trpcSource).toContain("logger.trpcError(endpoint, error, userId, { errorCode: result.error?.code });");
    expect(trpcSource).toContain("new Error('TRPC request failed')");
    expect(loggerSource).toContain('delete safeContext.error');
    expect(loggerSource).toContain('delete safeContext.stack');
    expect(loggerSource).not.toContain('error: errorMessage');
    expect(loggerSource).not.toContain('stack: errorStack');
  });
});
