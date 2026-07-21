import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Venue Dashboard Mobile Bottom Navigation', () => {
  const venueDashboardPath = path.join(__dirname, '../client/src/pages/VenueDashboard.tsx');
  const venueDashboardContent = fs.readFileSync(venueDashboardPath, 'utf-8');

  const mobileBottomNavPath = path.join(__dirname, '../client/src/components/MobileBottomNav.tsx');
  const mobileBottomNavContent = fs.readFileSync(mobileBottomNavPath, 'utf-8');

  describe('MobileBottomNav venue-dashboard mode', () => {
    it('should support venue-dashboard mode type', () => {
      expect(mobileBottomNavContent).toContain("'venue-dashboard'");
    });

    it('should have venue dashboard nav items with Overview tab', () => {
      expect(mobileBottomNavContent).toContain("path: '/venue-dashboard'");
    });

    it('should have venue dashboard nav items with Bookings tab', () => {
      const venueSection = mobileBottomNavContent.substring(
        mobileBottomNavContent.indexOf('venueDashboardNavItems')
      );
      expect(venueSection).toContain("label: 'Bookings'");
    });

    it('should have venue dashboard nav items with Messages tab', () => {
      const venueSection = mobileBottomNavContent.substring(
        mobileBottomNavContent.indexOf('venueDashboardNavItems')
      );
      expect(venueSection).toContain("label: 'Messages'");
    });

    it('should have venue dashboard nav items with Artists tab', () => {
      const venueSection = mobileBottomNavContent.substring(
        mobileBottomNavContent.indexOf('venueDashboardNavItems')
      );
      expect(venueSection).toContain("label: 'Artists'");
    });

    it('should have venue dashboard nav items with More tab', () => {
      const venueSection = mobileBottomNavContent.substring(
        mobileBottomNavContent.indexOf('venueDashboardNavItems')
      );
      expect(venueSection).toContain("label: 'More'");
    });

    it('should select venue-dashboard items when mode is venue-dashboard', () => {
      expect(mobileBottomNavContent).toContain("mode === 'venue-dashboard'");
      expect(mobileBottomNavContent).toContain('venueDashboardNavItems');
    });

    it('should recognize venue-dashboard path as active for overview', () => {
      expect(mobileBottomNavContent).toContain("pathname === '/venue-dashboard'");
    });

    it('should handle More button scroll to venue-profile-section', () => {
      expect(mobileBottomNavContent).toContain("document.getElementById('venue-profile-section')");
    });

    it('should navigate to venue-dashboard when More is clicked from other pages', () => {
      expect(mobileBottomNavContent).toContain("navigate(mode === 'venue-dashboard' ? '/venue-dashboard' : '/dashboard')");
    });
  });

  describe('VenueDashboard integration', () => {
    it('should import MobileBottomNav', () => {
      expect(venueDashboardContent).toContain("import { MobileBottomNav }");
    });

    it('should render MobileBottomNav with venue-dashboard mode', () => {
      expect(venueDashboardContent).toContain('<MobileBottomNav mode="venue-dashboard"');
    });

    it('should have venue-profile-section id on profile tab for scroll target', () => {
      expect(venueDashboardContent).toContain('id="venue-profile-section"');
    });
  });

  describe('VenueDashboard mobile-responsive layout', () => {
    it('should have responsive padding (smaller on mobile)', () => {
      expect(venueDashboardContent).toContain('px-3 py-4 sm:p-6');
    });

    it('should have responsive title sizing', () => {
      expect(venueDashboardContent).toContain('text-2xl sm:text-4xl');
    });

    it('should have responsive subtitle sizing', () => {
      expect(venueDashboardContent).toContain('text-sm sm:text-base');
    });

    it('should have responsive tab trigger text sizing', () => {
      expect(venueDashboardContent).toContain('text-xs sm:text-sm');
    });

    it('should have responsive tab trigger icon sizing', () => {
      expect(venueDashboardContent).toContain('h-3.5 w-3.5 sm:h-4 sm:w-4');
    });

    it('should have truncated tab labels for small screens', () => {
      expect(venueDashboardContent).toContain('truncate');
    });

    it('should have responsive spacing between sections', () => {
      expect(venueDashboardContent).toContain('space-y-4 sm:space-y-6');
    });

    it('should have auto height on TabsList for flexible wrapping', () => {
      expect(venueDashboardContent).toContain('h-auto');
    });
  });

  describe('MobileBottomNav shared behavior', () => {
    it('should only show on mobile screens (sm:hidden)', () => {
      expect(mobileBottomNavContent).toContain('sm:hidden');
    });

    it('should have fixed bottom positioning', () => {
      expect(mobileBottomNavContent).toContain('fixed bottom-0');
    });

    it('should have backdrop blur for glass effect', () => {
      expect(mobileBottomNavContent).toContain('backdrop-blur-md');
    });

    it('should have safe-area-bottom for iOS notch devices', () => {
      expect(mobileBottomNavContent).toContain('safe-area-inset-bottom');
    });

    it('should have 5 columns grid layout', () => {
      expect(mobileBottomNavContent).toContain('grid-cols-5');
    });

    it('should have spacer div to prevent content overlap', () => {
      expect(mobileBottomNavContent).toContain('h-20 sm:hidden');
    });

    it('should support badge display on nav items', () => {
      expect(mobileBottomNavContent).toContain('item.badge');
    });

    it('should have aria-label for accessibility', () => {
      expect(mobileBottomNavContent).toContain('aria-label={item.label}');
    });

    it('should have aria-current for active state', () => {
      expect(mobileBottomNavContent).toContain("aria-current={active ? 'page' : undefined}");
    });
  });
});
