import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('PDF export code splitting', () => {
  it('keeps html2pdf out of static imports for rider and contract exports', () => {
    const files = [
      path.resolve(__dirname, '../client/src/utils/pdfExport.ts'),
      path.resolve(__dirname, '../client/src/lib/contractPdf.ts'),
    ];
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source).not.toMatch(/^import\s+html2pdf\s+from\s+['"]html2pdf\.js['"];?$/m);
      expect(source).toContain("import('html2pdf.js')");
    }
  });
});
