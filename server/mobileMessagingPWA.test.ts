import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ─── Mobile Messaging Page Tests ───

describe('Mobile Messaging Page', () => {
  const messagesPath = path.join(__dirname, '../client/src/pages/Messages.tsx');
  const messagesContent = fs.readFileSync(messagesPath, 'utf-8');

  describe('Mobile slide-in/slide-out navigation', () => {
    it('should have mobileShowChat state for toggling views', () => {
      expect(messagesContent).toContain('mobileShowChat');
      expect(messagesContent).toContain('setMobileShowChat');
    });

    it('should have slide transition classes for mobile conversation list', () => {
      expect(messagesContent).toContain('-translate-x-full');
      expect(messagesContent).toContain('translate-x-0');
    });

    it('should have slide transition classes for mobile chat panel', () => {
      expect(messagesContent).toContain('translate-x-full');
    });

    it('should use CSS transition for smooth animation', () => {
      expect(messagesContent).toContain('transition-transform');
      expect(messagesContent).toContain('duration-300');
      expect(messagesContent).toContain('ease-in-out');
    });

    it('should set mobileShowChat to true when selecting a conversation', () => {
      expect(messagesContent).toContain('setMobileShowChat(true)');
    });

    it('should have a back button handler to return to conversation list', () => {
      expect(messagesContent).toContain('handleBackToList');
      expect(messagesContent).toContain('setMobileShowChat(false)');
    });
  });

  describe('Mobile-only back button', () => {
    it('should have a back button visible only on mobile (sm:hidden)', () => {
      expect(messagesContent).toContain('sm:hidden');
      expect(messagesContent).toContain('Back to conversations');
    });

    it('should use ChevronLeft icon for back navigation', () => {
      expect(messagesContent).toContain('ChevronLeft');
    });
  });

  describe('Desktop two-column layout preserved', () => {
    it('should have a desktop grid layout with 3 columns', () => {
      expect(messagesContent).toContain('sm:grid');
      expect(messagesContent).toContain('sm:grid-cols-3');
    });

    it('should hide desktop layout on mobile', () => {
      expect(messagesContent).toContain('hidden sm:grid');
    });

    it('should show mobile layout only on small screens', () => {
      expect(messagesContent).toContain('sm:hidden');
    });

    it('should have conversation list in col-span-1 on desktop', () => {
      expect(messagesContent).toContain('col-span-1');
    });

    it('should have chat panel in col-span-2 on desktop', () => {
      expect(messagesContent).toContain('col-span-2');
    });
  });

  describe('Conversation list component', () => {
    it('should have a search input for filtering conversations', () => {
      expect(messagesContent).toContain('Search conversations');
    });

    it('should display participant avatar with initial', () => {
      expect(messagesContent).toContain('charAt(0).toUpperCase()');
    });

    it('should show unread badge on conversations', () => {
      expect(messagesContent).toContain('unreadCount');
    });

    it('should highlight selected conversation', () => {
      expect(messagesContent).toContain('bg-primary/5');
    });

    it('should show empty state when no conversations', () => {
      expect(messagesContent).toContain('No conversations found');
    });
  });

  describe('Chat panel component', () => {
    it('should have message bubbles with different styles for own vs others', () => {
      expect(messagesContent).toContain('bg-primary text-primary-foreground');
      expect(messagesContent).toContain('bg-muted');
    });

    it('should have rounded message bubbles', () => {
      expect(messagesContent).toContain('rounded-2xl');
      expect(messagesContent).toContain('rounded-br-md');
      expect(messagesContent).toContain('rounded-bl-md');
    });

    it('should auto-scroll to bottom of messages', () => {
      expect(messagesContent).toContain('messagesEndRef');
      expect(messagesContent).toContain('scrollIntoView');
    });

    it('should have touch-friendly input sizing on mobile', () => {
      expect(messagesContent).toContain('h-11 sm:h-10');
    });

    it('should have safe area bottom padding for iOS', () => {
      expect(messagesContent).toContain('safe-area-bottom');
    });

    it('should support Enter key to send messages', () => {
      expect(messagesContent).toContain('onKeyDown');
      expect(messagesContent).toContain("e.key === \"Enter\"");
    });
  });

  describe('Responsive header', () => {
    it('should have a sticky header', () => {
      expect(messagesContent).toContain('sticky top-0');
    });

    it('should have responsive text sizing', () => {
      expect(messagesContent).toContain('text-lg sm:text-2xl');
    });

    it('should show unread badge in header', () => {
      expect(messagesContent).toContain('Unread');
    });
  });
});

// ─── PWA Tests ───

describe('Progressive Web App (PWA)', () => {
  describe('manifest.json', () => {
    const manifestPath = path.join(__dirname, '../client/public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    it('should have correct app name', () => {
      expect(manifest.name).toBe('Ologywood - Artist Booking Platform');
      expect(manifest.short_name).toBe('Ologywood');
    });

    it('should have standalone display mode', () => {
      expect(manifest.display).toBe('standalone');
    });

    it('should have correct theme color', () => {
      expect(manifest.theme_color).toBe('#6D28D9');
    });

    it('should have correct background color', () => {
      expect(manifest.background_color).toBe('#ffffff');
    });

    it('should have start_url set to root', () => {
      expect(manifest.start_url).toBe('/');
    });

    it('should have portrait orientation', () => {
      expect(manifest.orientation).toBe('portrait-primary');
    });

    it('should have multiple icon sizes', () => {
      expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should have a 192x192 icon', () => {
      const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192');
      expect(icon192).toBeDefined();
      expect(icon192.type).toBe('image/png');
    });

    it('should have a 512x512 icon with maskable purpose', () => {
      const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512');
      expect(icon512).toBeDefined();
      expect(icon512.purpose).toContain('maskable');
    });

    it('should have relevant categories', () => {
      expect(manifest.categories).toContain('entertainment');
      expect(manifest.categories).toContain('music');
    });

    it('should not prefer related applications', () => {
      expect(manifest.prefer_related_applications).toBe(false);
    });
  });

  describe('Service Worker (sw.js)', () => {
    const swPath = path.join(__dirname, '../client/public/sw.js');
    const swContent = fs.readFileSync(swPath, 'utf-8');

    it('should have a versioned cache name', () => {
      expect(swContent).toMatch(/CACHE_NAME\s*=\s*'ologywood-v\d+'/);
    });

    it('should cache static assets on install', () => {
      expect(swContent).toContain('STATIC_ASSETS');
      expect(swContent).toContain("addEventListener('install'");
      expect(swContent).toContain('cache.addAll');
    });

    it('should clean up old caches on activate', () => {
      expect(swContent).toContain("addEventListener('activate'");
      expect(swContent).toContain('caches.delete');
    });

    it('should skip waiting for immediate activation', () => {
      expect(swContent).toContain('self.skipWaiting()');
    });

    it('should claim clients immediately', () => {
      expect(swContent).toContain('self.clients.claim()');
    });

    it('should skip non-GET requests', () => {
      expect(swContent).toContain("request.method !== 'GET'");
    });

    it('should skip API and tRPC routes', () => {
      expect(swContent).toContain("url.pathname.startsWith('/api/')");
      expect(swContent).toContain("url.pathname.startsWith('/trpc/')");
    });

    it('should skip auth routes', () => {
      expect(swContent).toContain("url.pathname.startsWith('/auth/')");
    });

    it('should use network-first for navigation requests', () => {
      expect(swContent).toContain("request.mode === 'navigate'");
    });

    it('should fall back to cache when offline for navigation', () => {
      expect(swContent).toContain("caches.match(request)");
      expect(swContent).toContain("caches.match('/')");
    });

    it('should use stale-while-revalidate for static assets', () => {
      // Checks for the pattern: serve cached, then update cache in background
      expect(swContent).toContain('cached || fetchPromise');
    });

    it('should handle SKIP_WAITING messages', () => {
      expect(swContent).toContain("event.data.type === 'SKIP_WAITING'");
    });
  });

  describe('index.html PWA setup', () => {
    const indexPath = path.join(__dirname, '../client/index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    it('should reference manifest.json', () => {
      expect(indexContent).toContain('rel="manifest"');
      expect(indexContent).toContain('manifest.json');
    });

    it('should have theme-color meta tag', () => {
      expect(indexContent).toContain('name="theme-color"');
      expect(indexContent).toContain('#6D28D9');
    });

    it('should have apple-mobile-web-app-capable meta tag', () => {
      expect(indexContent).toContain('apple-mobile-web-app-capable');
    });

    it('should have apple-mobile-web-app-status-bar-style', () => {
      expect(indexContent).toContain('apple-mobile-web-app-status-bar-style');
    });

    it('should have apple-touch-icon', () => {
      expect(indexContent).toContain('apple-touch-icon');
    });

    it('should register service worker', () => {
      expect(indexContent).toContain("serviceWorker.register");
      expect(indexContent).toContain("sw.js");
    });
  });

  describe('PWA Install Hook', () => {
    const hookPath = path.join(__dirname, '../client/src/hooks/usePWAInstall.ts');
    const hookContent = fs.readFileSync(hookPath, 'utf-8');

    it('should listen for beforeinstallprompt event', () => {
      expect(hookContent).toContain('beforeinstallprompt');
    });

    it('should listen for appinstalled event', () => {
      expect(hookContent).toContain('appinstalled');
    });

    it('should check for standalone display mode', () => {
      expect(hookContent).toContain('display-mode: standalone');
    });

    it('should check for iOS standalone mode', () => {
      expect(hookContent).toContain('navigator');
      expect(hookContent).toContain('standalone');
    });

    it('should have a promptInstall function', () => {
      expect(hookContent).toContain('promptInstall');
      expect(hookContent).toContain('deferredPrompt.prompt()');
    });

    it('should have a dismissInstall function with localStorage', () => {
      expect(hookContent).toContain('dismissInstall');
      expect(hookContent).toContain('pwa-install-dismissed');
    });

    it('should not show prompt again for 7 days after dismissal', () => {
      expect(hookContent).toContain('7 * 24 * 60 * 60 * 1000');
    });
  });

  describe('PWA Install Banner Component', () => {
    const bannerPath = path.join(__dirname, '../client/src/components/PWAInstallBanner.tsx');
    const bannerContent = fs.readFileSync(bannerPath, 'utf-8');

    it('should use the usePWAInstall hook', () => {
      expect(bannerContent).toContain('usePWAInstall');
    });

    it('should return null when not installable', () => {
      expect(bannerContent).toContain('if (!isInstallable) return null');
    });

    it('should have an Install App button', () => {
      expect(bannerContent).toContain('Install App');
    });

    it('should have a dismiss option', () => {
      expect(bannerContent).toContain('Not now');
      expect(bannerContent).toContain('dismissInstall');
    });

    it('should be positioned at bottom of screen', () => {
      expect(bannerContent).toContain('fixed bottom');
    });

    it('should have slide-in animation', () => {
      expect(bannerContent).toContain('animate-in');
      expect(bannerContent).toContain('slide-in-from-bottom');
    });

    it('should be positioned above mobile bottom nav', () => {
      expect(bannerContent).toContain('bottom-16 sm:bottom-4');
    });
  });

  describe('App.tsx PWA integration', () => {
    const appPath = path.join(__dirname, '../client/src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    it('should import PWAInstallBanner', () => {
      expect(appContent).toContain("import { PWAInstallBanner }");
    });

    it('should render PWAInstallBanner in the app', () => {
      expect(appContent).toContain('<PWAInstallBanner />');
    });
  });
});
