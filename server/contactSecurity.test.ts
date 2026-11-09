import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers/contact.ts'), 'utf8');

describe('contact form security boundaries', () => {
  it('normalizes and strictly bounds public contact fields', () => {
    expect(source).toContain('name: z.string().trim().min(2');
    expect(source).toContain('email: z.string().trim().toLowerCase().email');
    expect(source).toContain('.max(320)');
    expect(source).toContain('message: z.string().trim().min(10');
    expect(source).toContain('}).strict()');
  });

  it('escapes all user-controlled values before email HTML interpolation', () => {
    expect(source).toContain('const safeName = escapeFanEmailHtml(name)');
    expect(source).toContain('const safeEmail = escapeFanEmailHtml(email)');
    expect(source).toContain('const safeSubject = escapeFanEmailHtml(subject)');
    expect(source).toContain('const safeMessage = escapeFanEmailHtml(message)');
    expect(source).not.toContain('${name}</td>');
    expect(source).not.toContain('${message}\n');
  });

  it('does not write submitted contact PII to fallback logs', () => {
    expect(source).toContain('no contact payload logged');
    expect(source).not.toContain("JSON.stringify({ name, email, subject, message");
  });
});
