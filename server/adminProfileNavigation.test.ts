import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { artistProfiles, artistTeamMembers, venueProfiles, users } from '../drizzle/schema';
const mock = vi.hoisted(() => ({ getDb: vi.fn(), owner: vi.fn(() => false) }));
vi.mock('./db', () => ({ getDb: mock.getDb }));
vi.mock('./services/platformOwnerAccess', () => ({ isPlatformOwner: mock.owner }));
import { getAdminProfileNavigation, resolveAdminProfileNavigation } from './services/adminProfileNavigation';
import { AdminUserProfileLink } from '../client/src/components/AdminUserProfileLink';
import { adminRouter } from './routers/admin';
const artist = { id: 11, userId: 7, artistName: 'Adonis' };
const venue = { id: 4, userId: 20, organizationName: 'The Velvet Room' };
const empty = new Set<number>();
function databaseFixture() {
  const select = vi.fn((fields?: any) => ({ from: (table: any) => {
    let rows: any[] = [];
    if (table === users) rows = [{ id: 7, name: 'Owner legal name', email: 'owner@example.test', role: 'admin', emailVerified: true, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }];
    if (table === artistProfiles) rows = [artist];
    if (table === venueProfiles) rows = [venue];
    if (table === artistTeamMembers) rows = [];
    const filtered = { where: vi.fn(async () => rows) };
    return Object.assign(Promise.resolve(rows), filtered);
  }}));
  return { select };
}
beforeEach(() => { vi.clearAllMocks(); mock.owner.mockReturnValue(false); });
describe('Admin user profile navigation', () => {
 it('links to artist profile ID and name, never the user ID or legal name', () => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [artist], [], empty)).toEqual({ href: '/artist/adonis', profileName: 'Adonis', profileType: 'artist', status: 'available' });
 });
 it('opens artist owner profile even when account role is admin', () => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'admin' }, [artist], [], empty).href).toBe('/artist/adonis');
 });
 it('resolves venue name to canonical public venue URL', () => {
  expect(resolveAdminProfileNavigation({ id: 20, role: 'venue' }, [], [venue], empty).href).toBe('/venue/the-velvet-room');
 });
 it('prefers venue for venue-role accounts with legacy dual profiles', () => {
  expect(resolveAdminProfileNavigation({ id: 20, role: 'venue' }, [{ ...artist, userId: 20 }], [venue], empty).profileType).toBe('venue');
 });
 it('does not give collaborators a standalone artist link', () => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [artist], [], new Set([7]))).toMatchObject({ href: null, status: 'team_member' });
 });
 it('suppresses legacy team-member named profiles without a membership row', () => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [{ ...artist, artistName: 'Shayla - Team Member (TEST)' }], [], empty).status).toBe('team_member');
 });
 it('explains fan/missing profiles without manufacturing a URL', () => {
  expect(resolveAdminProfileNavigation({ id: 9, role: 'fan' }, [], [], empty)).toMatchObject({ href: null, status: 'not_created' });
 });
 it.each(['', '   ', '!!!'])('never generates empty artist URL for %j', artistName => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [{ ...artist, artistName }], [], empty)).toMatchObject({ href: null, status: 'unavailable' });
 });
 it('never links zero profile IDs', () => {
  expect(resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [{ ...artist, id: 0 }], [], empty).href).toBeNull();
 });
 it('fetches only three profile/membership summaries for a page', async () => {
  const db = databaseFixture();
  expect((await getAdminProfileNavigation(db as any, [{ id: 7, role: 'admin' }])).get(7)?.href).toBe('/artist/adonis');
  expect(db.select).toHaveBeenCalledTimes(3);
 });
 it('does not query profile tables for an empty result page', async () => {
  const db = databaseFixture();
  expect((await getAdminProfileNavigation(db as any, [])).size).toBe(0);
  expect(db.select).not.toHaveBeenCalled();
 });
 it('returns profile navigation through admin getUsers without projecting authentication secrets', async () => {
  const db = databaseFixture(); mock.getDb.mockResolvedValue(db);
  const result = await adminRouter.createCaller({ user: { id: 1, role: 'admin' }, req: {}, res: {} } as any).getUsers({ limit: 50, offset: 0 });
  expect(result.users[0].profileNavigation?.href).toBe('/artist/adonis');
  const fields = db.select.mock.calls[0][0];
  expect(fields).not.toHaveProperty('passwordHash');
  expect(fields).not.toHaveProperty('emailVerificationToken');
  expect(result.total).toBe(1);
 });
 it('denies ordinary users before profile lookup', async () => {
  await expect(adminRouter.createCaller({ user: { id: 9, role: 'user' }, req: {}, res: {} } as any).getUsers({ limit: 50, offset: 0 })).rejects.toThrow('Admin access required');
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it('renders a keyboard-accessible name anchor in a separate tab with profile name context', () => {
  const profile = resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [artist], [], empty);
  const html = renderToStaticMarkup(createElement(AdminUserProfileLink, { name: 'Owner legal name', profile }));
  expect(html).toContain('href="/artist/adonis"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html).toContain('opens in a new tab');
  expect(html).toContain('Adonis');
 });
 it('renders clear non-link explanations for collaborator and uncreated profile', () => {
  const team = renderToStaticMarkup(createElement(AdminUserProfileLink, { name: 'Assistant', profile: resolveAdminProfileNavigation({ id: 7, role: 'artist' }, [artist], [], new Set([7])) }));
  const missing = renderToStaticMarkup(createElement(AdminUserProfileLink, { name: 'Fan' }));
  expect(team).toContain('Team member — no standalone profile');
  expect(team).not.toContain('href=');
  expect(missing).toContain('No public profile created');
  expect(missing).not.toContain('href=');
 });
});
