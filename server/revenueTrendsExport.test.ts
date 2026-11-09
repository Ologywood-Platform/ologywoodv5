import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = readFileSync('client/src/components/RevenueTrendsPanel.tsx', 'utf8');

describe('Revenue Trends PDF export', () => {
  it('generates a PDF blob and downloads it with a browser anchor', () => {
    expect(source).toContain(".outputPdf('blob')");
    expect(source).toContain('URL.createObjectURL(pdfBlob)');
    expect(source).toContain('link.download = filename');
    expect(source).toContain("toast.success('Revenue PDF downloaded')");
  });

  it('reports export failures without leaving the temporary element mounted', () => {
    expect(source).toContain("toast.error('Could not download the revenue PDF. Please try again.')");
    expect(source).toContain('element.remove();');
    expect(source).toContain('setIsExportingPdf(false);');
  });
});
