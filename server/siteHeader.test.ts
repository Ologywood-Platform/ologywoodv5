import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

describe('SiteHeader unified ecosystem navigation', () => {
  const siteHeaderPath = path.resolve(__dirname, '../client/src/components/SiteHeader.tsx');
  const content = fs.readFileSync(siteHeaderPath, 'utf-8');

  it('renders the six canonical destinations from one shared contract', () => {
    expect(content).toContain('CORE_DESTINATIONS.map');
    expect(content).toContain('isDestinationActive');
  });

  it('keeps search, create, inbox, notifications, and account as utilities', () => {
    expect(content).toContain('aria-label="Search OlogyWood"');
    expect(content).toContain('CreateActionDialog');
    expect(content).toContain('aria-label="Inbox"');
    expect(content).toContain('RealtimeNotifications');
    expect(content).toContain('Account');
  });

  it('moves supporting links into the More menu', () => {
    expect(content).toContain('LEARN_DESTINATIONS.map');
    expect(content).toContain('More');
  });

  it('preserves authentication, theme, tips, and responsive mobile behavior', () => {
    expect(content).toContain('useAuth');
    expect(content).toContain('LogoutButton');
    expect(content).toContain('HelperNotesToggle');
    expect(content).toContain('DarkModeToggle');
    expect(content).toContain('openSignIn');
    expect(content).toContain('lg:hidden');
  });

  it('does not expose role-specific My Music as a global destination', () => {
    expect(content).not.toContain('href="/my-music"');
  });
});

describe('Global shell coverage', () => {
  const pages = [
    'Home',
    'Browse',
    'ArtistProfile',
    'VenueProfile',
    'EventDetail',
    'EventDiscovery',
    'Following',
    'Workspace',
    'MyOlogy',
    'CoreDestinationHub',
  ];

  for (const page of pages) {
    it(`${page} renders the shared SiteHeader`, () => {
      const content = fs.readFileSync(path.resolve(__dirname, `../client/src/pages/${page}.tsx`), 'utf-8');
      expect(content).toContain('SiteHeader');
      expect(content).toContain('<SiteHeader');
    });
  }
});
