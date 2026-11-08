import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(__dirname, 'routers.ts'), 'utf8');

function sectionBetween(startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('legacy content and outbound-email boundaries', () => {
  it('uses strict positive IDs and bounded template payloads in the duplicate rider router', () => {
    const section = sectionBetween('  riderTemplate: router({', '// ===== VENUE ROUTER =====');
    expect(section).toContain('id: legacyRiderTemplateId');
    expect(section).toContain('templateId: legacyRiderTemplateId');
    expect(section).toContain('templateName: legacyRiderTemplateName');
    expect(section).toContain('templateData: legacyRiderTemplateData.optional()');
    expect(section).toContain('}).strict()');
    expect(section).not.toContain('z.record(z.string(), z.any())');
    expect(section).not.toContain('id: z.number()');
  });

  it('bounds public newsletter inputs and never logs subscriber email addresses', () => {
    const section = sectionBetween('newsletter: router({', 'admin: adminRouter');
    expect(section).toContain("email: z.string().trim().toLowerCase().email('Invalid email address').max(320)");
    expect(section).toContain('name: z.string().trim().max(200).optional()');
    expect(section).toContain('source: z.string().trim().max(100).optional()');
    expect(section).toContain('}).strict())');
    expect(section).toContain("console.error('[Newsletter] Email sending failed')");
    expect(section).toContain("console.error('[Newsletter] Subscription error')");
    expect(section).not.toContain("Email sending failed for:', input.email");
  });
});
