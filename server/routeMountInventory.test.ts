import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('active Express route mount inventory', () => {
  it('does not mount the legacy payment-testing mutator module', () => {
    const source = readFileSync('server/_core/index.ts', 'utf8');
    expect(source).not.toContain('paymentTestingRoutes');
    expect(source).not.toContain("app.use('/api/payment-test'");
  });

  it('keeps the intended public/secured route mounts visible', () => {
    const source = readFileSync('server/_core/index.ts', 'utf8');
    expect(source).toContain("app.use('/api/media-uploads'");
    expect(source).toContain("app.use('/api/email'");
    expect(source).toContain("app.post('/api/stripe/webhook'");
  });
});
