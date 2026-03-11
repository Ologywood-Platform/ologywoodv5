import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Settings Page Route', () => {
  const appTsx = readFileSync(resolve(__dirname, '../../client/src/App.tsx'), 'utf-8');
  const settingsPage = readFileSync(resolve(__dirname, '../../client/src/pages/Settings.tsx'), 'utf-8');

  it('should have /settings route registered in App.tsx', () => {
    expect(appTsx).toContain('path="/settings"');
    expect(appTsx).toContain('component={Settings}');
  });

  it('should lazy-load the Settings page', () => {
    expect(appTsx).toContain('import("./pages/Settings")');
  });

  it('Settings page should import EmailPreferencesCenter', () => {
    expect(settingsPage).toContain('EmailPreferencesCenter');
  });

  it('Settings page should handle unauthenticated users', () => {
    // Should show sign-in prompt for non-logged-in users
    expect(settingsPage).toContain('Sign In Required');
    expect(settingsPage).toContain('sign in to manage your email preferences');
  });

  it('Settings page should link to unsubscribe as fallback', () => {
    expect(settingsPage).toContain('/unsubscribe');
  });

  it('Settings page should have breadcrumb navigation', () => {
    expect(settingsPage).toContain('PageBreadcrumb');
    expect(settingsPage).toContain('Dashboard');
    expect(settingsPage).toContain('Settings');
  });
});

describe('Email Manage Preferences Link in Emails', () => {
  const emailTs = readFileSync(resolve(__dirname, '../email.ts'), 'utf-8');

  it('should link to /settings for manage preferences', () => {
    // The manage preferences link should point to /settings
    expect(emailTs).toContain('Manage preferences');
    expect(emailTs).toContain('/settings');
  });

  it('should use baseUrl for manage preferences link, not hardcoded domain', () => {
    // All manage preferences links should use ${baseUrl}/settings
    const managePrefsMatches = emailTs.match(/Manage preferences/g);
    expect(managePrefsMatches).toBeTruthy();
    expect(managePrefsMatches!.length).toBeGreaterThan(0);

    // Ensure no hardcoded ologywood.com in manage preferences links
    const hardcodedSettingsLinks = emailTs.match(/https?:\/\/ologywood\.com\/settings/g);
    expect(hardcodedSettingsLinks).toBeNull();
  });
});
