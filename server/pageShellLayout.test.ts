import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settingsSource = readFileSync(new URL('../client/src/pages/Settings.tsx', import.meta.url), 'utf8');
const earningsSource = readFileSync(new URL('../client/src/pages/ArtistEarnings.tsx', import.meta.url), 'utf8');
const projectsSource = readFileSync(new URL('../client/src/pages/ProjectsPage.tsx', import.meta.url), 'utf8');

function sourceForFunction(source: string, name: string, nextName: string) {
  return source.slice(source.indexOf(`function ${name}`), source.indexOf(`function ${nextName}`));
}

describe('root page shell layouts', () => {
  it('keeps the Settings header in a root shell for loading, signed-out, and authenticated states', () => {
    const notificationPreferences = sourceForFunction(settingsSource, 'NotificationPreferencesSection', 'ProfilePictureSection');

    expect(settingsSource.match(/<SiteHeader\s*\/>/g)).toHaveLength(1);
    expect(settingsSource).toContain('function SettingsPageShell');
    expect(settingsSource.match(/<SettingsPageShell>/g)).toHaveLength(3);
    expect(notificationPreferences).not.toContain('SiteHeader');
    expect(settingsSource).not.toContain('<header className="sticky');
  });

  it('keeps the earnings header at the page root and contains responsive content locally', () => {
    const incomeBreakdown = sourceForFunction(earningsSource, 'IncomeBreakdownChart', 'TransactionHistoryTable');

    expect(earningsSource.match(/<SiteHeader\s*\/>/g)).toHaveLength(1);
    expect(earningsSource).toContain('function EarningsPageShell');
    expect(earningsSource.match(/<EarningsPageShell>/g)).toHaveLength(2);
    expect(incomeBreakdown).not.toContain('SiteHeader');
    expect(earningsSource).toContain('className="container mx-auto w-full max-w-5xl min-w-0 px-4 py-6"');
    expect(earningsSource).toContain('className="min-w-0 space-y-6"');
    expect(earningsSource.match(/className="w-full overflow-x-auto"/g)).toHaveLength(2);
  });

  it('leaves project navigation intact while delegating the only page heading to ProjectPreviewManager', () => {
    expect(projectsSource.match(/<SiteHeader\s*\/>/g)).toHaveLength(1);
    expect(projectsSource).not.toContain('<header');
    expect(projectsSource).not.toContain('<h1');
    expect(projectsSource).toContain("navigate('/dashboard')");
    expect(projectsSource).toContain('<PageBreadcrumb');
    expect(projectsSource).toContain('<ProjectPreviewManager />');
  });
});
