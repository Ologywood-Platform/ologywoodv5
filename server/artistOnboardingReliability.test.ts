import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('artist onboarding reliability', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/pages/ArtistOnboarding.tsx'), 'utf8');

  it('keeps an account-scoped draft across transient navigation or auth refreshes', () => {
    expect(source).toContain('ologywood.artist-onboarding.v2.${user.id}');
    expect(source).toContain('localStorage.getItem(onboardingDraftKey)');
    expect(source).toContain('localStorage.setItem(onboardingDraftKey');
    expect(source).toContain('localStorage.removeItem(onboardingDraftKey)');
    expect(source).toContain('draftRestoredRef');
  });

  it('uses a dedicated accessible acknowledgement control', () => {
    expect(source).toContain('id="creator-rights-acknowledgement"');
    expect(source).toContain('htmlFor="creator-rights-acknowledgement"');
    expect(source).toContain('setCreatorRightsAcknowledged(e.target.checked)');
    expect(source).toContain('Open the documents in a new tab');
  });

  it('keeps rights and terms documents from replacing the onboarding page', () => {
    expect(source).toContain('href="/creator-rights" target="_blank"');
    expect(source).toContain('href="/terms-of-service" target="_blank"');
    expect(source).toContain('onClick={(event) => event.stopPropagation()}');
  });
});
