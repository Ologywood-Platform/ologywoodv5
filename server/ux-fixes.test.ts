import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const clientSrc = join(__dirname, '..', 'client', 'src');

describe('UX Fix 1: Clear X icon on search inputs', () => {
  it('ClearableInput component exists with X clear button', () => {
    const filePath = join(clientSrc, 'components', 'ui', 'clearable-input.tsx');
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('onClear');
    expect(content).toContain('X');
    expect(content).toContain('aria-label');
    expect(content).toContain('Clear input');
  });

  it('Home page uses ArtistSearchDropdown for search (which wraps ClearableInput)', () => {
    const filePath = join(clientSrc, 'pages', 'Home.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('ArtistSearchDropdown');
    // ArtistSearchDropdown internally uses ClearableInput with onClear
    const dropdownPath = join(clientSrc, 'components', 'ArtistSearchDropdown.tsx');
    const dropdownContent = readFileSync(dropdownPath, 'utf-8');
    expect(dropdownContent).toContain('ClearableInput');
    expect(dropdownContent).toContain('onClear');
  });

  it('Browse page uses ClearableInput for search', () => {
    const filePath = join(clientSrc, 'pages', 'Browse.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('ClearableInput');
    expect(content).toContain('onClear');
  });

  it('SearchFilters uses ClearableInput for location', () => {
    const filePath = join(clientSrc, 'components', 'SearchFilters.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('ClearableInput');
    expect(content).toContain('onClear');
  });

  it.skip('ArtistSearchFilters has clear button on search input (moved to _deprecated)', () => {
    const filePath = join(clientSrc, 'components', 'ArtistSearchFilters.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Clear search');
    expect(content).toContain('Clear location');
  });

  it.skip('AdvancedSearchFilters has clear button on main search (moved to _deprecated)', () => {
    const filePath = join(clientSrc, 'components', 'AdvancedSearchFilters.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Clear search');
    expect(content).toContain('setQuery(\'\')');
  });
});

describe('UX Fix 2: Empty state messages for blank sections', () => {
  it('Browse page Events tab has empty state message', () => {
    const filePath = join(clientSrc, 'pages', 'Browse.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('No Events Available');
    expect(content).toContain('no events scheduled');
  });

  it('EventDiscovery has improved empty state with icon', () => {
    const filePath = join(clientSrc, 'pages', 'EventDiscovery.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('No Events Found');
    expect(content).toContain('no public events posted yet');
  });

  it('VenueBrowse has improved empty state with icon', () => {
    const filePath = join(clientSrc, 'pages', 'VenueBrowse.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('No Venues Found');
    expect(content).toContain('no venues matching your criteria');
  });
});

describe('UX Fix 3: No-results message visibility', () => {
  it('Browse page has auto-scroll to no-results message', () => {
    const filePath = join(clientSrc, 'pages', 'Browse.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('noResultsRef');
    expect(content).toContain('scrollIntoView');
    expect(content).toContain('No Artists Found');
  });

  it('Browse page no-results includes Clear Search button', () => {
    const filePath = join(clientSrc, 'pages', 'Browse.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('Clear Search');
  });
});

describe('UX Fix 4: Scroll-to-top on route navigation', () => {
  it('ScrollToTop component exists', () => {
    const filePath = join(clientSrc, 'components', 'ScrollToTop.tsx');
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('useLocation');
    expect(content).toContain('scrollTo');
  });

  it('App.tsx includes ScrollToTop component', () => {
    const filePath = join(clientSrc, 'App.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('ScrollToTop');
    expect(content).toContain('<ScrollToTop />');
  });
});
