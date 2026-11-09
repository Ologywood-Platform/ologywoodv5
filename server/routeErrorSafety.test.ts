import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const routeDir = path.resolve(__dirname, 'routes');
const readRoute = (name: string) => fs.readFileSync(path.join(routeDir, name), 'utf8');

describe('API route error safety', () => {
  it('does not expose raw exception messages or stack/context details in patched routes', () => {
    const patchedRoutes = [
      'scheduledContractReminders.ts',
      'scheduledPremiereReminders.ts',
      'paymentTestingRoutes.ts',
      'socketMetricsRoutes.ts',
      'emailRoutes.ts',
      'bookFiles.ts',
      'videoUpload.ts',
      'googleCalendarSync.ts',
    ].map(readRoute).join('\n');

    expect(patchedRoutes).not.toMatch(/\b(stack|context):\s*\{/i);
    expect(patchedRoutes).not.toMatch(/\b(error|err):\s*(error|err)\.(message|stack)\b/i);
    expect(patchedRoutes).not.toMatch(/\b(error|err):\s*error\s+instanceof\s+Error\s*\?/i);
    expect(patchedRoutes).not.toContain("error: error.message");
    expect(patchedRoutes).not.toContain("error: err.message");
    expect(readRoute('paymentTestingRoutes.ts')).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(readRoute('socketMetricsRoutes.ts')).toContain("kind: error instanceof Error ? error.name : 'UnknownError'");
    expect(readRoute('paymentTestingRoutes.ts')).not.toContain("console.error('[PaymentTestingRoutes] Error testing payment success:', error)");
    expect(readRoute('socketMetricsRoutes.ts')).not.toContain("console.error('[SocketMetricsRoutes] Error updating metrics:', error)");
  });

  it('keeps validation-specific upload messages limited to the typed validation error', () => {
    const videoUpload = readRoute('videoUpload.ts');
    expect(videoUpload).toContain('err instanceof PortfolioUploadValidationError ? err.message');
    expect(videoUpload).toContain("error: 'Video upload failed'");
    expect(videoUpload).toContain("error: 'Portfolio video upload failed'");
  });
});
