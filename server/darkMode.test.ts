import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const clientDir = join(__dirname, '..', 'client', 'src');

function readFile(relativePath: string): string {
  return readFileSync(join(clientDir, relativePath), 'utf-8');
}

describe('Dark Mode Toggle Feature', () => {
  describe('ThemeProvider Configuration', () => {
    it('should have switchable enabled in App.tsx', () => {
      const app = readFile('App.tsx');
      expect(app).toContain('switchable={true}');
    });

    it('should have ThemeProvider wrapping the app', () => {
      const app = readFile('App.tsx');
      expect(app).toContain('<ThemeProvider');
      expect(app).toContain('defaultTheme="light"');
    });

    it('ThemeContext should support toggleTheme function', () => {
      const ctx = readFile('contexts/ThemeContext.tsx');
      expect(ctx).toContain('toggleTheme');
      expect(ctx).toContain('switchable');
      expect(ctx).toContain('localStorage.setItem("theme"');
      expect(ctx).toContain('localStorage.getItem("theme"');
    });

    it('ThemeContext should add/remove dark class on document root', () => {
      const ctx = readFile('contexts/ThemeContext.tsx');
      expect(ctx).toContain('root.classList.add("dark")');
      expect(ctx).toContain('root.classList.remove("dark")');
    });
  });

  describe('DarkModeToggle Component', () => {
    it('should exist and export DarkModeToggle', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('export function DarkModeToggle');
    });

    it('should use useTheme hook', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('useTheme');
      expect(toggle).toContain('toggleTheme');
    });

    it('should render Sun icon for dark mode and Moon icon for light mode', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('Sun');
      expect(toggle).toContain('Moon');
    });

    it('should support compact prop for icon-only variant', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('compact');
    });

    it('should have proper aria-label for accessibility', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('aria-label');
      expect(toggle).toContain('Switch to light mode');
      expect(toggle).toContain('Switch to dark mode');
    });

    it('should return null when not switchable', () => {
      const toggle = readFile('components/DarkModeToggle.tsx');
      expect(toggle).toContain('if (!switchable');
      expect(toggle).toContain('return null');
    });
  });

  describe('SiteHeader Dark Mode Integration', () => {
    it('should import DarkModeToggle', () => {
      const header = readFile('components/SiteHeader.tsx');
      expect(header).toContain("import { DarkModeToggle }");
    });

    it('should render DarkModeToggle in desktop nav', () => {
      const header = readFile('components/SiteHeader.tsx');
      expect(header).toContain('<DarkModeToggle compact');
    });

    it('should have dark-aware header background', () => {
      const header = readFile('components/SiteHeader.tsx');
      expect(header).toContain('dark:bg-gray-900');
      expect(header).toContain('dark:border-gray-800');
    });

    it('should have dark-aware text colors in nav links', () => {
      const header = readFile('components/SiteHeader.tsx');
      expect(header).toContain('dark:text-gray-300');
    });

    it('should have dark-aware mobile menu', () => {
      const header = readFile('components/SiteHeader.tsx');
      // Mobile dropdown should have dark bg
      const mobileMenuMatch = header.includes('dark:bg-gray-900') && header.includes('dark:border-gray-800');
      expect(mobileMenuMatch).toBe(true);
    });
  });

  describe('DashboardHeader Dark Mode Integration', () => {
    it('should import DarkModeToggle', () => {
      const header = readFile('components/DashboardHeader.tsx');
      expect(header).toContain("import { DarkModeToggle }");
    });

    it('should render DarkModeToggle', () => {
      const header = readFile('components/DashboardHeader.tsx');
      expect(header).toContain('<DarkModeToggle compact');
    });

    it('should have dark-aware header styling', () => {
      const header = readFile('components/DashboardHeader.tsx');
      expect(header).toContain('dark:bg-gray-900');
      expect(header).toContain('dark:border-gray-800');
    });

    it('should have dark-aware user info text', () => {
      const header = readFile('components/DashboardHeader.tsx');
      expect(header).toContain('dark:text-gray-100');
      expect(header).toContain('dark:text-gray-400');
    });
  });

  describe('CSS Dark Mode Variables', () => {
    const css = readFileSync(join(clientDir, 'index.css'), 'utf-8');

    it('should define .dark class with CSS variables', () => {
      expect(css).toContain('.dark {');
    });

    it('should have dark background variable', () => {
      expect(css).toContain('--background: oklch(0.141');
    });

    it('should have dark card variable', () => {
      expect(css).toContain('--card: oklch(0.21');
    });

    it('should have dark foreground variable', () => {
      expect(css).toContain('--foreground: oklch(0.85');
    });

    it('should have dark primary using purple (not blue)', () => {
      // Primary should be purple-ish (hue ~285), not blue
      expect(css).toMatch(/\.dark\s*\{[^}]*--primary:\s*oklch\([^)]*285\)/);
    });

    it('should have chart colors using purple hues in dark mode', () => {
      expect(css).toContain('--chart-1: oklch(0.7 0.15 285)');
    });
  });

  describe('Global Dark Mode Overrides', () => {
    const css = readFileSync(join(clientDir, 'index.css'), 'utf-8');

    it('should override bg-white in dark mode', () => {
      expect(css).toContain('.dark .bg-white');
    });

    it('should override bg-gray-50 in dark mode', () => {
      expect(css).toContain('.dark .bg-gray-50');
    });

    it('should override border-gray-200 in dark mode', () => {
      expect(css).toContain('.dark .border-gray-200');
    });

    it('should override text-gray colors in dark mode', () => {
      expect(css).toContain('.dark .text-gray-600');
      expect(css).toContain('.dark .text-gray-700');
      expect(css).toContain('.dark .text-gray-800');
      expect(css).toContain('.dark .text-gray-900');
    });

    it('should override bg-purple-50 and bg-blue-50 for dark gradients', () => {
      expect(css).toContain('.dark .bg-purple-50');
      expect(css).toContain('.dark .bg-blue-50');
    });

    it('should override shadow classes in dark mode', () => {
      expect(css).toContain('.dark .shadow-sm');
      expect(css).toContain('.dark .shadow-lg');
      expect(css).toContain('.dark .shadow-xl');
    });

    it('should override gradient from/to/via classes', () => {
      expect(css).toContain('.dark .from-purple-50');
      expect(css).toContain('.dark .to-blue-50');
      expect(css).toContain('.dark .via-blue-50');
    });

    it('should override hover states in dark mode', () => {
      expect(css).toMatch(/\.dark .hover\\:bg-gray-50:hover/);
      expect(css).toMatch(/\.dark .hover\\:bg-white:hover/);
    });
  });

  describe('Artist Dashboard Dark Mode', () => {
    it('should have dark gradient background', () => {
      const dashboard = readFile('pages/ArtistDashboardV3.tsx');
      expect(dashboard).toContain('dark:from-gray-900');
      expect(dashboard).toContain('dark:to-gray-950');
    });

    it('should have dark header styling', () => {
      const dashboard = readFile('pages/ArtistDashboardV3.tsx');
      expect(dashboard).toContain('dark:bg-gray-900');
      expect(dashboard).toContain('dark:border-gray-800');
    });

    it('should have dark text colors', () => {
      const dashboard = readFile('pages/ArtistDashboardV3.tsx');
      expect(dashboard).toContain('dark:text-gray-100');
      expect(dashboard).toContain('dark:text-gray-400');
    });
  });

  describe('Venue Dashboard Dark Mode', () => {
    it('should have dark gradient background', () => {
      const dashboard = readFile('pages/VenueDashboard.tsx');
      expect(dashboard).toContain('dark:from-gray-900');
      expect(dashboard).toContain('dark:to-gray-950');
    });

    it('should have dark text colors', () => {
      const dashboard = readFile('pages/VenueDashboard.tsx');
      expect(dashboard).toContain('dark:text-gray-100');
      expect(dashboard).toContain('dark:text-gray-400');
    });
  });

  describe('Footer Dark Mode', () => {
    it('should have dark background variant', () => {
      const footer = readFile('components/Footer.tsx');
      expect(footer).toContain('dark:bg-gray-950');
    });
  });

  describe('Transition Smoothness', () => {
    it('SiteHeader should have transition-colors duration', () => {
      const header = readFile('components/SiteHeader.tsx');
      expect(header).toContain('transition-colors duration-200');
    });

    it('DashboardHeader should have transition-colors duration', () => {
      const header = readFile('components/DashboardHeader.tsx');
      expect(header).toContain('transition-colors duration-200');
    });

    it('ArtistDashboardV3 should have transition-colors duration', () => {
      const dashboard = readFile('pages/ArtistDashboardV3.tsx');
      expect(dashboard).toContain('transition-colors duration-200');
    });

    it('VenueDashboard should have transition-colors duration', () => {
      const dashboard = readFile('pages/VenueDashboard.tsx');
      expect(dashboard).toContain('transition-colors duration-200');
    });
  });
});
