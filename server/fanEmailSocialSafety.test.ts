import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ getDb: vi.fn(), createNotification: vi.fn(), sendEmail: vi.fn(), eligible: vi.fn(), lockRecipient: vi.fn(), lockUser: vi.fn(), revoke: vi.fn() }));
vi.mock('./db', () => ({ getDb: m.getDb, createNotification: m.createNotification }));
vi.mock('./email', () => ({ sendEmail: m.sendEmail }));
vi.mock('./services/fanEmailConsentService', () => ({ getEligibleFanEmailRecipients: m.eligible, withEligibleFanEmailRecipient: m.lockRecipient, withFanEmailUserLock: m.lockUser, revokeFanEmailConsent: m.revoke }));
vi.mock('./_core/env', () => ({ ENV: { baseUrl: 'https://www.ologywood.com' } }));
import { getFollowers, getFollowing, getTrendingUsers, followUser, unfollowUser, getFanEmailList, removeAllFollows } from './services/followService';
import { assertFanEmailCreator } from './services/fanEmailAccessService';
import { notifyFansNewEvent, notifyFansProfileUpdate } from './services/fanNotificationService';
import { users } from '../drizzle/schema';

let queue: any[][];
let selections: Array<{ projection: any; table?: any }>;
let execute: ReturnType<typeof vi.fn>;
let actions: string[];
const follow = { id: 1, followerId: 2, followingId: 1, followingType: 'artist', createdAt: new Date('2026-10-17T00:00:00Z') };
const syntheticUser = { id: 2, name: 'Fan', role: 'fan', email: 'private@example.test', passwordHash: 'must-not-leak' };
const recipient = { id: 2, name: '<img src=x>', email: 'allowed@example.test', followedAt: follow.createdAt, consentRevision: 3 };

beforeEach(() => {
  vi.resetAllMocks(); queue = []; selections = []; actions = [];
  m.getDb.mockResolvedValue({ select: vi.fn((projection: any) => {
    const result = queue.shift() ?? [];
    const selected: any = { projection }; selections.push(selected);
    const chain: any = { from: vi.fn(table => { selected.table = table; return chain; }), innerJoin: vi.fn(() => chain), where: vi.fn(() => chain), limit: vi.fn(() => chain), offset: vi.fn(() => chain), orderBy: vi.fn(() => chain), then: (resolve: any) => resolve(result) };
    return chain;
  }) });
  execute = vi.fn(async (sql: string) => { actions.push(sql); return sql.startsWith('SELECT') ? [[{ id: 1, followingId: 1 }], []] : [{ affectedRows: 1 }, []]; });
  m.lockUser.mockImplementation(async (_id, callback) => { actions.push('LOCK'); const value = await callback({ execute }); actions.push('COMMIT'); return value; });
  m.revoke.mockImplementation(async () => { actions.push('REVOKE'); });
  m.eligible.mockResolvedValue([]); m.createNotification.mockResolvedValue(undefined); m.sendEmail.mockResolvedValue(true);
  m.lockRecipient.mockImplementation(async (_creator, _id, _rev, callback) => ({ eligible: true, value: await callback(recipient, 'https://www.ologywood.com/unsubscribe?fanToken=signed') }));
});

describe('Private contacts never come from social APIs', () => {
  it('getFollowers exposes display data, never email or credentials, regardless of mocked DB extras', async () => {
    queue = [[follow], [syntheticUser]];
    const result = await getFollowers(1);
    expect(result[0]).not.toHaveProperty('email'); expect(JSON.stringify(result)).not.toContain('must-not-leak');
    const query = selections.find(x => x.table === users)!;
    expect(Object.keys(query.projection).sort()).toEqual(['id', 'name', 'role']);
  });
  it('getFollowing excludes creator contact details and credentials', async () => {
    queue = [[follow], [syntheticUser], [{ id: 11, artistName: 'Creator', profilePhotoUrl: null }], []];
    const result = await getFollowing(2);
    expect(result[0]).not.toHaveProperty('email'); expect(result[0].name).toBe('Creator');
    expect(Object.keys(selections.find(x => x.table === users)!.projection)).not.toContain('email');
  });
  it('trending social results contain no private email', async () => {
    queue = [[follow], [syntheticUser]];
    expect((await getTrendingUsers('artist'))[0]).not.toHaveProperty('email');
  });
  it('the sole contact-list service uses eligible consent recipients, not all followers', async () => {
    await getFanEmailList(1, 100, 2);
    expect(m.eligible).toHaveBeenCalledWith(1, 100, 2);
    expect(selections).toHaveLength(0);
  });
});

describe('Follow is not consent; unfollow revokes atomically', () => {
  it('creates a follow without creating any consent or enabling email', async () => {
    execute.mockImplementation(async (sql: string) => { actions.push(sql); return sql.startsWith('SELECT') ? [[], []] : [{ affectedRows: 1 }, []]; });
    expect(await followUser(2, 1, 'artist')).toBe(true);
    expect(m.lockUser).toHaveBeenCalledWith(2, expect.any(Function));
    expect(actions.some(sql => sql.startsWith('INSERT INTO follows'))).toBe(true);
    expect(actions.join(' ')).not.toContain('fan_email_consents'); expect(m.revoke).not.toHaveBeenCalled();
  });
  it('revokes consent on the same locked connection before deleting an artist follow', async () => {
    expect(await unfollowUser(2, 1, 'artist')).toBe(true);
    expect(actions[0]).toBe('LOCK'); expect(actions.indexOf('REVOKE')).toBeLessThan(actions.findIndex(x => x.startsWith('DELETE')));
    expect(actions.at(-1)).toBe('COMMIT'); expect(m.revoke).toHaveBeenCalledWith(2, 1, expect.objectContaining({ execute }));
  });
  it('does not delete follow data if consent revocation fails', async () => {
    m.revoke.mockRejectedValue(new Error('Unavailable'));
    await expect(unfollowUser(2, 1, 'artist')).rejects.toThrow('Unavailable');
    expect(actions.some(x => x.startsWith('DELETE'))).toBe(false); expect(actions).not.toContain('COMMIT');
  });
  it('venue following never creates artist-email permission', async () => {
    await unfollowUser(2, 1, 'venue'); expect(m.revoke).not.toHaveBeenCalled();
  });
  it('account follow cleanup revokes artist permissions before removing follow rows', async () => {
    await removeAllFollows(2); expect(m.revoke).toHaveBeenCalledWith(2, 1, expect.anything());
    expect(actions.indexOf('REVOKE')).toBeLessThan(actions.findIndex(x => x.startsWith('DELETE')));
  });
});

describe('Creator email access is owner/profile based', () => {
  it('permits an actual standalone creator profile', async () => { queue = [[{ id: 11, name: 'Creator' }], []]; await expect(assertFanEmailCreator(1)).resolves.toBeUndefined(); });
  it('denies a no-profile account even if its role elsewhere is admin', async () => { queue = [[], []]; await expect(assertFanEmailCreator(1)).rejects.toMatchObject({ code: 'FORBIDDEN' }); });
  it('denies legacy standalone profiles on non-owner team-member accounts', async () => { queue = [[{ id: 11, name: 'Legacy' }], [{ id: 9 }]]; await expect(assertFanEmailCreator(1)).rejects.toMatchObject({ code: 'FORBIDDEN' }); });
  it('fails closed on an unavailable ownership source', async () => { m.getDb.mockResolvedValue(null); await expect(assertFanEmailCreator(1)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' }); });
});

describe('Automatic creator email news uses the same consent boundary', () => {
  it('keeps in-app event news for followers who did not opt in to email', async () => {
    queue = [[{ id: 11, name: 'Creator' }], [{ id: 2 }, { id: 3 }]];
    await notifyFansNewEvent(1, { eventTitle: 'Show', eventDate: '2026-11-01', eventId: 5 });
    expect(m.createNotification).toHaveBeenCalledTimes(2); expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('does not email a revoked snapshot, while in-app news remains independent', async () => {
    queue = [[{ id: 11, name: 'Creator' }], [{ id: 2 }]]; m.eligible.mockResolvedValue([recipient]); m.lockRecipient.mockResolvedValue({ eligible: false });
    await notifyFansNewEvent(1, { eventTitle: 'Show', eventDate: '2026-11-01' });
    expect(m.createNotification).toHaveBeenCalledTimes(1); expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('escapes event/news inputs and supplies scoped one-click headers', async () => {
    queue = [[{ id: 11, name: '<script>Creator</script>' }], []]; m.eligible.mockResolvedValue([recipient]);
    await notifyFansNewEvent(1, { eventTitle: '<script>Title</script>', eventDate: '<img>', eventLocation: '<svg>' });
    const [payload, options] = m.sendEmail.mock.calls[0];
    expect(payload.html).not.toContain('<script>'); expect(payload.html).toContain('&lt;svg&gt;');
    expect(options).toMatchObject({ timeoutMs: 8000, oneClickUnsubscribe: true, unsubscribeUrl: expect.stringContaining('/api/email/unsubscribe?fanToken=') });
  });
  it('does not fall back to all followers on email eligibility source failure', async () => {
    queue = [[{ id: 11, name: 'Creator' }], [{ id: 2 }]]; m.eligible.mockRejectedValue(new Error('Unavailable'));
    await notifyFansNewEvent(1, { eventTitle: 'Show', eventDate: '2026-11-01' });
    expect(m.sendEmail).not.toHaveBeenCalled(); expect(m.createNotification).toHaveBeenCalledTimes(1);
  });
  it('suppresses profile-update emails with no opt-in', async () => {
    queue = [[{ id: 11, name: 'Creator' }]];
    expect(await notifyFansProfileUpdate(1, { updateType: 'bio', summary: 'New bio' })).toEqual({ sent: 0, failed: 0 });
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('rechecks profile-update recipients and escapes their content', async () => {
    queue = [[{ id: 11, name: 'Creator' }]]; m.eligible.mockResolvedValue([recipient]);
    await notifyFansProfileUpdate(1, { updateType: 'bio', summary: '<img src=x>' });
    expect(m.lockRecipient).toHaveBeenCalledWith(1, 2, 3, expect.any(Function));
    expect(m.sendEmail.mock.calls[0][0].html).toContain('&lt;img src=x&gt;');
  });
});
