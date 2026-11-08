import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateRiderHTML } from './services/riderContractTemplate';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Legacy rider-template security boundaries', () => {
  it('requires safe template IDs/types/names and strict objects', () => {
    const source = read('./routers/rider.ts');
    expect(source).toContain('const templateId = z.number().int().safe().positive()');
    expect(source).toContain("const templateType = z.string().trim().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/");
    expect(source).toContain('const templateName = z.string().trim().min(1).max(255)');
    expect(source).toContain('templateData = z.record');
    expect(source).toContain('Template data is too large');
    expect(source).toContain('}).strict()');
  });

  it('escapes user-controlled values in generated rider HTML', () => {
    const html = generateRiderHTML('simple_booking', {
      artist_name: '<img src=x onerror=alert(1)>',
      event_name: '" onclick="alert(2)',
      event_date: "</p><script>alert('x')</script>",
      additional_notes: '<svg onload=alert(3)>',
    });
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&quot; onclick=&quot;alert(2)');
    expect(html).toContain('&lt;/p&gt;&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<svg onload');
  });
});
