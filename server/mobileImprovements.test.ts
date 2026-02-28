import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const clientDir = path.join(__dirname, '..', 'client', 'src');

describe('Sticky Booking Bar', () => {
  const stickyBarPath = path.join(clientDir, 'components', 'StickyBookingBar.tsx');
  const artistProfilePath = path.join(clientDir, 'pages', 'ArtistProfile.tsx');

  it('StickyBookingBar component file exists', () => {
    expect(fs.existsSync(stickyBarPath)).toBe(true);
  });

  it('StickyBookingBar accepts required props', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('artistName');
    expect(src).toContain('feeRangeMin');
    expect(src).toContain('feeRangeMax');
    expect(src).toContain('onBookClick');
    expect(src).toContain('heroRef');
  });

  it('StickyBookingBar is only visible on mobile (sm:hidden)', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('sm:hidden');
  });

  it('StickyBookingBar uses IntersectionObserver or scroll listener', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toMatch(/scroll|IntersectionObserver|getBoundingClientRect/);
  });

  it('StickyBookingBar has smooth show/hide animation', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toMatch(/transition|translate-y/);
  });

  it('StickyBookingBar shows Request Booking button', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('Request Booking');
  });

  it('StickyBookingBar shows price range when available', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('feeText');
    expect(src).toContain('DollarSign');
  });

  it('ArtistProfile imports StickyBookingBar', () => {
    const src = fs.readFileSync(artistProfilePath, 'utf-8');
    expect(src).toContain("import { StickyBookingBar }");
  });

  it('ArtistProfile has heroRef for scroll detection', () => {
    const src = fs.readFileSync(artistProfilePath, 'utf-8');
    expect(src).toContain('heroRef');
    expect(src).toContain('useRef');
  });

  it('ArtistProfile renders StickyBookingBar with correct props', () => {
    const src = fs.readFileSync(artistProfilePath, 'utf-8');
    expect(src).toContain('<StickyBookingBar');
    expect(src).toContain('heroRef={heroRef}');
    expect(src).toContain('onBookClick');
  });

  it('StickyBookingBar opens booking dialog on click', () => {
    const src = fs.readFileSync(artistProfilePath, 'utf-8');
    expect(src).toContain('setBookingDialogOpen(true)');
  });

  it('StickyBookingBar has fixed positioning at bottom', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('fixed');
    expect(src).toContain('bottom-0');
  });

  it('StickyBookingBar has backdrop blur for visual quality', () => {
    const src = fs.readFileSync(stickyBarPath, 'utf-8');
    expect(src).toContain('backdrop-blur');
  });
});

describe('Mobile Dashboard Bottom Navigation', () => {
  const mobileNavPath = path.join(clientDir, 'components', 'MobileBottomNav.tsx');
  const dashboardPath = path.join(clientDir, 'pages', 'ArtistDashboardV3.tsx');

  it('MobileBottomNav component file exists', () => {
    expect(fs.existsSync(mobileNavPath)).toBe(true);
  });

  it('MobileBottomNav supports dashboard mode', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("mode");
    expect(src).toContain("dashboard");
  });

  it('MobileBottomNav dashboard mode has Overview tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain('Overview');
    expect(src).toContain('LayoutDashboard');
  });

  it('MobileBottomNav dashboard mode has Bookings tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("label: 'Bookings'");
    expect(src).toContain("path: '/bookings'");
  });

  it('MobileBottomNav dashboard mode has Messages tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("label: 'Messages'");
    expect(src).toContain("path: '/messages'");
  });

  it('MobileBottomNav dashboard mode has Earnings tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("label: 'Earnings'");
    expect(src).toContain("path: '/earnings'");
  });

  it('MobileBottomNav dashboard mode has More tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("label: 'More'");
    expect(src).toContain('MoreHorizontal');
  });

  it('MobileBottomNav is only visible on mobile (sm:hidden)', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain('sm:hidden');
  });

  it('MobileBottomNav has fixed positioning at bottom', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain('fixed bottom-0');
  });

  it('MobileBottomNav highlights active tab', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain('aria-current');
    expect(src).toContain('text-primary');
  });

  it('MobileBottomNav has backdrop blur', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain('backdrop-blur');
  });

  it('ArtistDashboardV3 imports MobileBottomNav', () => {
    const src = fs.readFileSync(dashboardPath, 'utf-8');
    expect(src).toContain("import { MobileBottomNav }");
  });

  it('ArtistDashboardV3 renders MobileBottomNav in dashboard mode', () => {
    const src = fs.readFileSync(dashboardPath, 'utf-8');
    expect(src).toContain('<MobileBottomNav mode="dashboard"');
  });

  it('ArtistDashboardV3 has quick-actions id for More tab scroll', () => {
    const src = fs.readFileSync(dashboardPath, 'utf-8');
    expect(src).toContain('id="quick-actions"');
  });

  it('MobileBottomNav More tab scrolls to quick-actions', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("getElementById('quick-actions')");
    expect(src).toContain('scrollIntoView');
  });

  it('MobileBottomNav includes spacer div to prevent content overlap', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toMatch(/h-1[46]\s+sm:hidden/);
  });

  it('MobileBottomNav public mode has Home and Browse tabs', () => {
    const src = fs.readFileSync(mobileNavPath, 'utf-8');
    expect(src).toContain("label: 'Home'");
    expect(src).toContain("label: 'Browse'");
  });
});

describe('Pull-to-Refresh on Browse Pages', () => {
  const hookPath = path.join(clientDir, 'hooks', 'usePullToRefresh.tsx');
  const browsePath = path.join(clientDir, 'pages', 'Browse.tsx');
  const venueBrowsePath = path.join(clientDir, 'pages', 'VenueBrowse.tsx');

  it('usePullToRefresh hook file exists', () => {
    expect(fs.existsSync(hookPath)).toBe(true);
  });

  it('usePullToRefresh accepts onRefresh callback', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('onRefresh');
  });

  it('usePullToRefresh has configurable threshold', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('threshold');
  });

  it('usePullToRefresh has configurable maxPull', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('maxPull');
  });

  it('usePullToRefresh returns PullIndicator component', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('PullIndicator');
  });

  it('usePullToRefresh returns isRefreshing state', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('isRefreshing');
  });

  it('usePullToRefresh handles touch events', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('touchstart');
    expect(src).toContain('touchmove');
    expect(src).toContain('touchend');
  });

  it('usePullToRefresh only activates at top of page', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toMatch(/scrollY|scrollTop/);
  });

  it('usePullToRefresh applies resistance curve for natural feel', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('Math.min');
    expect(src).toContain('* 0.5');
  });

  it('usePullToRefresh PullIndicator shows progress states', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('Refreshing...');
    expect(src).toContain('Release to refresh');
    expect(src).toContain('Pull to refresh');
  });

  it('usePullToRefresh PullIndicator has spinner animation', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('animate-spin');
  });

  it('usePullToRefresh PullIndicator is only visible on mobile (sm:hidden)', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('sm:hidden');
  });

  it('usePullToRefresh has mobileOnly option', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('mobileOnly');
  });

  it('usePullToRefresh cleans up event listeners', () => {
    const src = fs.readFileSync(hookPath, 'utf-8');
    expect(src).toContain('removeEventListener');
  });

  it('Browse page imports usePullToRefresh', () => {
    const src = fs.readFileSync(browsePath, 'utf-8');
    expect(src).toContain("import { usePullToRefresh }");
  });

  it('Browse page uses PullIndicator', () => {
    const src = fs.readFileSync(browsePath, 'utf-8');
    expect(src).toContain('<PullIndicator');
  });

  it('Browse page refreshes artist data on pull', () => {
    const src = fs.readFileSync(browsePath, 'utf-8');
    expect(src).toContain('refetchArtists');
  });

  it('VenueBrowse page imports usePullToRefresh', () => {
    const src = fs.readFileSync(venueBrowsePath, 'utf-8');
    expect(src).toContain("import { usePullToRefresh }");
  });

  it('VenueBrowse page uses PullIndicator', () => {
    const src = fs.readFileSync(venueBrowsePath, 'utf-8');
    expect(src).toContain('<PullIndicator');
  });
});
