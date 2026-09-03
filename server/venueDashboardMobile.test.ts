import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Venue Dashboard Mobile Navigation', () => {
  const venueDashboardPath = path.join(__dirname, '../client/src/pages/VenueDashboard.tsx');
  const venueDashboardContent = fs.readFileSync(venueDashboardPath, 'utf-8');

  const mobileBottomNavPath = path.join(__dirname, '../client/src/components/MobileBottomNav.tsx');
  const mobileBottomNavContent = fs.readFileSync(mobileBottomNavPath, 'utf-8');

  const ecosystemNavigationPath = path.join(__dirname, '../client/src/lib/ecosystemNavigation.ts');
  const ecosystemNavigationContent = fs.readFileSync(ecosystemNavigationPath, 'utf-8');

  describe('Unified six-destination contract', () => {
    it('keeps legacy dashboard modes only as a backward-compatible prop contract', () => {
      expect(mobileBottomNavContent).toContain("type NavMode = 'public' | 'dashboard' | 'venue-dashboard'");
      expect(mobileBottomNavContent).toContain("mode: _mode = 'public'");
      expect(mobileBottomNavContent).toContain('role-specific destinations now belong inside Workspace');
      expect(mobileBottomNavContent).not.toContain('venueDashboardNavItems');
    });

    it('renders the authoritative destination list instead of a competing venue-only rail', () => {
      expect(mobileBottomNavContent).toContain("import { CORE_DESTINATIONS, isDestinationActive }");
      expect(mobileBottomNavContent).toContain('CORE_DESTINATIONS.map');
      expect(mobileBottomNavContent).toContain('grid-cols-6');
    });

    it.each([
      ['Discover', '/discover'],
      ['Experiences', '/experiences'],
      ['Shop', '/shop'],
      ['Community', '/community'],
      ['My Ology', '/my-ology'],
      ['Workspace', '/workspace'],
    ])('keeps %s at its canonical path %s', (label, href) => {
      expect(ecosystemNavigationContent).toContain(`label: '${label}'`);
      expect(ecosystemNavigationContent).toContain(`href: '${href}'`);
    });

    it('keeps legacy venue dashboard paths grouped under Workspace', () => {
      expect(ecosystemNavigationContent).toContain("matches: ['/workspace', '/dashboard', '/venue-dashboard', '/admin', '/blogger-dashboard']");
    });

    it('navigates every mobile destination to its canonical href', () => {
      expect(mobileBottomNavContent).toContain('onClick={() => navigate(item.href)}');
      expect(mobileBottomNavContent).toContain('isDestinationActive(pathname, item.matches)');
    });
  });

  describe('VenueDashboard integration', () => {
    it('retains the shared mobile navigation on the legacy venue dashboard', () => {
      expect(venueDashboardContent).toContain("import { MobileBottomNav }");
      expect(venueDashboardContent).toContain('<MobileBottomNav mode="venue-dashboard"');
    });

    it('retains the venue profile section used by existing internal dashboard navigation', () => {
      expect(venueDashboardContent).toContain('id="venue-profile-section"');
    });
  });

  describe('VenueDashboard mobile-responsive layout', () => {
    it('keeps responsive spacing and typography for compact screens', () => {
      expect(venueDashboardContent).toContain('px-3 py-4 sm:p-6');
      expect(venueDashboardContent).toContain('text-2xl sm:text-4xl');
      expect(venueDashboardContent).toContain('text-sm sm:text-base');
      expect(venueDashboardContent).toContain('space-y-4 sm:space-y-6');
    });

    it('keeps compact, readable dashboard tabs', () => {
      expect(venueDashboardContent).toContain('text-xs sm:text-sm');
      expect(venueDashboardContent).toContain('h-3.5 w-3.5 sm:h-4 sm:w-4');
      expect(venueDashboardContent).toContain('truncate');
      expect(venueDashboardContent).toContain('h-auto');
    });
  });

  describe('Shared mobile behavior', () => {
    it('shows the bottom rail below the desktop breakpoint and reserves page space', () => {
      expect(mobileBottomNavContent).toContain('h-20 lg:hidden');
      expect(mobileBottomNavContent).toContain('fixed bottom-0');
      expect(mobileBottomNavContent).toContain('backdrop-blur-md lg:hidden');
    });

    it('supports safe-area spacing on iOS devices', () => {
      expect(mobileBottomNavContent).toContain('safe-area-inset-bottom');
    });

    it('provides destination and active-state accessibility semantics', () => {
      expect(mobileBottomNavContent).toContain('aria-label="Core OlogyWood destinations"');
      expect(mobileBottomNavContent).toContain('aria-label={item.label}');
      expect(mobileBottomNavContent).toContain("aria-current={active ? 'page' : undefined}");
    });
  });
});
