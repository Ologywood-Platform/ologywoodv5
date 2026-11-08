import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildUpdateEmail } from './services/artistUpdateService';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Artist update security boundaries', () => {
  it('uses strict bounded send and history schemas', () => {
    const source = read('./routers/artistUpdates.ts');
    expect(source).toContain('body: z.string().trim().min(1');
    expect(source).toContain('}).strict()');
    expect(source).toContain('limit: z.number().int().min(1).max(50).default(20)');
    expect(source).toContain('offset: z.number().int().min(0).max(1_000_000).default(0)');
  });

  it('escapes update subject, body, names, and links in delivered HTML', () => {
    const html = buildUpdateEmail(
      '<img src=x onerror=alert(1)>',
      '<b>Artist</b>',
      42,
      '<script>alert(2)</script>',
      '<svg onload=alert(3)>\n\nhello <a href="javascript:alert(4)">world</a>',
      'https://www.ologywood.com/unsubscribe?token=%22%3E',
    );
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Artist&lt;/b&gt;');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(html).toContain('&lt;svg onload=alert(3)&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<svg onload');
    expect(html).not.toContain('<a href="javascript:alert');
  });
});
