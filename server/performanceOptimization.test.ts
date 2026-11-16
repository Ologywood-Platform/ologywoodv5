import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');
const viteSource = readFileSync(resolve(process.cwd(), 'vite.config.ts'), 'utf8');
const packageSource = readFileSync(resolve(process.cwd(), 'package.json'), 'utf8');
const bundleBudgetSource = readFileSync(resolve(process.cwd(), 'scripts/checkBundleBudget.mjs'), 'utf8');
const artistDashboardSource = readFileSync(resolve(process.cwd(), 'client/src/pages/ArtistDashboardV3.tsx'), 'utf8');
const venueDashboardSource = readFileSync(resolve(process.cwd(), 'client/src/pages/VenueDashboard.tsx'), 'utf8');

describe('production performance safeguards', () => {
  it('keeps the homepage out of the application shell chunk', () => {
    expect(appSource).toContain('const Home = lazy(() => import("./pages/Home"));');
    expect(appSource).not.toContain('import Home from "./pages/Home";');
  });

  it('provides a branded animated fallback while the homepage chunk loads', () => {
    expect(appSource).toContain('data-testid="home-page-skeleton"');
    expect(appSource).toContain('animate-pulse');
    expect(appSource).toContain('<Home />');
  });

  it('defers heavy dashboard panels until their dashboard route or section is rendered', () => {
    for (const source of [artistDashboardSource, venueDashboardSource]) {
      expect(source).toContain('lazy(() => import(');
      expect(source).toContain('<Suspense fallback={<DashboardPanelFallback');
    }
    expect(artistDashboardSource).toContain("lazy(() => import('@/components/BookingCalendar'))");
    expect(venueDashboardSource).toContain("lazy(() => import('../components/VenueCalendar'))");
  });

  it('limits the Manus preview runtime to Vite serve mode', () => {
    expect(viteSource).toContain('apply: "serve" as const');
    expect(viteSource).toContain('plugins: [...basePlugins, manusPreviewRuntime]');
    expect(viteSource).toContain('injects a large inline script');
  });

  it('keeps production route chunks within automated size budgets', () => {
    expect(packageSource).toContain('"check:bundle": "node scripts/checkBundleBudget.mjs"');
    expect(bundleBudgetSource).toContain('maxBytes: 600_000');
    expect(bundleBudgetSource).toContain('maxBytes: 240_000');
    expect(bundleBudgetSource).toContain('maxBytes: 160_000');
  });
});
