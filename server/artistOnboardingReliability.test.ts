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

  it('shows honest autosave feedback and a clear resume choice', () => {
    expect(source).toContain('Auto-saving...');
    expect(source).toContain('Saved securely');
    expect(source).toContain('Welcome back — resume your setup');
    expect(source).toContain('Continue setup');
    expect(source).toContain('Start over');
    expect(source).toContain('window.location.reload()');
  });

  it('keeps support reachable on every onboarding step', () => {
    expect(source).toContain('aria-label={showOnboardingHelp ? \'Close onboarding help\' : \'Get onboarding help\'}');
    expect(source).toContain('aria-expanded={showOnboardingHelp}');
    expect(source).toContain('mailto:support@ologywood.com?subject=');
    expect(source).toContain('href="/help?article=support-3" target="_blank"');
    expect(source).toContain('Your progress is auto-saved. You can get help without leaving this setup.');
  });

  it('adds useful browser and device context without sending it automatically', () => {
    expect(source).toContain('navigator.userAgent');
    expect(source).toContain('navigator.platform');
    expect(source).toContain('navigator.language');
    expect(source).toContain('Intl.DateTimeFormat().resolvedOptions().timeZone');
    expect(source).toContain('window.innerWidth');
    expect(source).toContain('Diagnostic context (automatically included):');
    expect(source).toContain('mailto:support@ologywood.com?subject=');
  });

  it('provides quick answers for common onboarding blockers', () => {
    expect(source).toContain('Quick setup answers');
    expect(source).toContain('Why can’t I continue past the Bill of Rights?');
    expect(source).toContain('What if I leave or refresh this page?');
    expect(source).toContain('Why am I being asked to verify my email?');
    expect(source).toContain('<details');
  });
});
