import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { CORE_DESTINATIONS, getWorkspaceRole, isDestinationActive } from '../client/src/lib/ecosystemNavigation';

const read = (relative: string) => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf-8');

describe('canonical ecosystem contract', () => {
  it('defines exactly six destinations with Discover first', () => {
    expect(CORE_DESTINATIONS.map((item) => item.label)).toEqual([
      'Discover', 'Experiences', 'Shop', 'Community', 'My Ology', 'Workspace',
    ]);
    expect(CORE_DESTINATIONS[0].href).toBe('/discover');
  });

  it('maps legacy feature pages into their canonical destination', () => {
    expect(isDestinationActive('/browse', CORE_DESTINATIONS[0].matches)).toBe(true);
    expect(isDestinationActive('/events/123', CORE_DESTINATIONS[1].matches)).toBe(true);
    expect(isDestinationActive('/my-music', CORE_DESTINATIONS[4].matches)).toBe(true);
    expect(isDestinationActive('/venue-dashboard', CORE_DESTINATIONS[5].matches)).toBe(true);
  });

  it('maps authenticated roles to role-aware workspaces', () => {
    expect(getWorkspaceRole({ role: 'artist' })).toBe('creator');
    expect(getWorkspaceRole({ role: 'venue' })).toBe('venue');
    expect(getWorkspaceRole({ role: 'blogger' })).toBe('blogger');
    expect(getWorkspaceRole({ role: 'fan' })).toBe('fan');
    expect(getWorkspaceRole({ role: 'team_member' })).toBe('team');
    expect(getWorkspaceRole({ role: 'artist', isAdmin: true })).toBe('creator');
    expect(getWorkspaceRole({ role: 'admin', isAdmin: true })).toBe('admin');
  });
});

describe('core route wiring and compatibility', () => {
  const app = read('client/src/App.tsx');
  const dashboardUrl = read('client/src/utils/dashboardUrl.ts');

  it.each(['/discover', '/experiences', '/shop', '/community', '/my-ology', '/workspace'])('wires %s', (route) => {
    expect(app).toContain(`path="${route}"`);
  });

  it('keeps legacy feature routes while making Workspace the role home', () => {
    expect(app).toContain('path="/dashboard"');
    expect(app).toContain('path="/venue-dashboard"');
    expect(app).toContain('path="/admin"');
    expect(dashboardUrl).toContain("return '/workspace'");
  });
});

describe('role-aware Workspace', () => {
  const workspace = read('client/src/pages/Workspace.tsx');
  const create = read('client/src/components/CreateActionDialog.tsx');
  const team = read('server/routers/team.ts');

  it('prioritizes real booking, fulfillment, profile, payout, moderation, and draft states', () => {
    expect(workspace).toContain('Needs Attention');
    expect(workspace).toContain('getMyArtistBookings');
    expect(workspace).toContain('sellerOrders');
    expect(workspace).toContain('getAccountStatus');
    expect(workspace).toContain('getIncompleteProfiles');
    expect(workspace).toContain('getFlaggedVideoCount');
    expect(workspace).toContain("status: 'draft'");
  });

  it('uses role-specific section language and keeps Admin separate', () => {
    expect(workspace).toContain("{ label: 'People', href: '/admin' }");
    expect(workspace).toContain("{ label: 'Commerce', href: '/admin/payouts' }");
    expect(workspace).toContain("{ label: 'Creator', href: workspaceLinks[0]?.href || '/team' }");
    expect(workspace).toContain('Admin Workspace');
    expect(workspace).toContain('Team Workspace');
    expect(workspace).toContain('Choose Workspace context');
    expect(workspace).toContain("navigate('/workspace?view=creator')");
    expect(workspace).toContain("navigate('/workspace?view=admin')");
  });

  it('offers contextual create actions rather than one generic menu', () => {
    for (const label of ['Sandbox Post', 'Event & tickets', 'Shop item or Book', 'Content release', 'Fan Club', 'Ology Live session', 'Venue event', 'Blog post']) {
      expect(create).toContain(label);
    }
  });

  it('resolves only the signed-in collaborator membership and permissions', () => {
    expect(team).toContain('getMyWorkspaceContext: protectedProcedure');
    expect(team).toContain('eq(artistTeamMembers.userId, ctx.user.id)');
    expect(team).toContain('permissions: membership.permissions');
    expect(workspace).toContain("!['admin', 'venue', 'blogger'].includes(baseRole)");
  });
});

describe('My Ology return destination', () => {
  const myOlogy = read('client/src/pages/MyOlogy.tsx');

  it('centralizes purchases, tickets, bookings, orders, library, live sessions, memberships, and following', () => {
    for (const procedure of ['myPurchases', 'getMyTickets', 'getMyClientBookings', 'myOrders', 'getFollowing', 'myLibrary', 'listMyMemberships', 'getMyFanSessions']) {
      expect(myOlogy).toContain(procedure);
    }
    expect(myOlogy).toContain('Fan Club memberships');
    expect(myOlogy).toContain('Ology Live sessions');
    expect(myOlogy).toContain('Everything you book, buy, and follow—together');
    expect(myOlogy).toContain('Recent activity');
  });

  it('has truthful loading, error, empty, and next-action states', () => {
    expect(myOlogy).toContain('Loading your Ology');
    expect(myOlogy).toContain('Some activity could not be loaded');
    expect(myOlogy).toContain('Your activity will collect here');
    expect(myOlogy).toContain('What is next?');
  });
});

describe('profile-centered flywheel', () => {
  const artistActions = read('client/src/components/ProfileJourneyActions.tsx');
  const venueActions = read('client/src/components/VenueJourneyActions.tsx');
  const artistProfile = read('client/src/pages/ArtistProfile.tsx');
  const venueProfile = read('client/src/pages/VenueProfile.tsx');

  it('makes creator actions understandable from the public profile', () => {
    for (const label of ['Book', 'Attend', 'Buy', 'Watch / Listen', 'Join']) expect(artistActions).toContain(label);
    expect(artistActions).toContain('FollowButton');
    expect(artistProfile).toContain('<ProfileJourneyActions');
  });

  it('makes venue actions understandable from the public profile', () => {
    for (const label of ['Book venue', 'Attend', 'Shop', 'Message']) expect(venueActions).toContain(label);
    expect(venueActions).toContain('FollowVenueButton');
    expect(venueProfile).toContain('<VenueJourneyActions');
  });
});

describe('global footer alignment', () => {
  const footer = read('client/src/components/Footer.tsx');

  it('reinforces all six core destinations', () => {
    for (const pathName of ['/discover', '/experiences', '/shop', '/community', '/my-ology', '/workspace']) {
      expect(footer).toContain(`path: '${pathName}'`);
    }
  });
});
