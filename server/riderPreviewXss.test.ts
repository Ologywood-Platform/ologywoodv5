import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('RiderBuilder preview XSS boundary', () => {
  it('escapes every dynamic value interpolated into the preview HTML', () => {
    const source = readFileSync('client/src/pages/RiderBuilder.tsx', 'utf8');
    expect(source).toContain('const escapeHtml = (value: unknown): string');
    expect(source).toContain('${escapeHtml(nameField)}');
    expect(source).toContain('${escapeHtml(templateStructure.title)}');
    expect(source).toContain('${escapeHtml(eventField)}');
    expect(source).toContain('${escapeHtml(dateField)}');
    expect(source).toContain('${escapeHtml(section.title)}');
    expect(source).toContain('${escapeHtml(field.label)}');
    expect(source).toContain('${escapeHtml(display)}');
  });

  it('does not interpolate raw form values into the preview HTML', () => {
    const source = readFileSync('client/src/pages/RiderBuilder.tsx', 'utf8');
    const start = source.indexOf('const previewHTML = useMemo');
    const end = source.indexOf('// Download as text', start);
    const block = source.slice(start, end);
    expect(block).not.toMatch(/>\$\{(?:nameField|eventField|dateField|display|field\.label|section\.title|templateStructure\.title)\}</);
  });
});
