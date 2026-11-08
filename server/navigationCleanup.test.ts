import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('navigation cleanup', () => {
  it('uses the registered dashboard route for the keyboard shortcut', () => {
    const source = read('client/src/hooks/useKeyboardShortcuts.ts');
    expect(source).not.toContain("navigate('/dashboard-v2')");
    expect(source).toContain("navigate('/dashboard')");
  });

  it('keeps Terms DMCA links on the registered route', () => {
    const source = read('client/src/pages/TermsOfService.tsx');
    expect(source).not.toContain('/dmca-policy');
    expect(source.match(/href=\"\/dmca\"/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('sends signed-out booking users to the server login endpoint', () => {
    for (const path of ['client/src/pages/MyBookings.tsx', 'client/src/pages/ClientBooking.tsx']) {
      const source = read(path);
      expect(source).not.toContain("navigate('/login')");
      expect(source).not.toContain('navigate("/login")');
      expect(source).toMatch(/window\.location\.href\s*=\s*["']\/api\/login["']/);
    }
  });
});
