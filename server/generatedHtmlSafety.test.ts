import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('generated HTML safety boundaries', () => {
  it('sanitizes printable report and media-kit documents before new-window writes', () => {
    for (const path of ['client/src/pages/OlogyLiveEarnings.tsx', 'client/src/pages/MediaKit.tsx']) {
      const source = read(path);
      expect(source).toMatch(/import DOMPurify from ['"]dompurify['"]/);
      expect(source).toContain('DOMPurify.sanitize(htmlContent, { WHOLE_DOCUMENT: true })');
      expect(source).not.toMatch(/document\.write\(htmlContent\)/);
    }
  });

  it('sanitizes generated PDF fragments before assigning innerHTML', () => {
    for (const path of ['client/src/lib/contractPdf.ts', 'client/src/utils/pdfExport.ts']) {
      const source = read(path);
      expect(source).toMatch(/import DOMPurify from ['"]dompurify['"]/);
      expect(source).toContain('element.innerHTML = DOMPurify.sanitize(htmlContent)');
      expect(source).not.toContain('element.innerHTML = htmlContent');
    }
  });

  it('sanitizes the complete TipQRCode print document', () => {
    const source = read('client/src/components/TipQRCode.tsx');
    expect(source).toContain("import DOMPurify from \"dompurify\"");
    expect(source).toContain('DOMPurify.sanitize(`');
    expect(source).toContain('printWindow.document.write(printableHtml)');
  });
});
