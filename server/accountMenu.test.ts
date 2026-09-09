import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getAccountMenuItems } from '../client/src/lib/accountMenu';

describe('role-aware account menu', () => {
  it('uses the exact creator-owner account order and clean profile route', () => {
    expect(getAccountMenuItems({
      userRole: 'artist',
      isCreatorOwner: true,
      artistName: 'Adonis',
    })).toEqual([
      { id: 'profile', label: 'My Profile', href: '/artist/adonis' },
      { id: 'artist-dashboard', label: 'Artist Dashboard', href: '/dashboard' },
      { id: 'my-ology', label: 'My Ology', href: '/my-ology' },
      { id: 'workspace', label: 'Workspace', href: '/workspace' },
      { id: 'settings', label: 'Account Settings', href: '/settings' },
    ]);
  });

  it('routes invited collaborators to their owner profile and one Team Workspace entry', () => {
    const items = getAccountMenuItems({
      userRole: 'artist',
      isCreatorOwner: false,
      teamContext: { artistName: 'Owner Artist', role: 'manager' },
    });

    expect(items).toEqual([
      { id: 'profile', label: 'My Profile', href: '/artist/owner-artist' },
      { id: 'team-workspace', label: 'Team Workspace', href: '/workspace' },
      { id: 'my-ology', label: 'My Ology', href: '/my-ology' },
      { id: 'settings', label: 'Account Settings', href: '/settings' },
    ]);
    expect(items.some((item) => item.id === 'artist-dashboard')).toBe(false);
    expect(items.filter((item) => item.href === '/workspace')).toHaveLength(1);
  });

  it('does not expose Artist Dashboard to venue, fan, or ordinary accounts', () => {
    for (const userRole of ['venue', 'fan', 'user']) {
      const items = getAccountMenuItems({ userRole, isCreatorOwner: false });
      expect(items.some((item) => item.id === 'artist-dashboard')).toBe(false);
    }
  });

  it('preserves the six primary destinations and fixes post-invite routing', () => {
    const header = fs.readFileSync(path.resolve(__dirname, '../client/src/components/SiteHeader.tsx'), 'utf8');
    const invite = fs.readFileSync(path.resolve(__dirname, '../client/src/pages/AcceptTeamInvite.tsx'), 'utf8');

    expect(header).toContain('CORE_DESTINATIONS.map');
    expect(header).not.toContain("CORE_DESTINATIONS.push");
    expect(invite).toContain("navigate('/workspace')");
    expect(invite).not.toContain("navigate('/artist-dashboard')");
  });
});
