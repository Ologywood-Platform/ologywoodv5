import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/emailTesting.ts'), 'utf8');

describe('email-testing security boundaries', () => {
  it('does not expose email sending procedures publicly', () => {
    expect(source).toContain('testAllTemplates: adminProcedure');
    expect(source).toContain('testTemplate: adminProcedure');
    expect(source).not.toContain('testAllTemplates: publicProcedure');
    expect(source).not.toContain('testTemplate: publicProcedure');
  });

  it('strictly bounds test recipients and template names', () => {
    expect(source).toContain('testEmail: z.string().trim().toLowerCase().email("Invalid email address").max(320)');
    expect(source).toContain('templateName: z.string().trim().min(1).max(100)');
    expect(source).toContain('}).strict())');
  });

  it('does not return raw email or exception details in error paths', () => {
    expect(source).not.toContain('Email test suite completed. ${summary.successful}/${summary.total} templates sent successfully to ${testEmail}');
    expect(source).not.toContain('console.error("[Email Testing] Error:", error)');
    expect(source).not.toContain('error instanceof Error ? error.message');
  });
});
