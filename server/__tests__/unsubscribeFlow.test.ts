import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Unsubscribe Page - Confirmation and Scope', () => {
  const page = readFileSync(resolve(__dirname, '../../client/src/pages/Unsubscribe.tsx'), 'utf-8');
  const preferences = readFileSync(resolve(__dirname, '../../client/src/components/EmailPreferencesCenter.tsx'), 'utf-8');

  it('requires confirmation and never auto-unsubscribes on page load', () => {
    expect(page).toContain('useState<PageState>("confirm")');
    expect(page).toContain('Confirm email preference');
    expect(page).not.toMatch(/useEffect[\s\S]*handleUnsubscribe\(\)/);
  });
  it('explains that creator unsubscribe preserves following, global settings, and transactional scope', () => {
    expect(page).toContain('It will not unfollow the creator');
    expect(page).toContain('or stop booking and purchase emails');
    expect(page).toContain('change your account-wide email settings');
  });
  it('provides an authenticated reduce-frequency option without opting into creator email', () => {
    expect(page).toContain('handleReduceFrequency');
    expect(page).toContain('Reduce my emails');
    const reduce = page.slice(page.indexOf('const handleReduceFrequency'), page.indexOf('const handleSubmitFeedback'));
    expect(reduce).not.toContain('fanUpdates: true');
  });
  it('links to existing account settings for granular control and account email restoration', () => {
    expect(page).toContain('href="/settings"');
    expect(page).toContain('Choose account email settings');
    expect(preferences).toContain('Restore Account Emails');
    expect(preferences).toContain('This does not add permission for any creator');
  });
  it('offers explicit creator and account confirmation actions with correct labels', () => {
    expect(page).toContain('Yes, stop this creator’s updates');
    expect(page).toContain('Yes, unsubscribe my account');
    expect(page).toContain('border-red-300');
  });
  it('provides an escape route and a confirmed preference-updated result', () => {
    expect(page).toContain('Never mind, take me back');
    expect(page).toContain('Preference updated');
  });
  it('requires login only for legacy identifier links, never treats query identity as authority', () => {
    expect(page).toContain('Sign in required');
    expect(page).toContain('Sign In to Manage Preferences');
    expect(page).not.toContain('params.get("email")');
    expect(page).not.toContain('params.get("userId")');
  });
  it('uses public signed-token query then explicit token mutation for anonymous creator opt-out', () => {
    expect(page).toContain('trpc.emailPreferences.getFanUnsubscribe.useQuery');
    expect(page).toContain('trpc.emailPreferences.unsubscribeFan.useMutation');
    expect(page).toContain('scope !== "creator_updates"');
  });
  it('cannot fall back to global unsubscribe when a supplied fan token becomes invalid', () => {
    expect(page).toContain('if (fanToken !== null)');
    expect(page).toContain('if (!isFanTokenFlow || !fanToken) throw');
    expect(page).toContain('params.has("fanToken") && !token?.trim()');
  });
  it('has honest invalid/error states rather than reporting unconfirmed success', () => {
    expect(page).toContain('Something went wrong');
    expect(page).toContain('Try Again');
    expect(page).toContain('No email preference was changed');
    expect(page).toContain('No change was confirmed');
  });
  it('uses one root shared header and gives no scoped-token resubscribe authority', () => {
    expect(page.match(/<SiteHeader\s*\/>/g)).toHaveLength(1);
    expect(page).not.toContain('resubscribe.useMutation');
  });
});
