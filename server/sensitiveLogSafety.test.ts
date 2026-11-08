import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function source(file: string): string {
  return readFileSync(file, 'utf8');
}

describe('sensitive diagnostic logging', () => {
  it('does not log Google personal/provider identifiers or provider bodies', () => {
    const text = source('server/routes/googleAuth.ts');
    expect(text).not.toMatch(/console\.[^(]+\([^\n]*(?:googleUser\.(?:email|id)|user\.email|errorData|origin\}\$\{returnPath)/);
    expect(text).not.toContain("console.error('[Google OAuth] Callback error:', error)");
  });

  it('does not log Spotify personal/provider identifiers or provider bodies', () => {
    const text = source('server/routes/spotifyAuth.ts');
    expect(text).not.toMatch(/console\.[^(]+\([^\n]*(?:spotifyUser\.(?:email|id|display_name)|user\.email|errorData|verified\.openId)/);
    expect(text).not.toContain("console.error('[Spotify OAuth] Callback error:', error)");
  });

  it('does not log contract PDF identifiers, raw exception messages, or stacks', () => {
    const text = source('server/routes/contractPdf.ts');
    expect(text).not.toMatch(/console\.[^(]+\([^\n]*(?:req\.params\.bookingId|bookingId|artistId|venueId|contract\?\.id|error\?\.message|error\?\.stack)/);
    expect(text).toContain('signatureCount: signatures.length');
    expect(text).toContain('error instanceof Error ? error.name');
  });
});
