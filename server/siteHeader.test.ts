import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('SiteHeader Component', () => {
  const siteHeaderPath = path.resolve(__dirname, '../client/src/components/SiteHeader.tsx');
  const siteHeaderContent = fs.readFileSync(siteHeaderPath, 'utf-8');

  it('should exist as a component file', () => {
    expect(fs.existsSync(siteHeaderPath)).toBe(true);
  });

  it('should export a default function component', () => {
    expect(siteHeaderContent).toContain('export default function SiteHeader');
  });

  it('should import useAuth for authentication state', () => {
    expect(siteHeaderContent).toContain("useAuth");
  });

  it('should include a Following link to /following', () => {
    expect(siteHeaderContent).toContain('href="/following"');
    expect(siteHeaderContent).toContain('Following');
  });

  it('should include a Heart icon for the Following link', () => {
    expect(siteHeaderContent).toContain('Heart');
    expect(siteHeaderContent).toContain('lucide-react');
  });

  it('should only show Following link when authenticated', () => {
    // The Following link should be inside the isAuthenticated conditional block
    const authBlock = siteHeaderContent.match(/\{isAuthenticated \? \(([\s\S]*?)\) : \(/);
    expect(authBlock).not.toBeNull();
    expect(authBlock![1]).toContain('/following');
  });

  it('should show Log In button when not authenticated', () => {
    expect(siteHeaderContent).toContain('Log In');
    expect(siteHeaderContent).toContain('openSignIn');
  });

  it('should include Dashboard link for authenticated users', () => {
    expect(siteHeaderContent).toContain('getDashboardUrl');
    expect(siteHeaderContent).toContain('Dashboard');
  });

  it('should support hideBrowse prop', () => {
    expect(siteHeaderContent).toContain('hideBrowse');
    expect(siteHeaderContent).toContain('!hideBrowse');
  });

  it('should support largeLogo prop', () => {
    expect(siteHeaderContent).toContain('largeLogo');
    expect(siteHeaderContent).toContain('logo-lg.png');
    expect(siteHeaderContent).toContain('logo-sm.png');
  });

  it('should support extraNav prop', () => {
    expect(siteHeaderContent).toContain('extraNav');
  });

  it('should highlight Following button when on /following page', () => {
    expect(siteHeaderContent).toContain('isFollowingPage');
    expect(siteHeaderContent).toContain("location === '/following'");
  });

  it('should include a Logout button for authenticated users', () => {
    expect(siteHeaderContent).toContain('LogoutButton');
    expect(siteHeaderContent).toContain('LogOut');
  });

  it('should include FAQ link in mobile menu pointing to /pricing#faq', () => {
    expect(siteHeaderContent).toContain('href="/pricing#faq"');
    expect(siteHeaderContent).toContain('>\n                FAQ\n');
  });
});

describe('Pages using SiteHeader', () => {
  const pages = [
    { name: 'Home', path: '../client/src/pages/Home.tsx' },
    { name: 'Browse', path: '../client/src/pages/Browse.tsx' },
    { name: 'ArtistProfile', path: '../client/src/pages/ArtistProfile.tsx' },
    { name: 'VenueProfile', path: '../client/src/pages/VenueProfile.tsx' },
    { name: 'EventDetail', path: '../client/src/pages/EventDetail.tsx' },
    { name: 'EventDiscovery', path: '../client/src/pages/EventDiscovery.tsx' },
    { name: 'Following', path: '../client/src/pages/Following.tsx' },
  ];

  pages.forEach(({ name, path: pagePath }) => {
    it(`${name} page should import SiteHeader`, () => {
      const fullPath = path.resolve(__dirname, pagePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain("import SiteHeader from");
    });

    it(`${name} page should render <SiteHeader`, () => {
      const fullPath = path.resolve(__dirname, pagePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain('<SiteHeader');
    });
  });

  it('Browse page should pass hideBrowse prop to SiteHeader', () => {
    const browsePath = path.resolve(__dirname, '../client/src/pages/Browse.tsx');
    const content = fs.readFileSync(browsePath, 'utf-8');
    expect(content).toContain('hideBrowse');
  });

  it('Home page should pass largeLogo prop to SiteHeader', () => {
    const homePath = path.resolve(__dirname, '../client/src/pages/Home.tsx');
    const content = fs.readFileSync(homePath, 'utf-8');
    expect(content).toContain('largeLogo');
  });
});

describe('Following route', () => {
  it('should have /following route defined in App.tsx', () => {
    const appPath = path.resolve(__dirname, '../client/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    expect(content).toContain('path="/following"');
    expect(content).toContain('Following');
  });
});
