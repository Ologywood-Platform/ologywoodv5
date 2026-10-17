import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  getDb: vi.fn(), sendEmail: vi.fn(), assertCreator: vi.fn(), hasAccess: vi.fn(),
  recipients: vi.fn(), count: vi.fn(), lockedRecipient: vi.fn(), userLock: vi.fn(),
  getConsent: vi.fn(), setConsent: vi.fn(), revoke: vi.fn(),
  followCount: vi.fn(), fanList: vi.fn(), followers: vi.fn(), following: vi.fn(),
}));
vi.mock('./db', () => ({ getDb: m.getDb }));
vi.mock('./email', () => ({ sendEmail: m.sendEmail }));
vi.mock('./services/fanEmailAccessService', () => ({ assertFanEmailCreator: m.assertCreator }));
vi.mock('./services/pricingTierService', () => ({ hasFeatureAccess: m.hasAccess }));
vi.mock('./services/fanEmailConsentService', () => ({
  getEligibleFanEmailRecipients: m.recipients, getEligibleFanEmailCount: m.count,
  withEligibleFanEmailRecipient: m.lockedRecipient, withFanEmailUserLock: m.userLock,
  getFanEmailConsent: m.getConsent, setFanEmailConsent: m.setConsent, revokeFanEmailConsent: m.revoke,
}));
vi.mock('./services/followService', () => ({ getFollowerCount: m.followCount, getFanEmailList: m.fanList, getFollowers: m.followers, getFollowing: m.following }));
vi.mock('./_core/env', () => ({ ENV: { baseUrl: 'https://www.ologywood.com' } }));

import { buildUpdateEmail, sendArtistUpdate } from './services/artistUpdateService';
import { fanEmailCsvCell } from './services/fanEmailFormatting';
import { followsRouter } from './routers/follows';
import { artistUpdatesRouter } from './routers/artistUpdates';
import { artistUpdates } from '../drizzle/schema';

const fan = { id: 2, name: 'Fan <img src=x>', email: 'fan@example.test', followedAt: new Date('2026-10-17T00:00:00Z'), consentRevision: 4 };
const unsubscribeUrl = 'https://www.ologywood.com/unsubscribe?fanToken=signed-proof';
const context = (id = 1, role = 'artist') => ({ user: { id, role, openId: 'synthetic', email: 'owner@example.test' }, req: {}, res: {} } as any);
let execute: ReturnType<typeof vi.fn>;
let set: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetAllMocks();
  let selectedTable: unknown;
  const chain: any = { from: vi.fn(table => { selectedTable = table; return chain; }), where: vi.fn(() => chain), orderBy: vi.fn(() => chain), limit: vi.fn(async () => selectedTable === artistUpdates ? [] : [{ id: 11, name: 'Creator <script>' }]) };
  set = vi.fn(() => ({ where: vi.fn(async () => undefined) }));
  m.getDb.mockResolvedValue({ select: vi.fn(() => chain), update: vi.fn(() => ({ set })) });
  execute = vi.fn(async (sql: string) => sql.startsWith('SELECT') ? [[], []] : [{ insertId: 77 }, []]);
  m.userLock.mockImplementation(async (_id, work) => work({ execute }));
  m.assertCreator.mockResolvedValue(undefined); m.hasAccess.mockResolvedValue(true);
  m.recipients.mockResolvedValue([fan]); m.count.mockResolvedValue(1);
  m.fanList.mockResolvedValue([fan]); m.followCount.mockResolvedValue(3);
  m.sendEmail.mockResolvedValue(true);
  m.lockedRecipient.mockImplementation(async (_creator, _fan, _rev, work) => ({ eligible: true, value: await work(fan, unsubscribeUrl) }));
});

describe('Consent-aware fan email delivery', () => {
  it('rechecks the exact consent revision under a recipient lock and uses bounded scoped delivery', async () => {
    const result = await sendArtistUpdate(1, 'New <song>', 'Hello <script>alert(1)</script>\nNext line');
    expect(m.lockedRecipient).toHaveBeenCalledWith(1, 2, 4, expect.any(Function));
    expect(m.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: fan.email, html: expect.stringContaining('&lt;script&gt;') }), {
      timeoutMs: 8000, unsubscribeUrl: 'https://www.ologywood.com/api/email/unsubscribe?fanToken=signed-proof', oneClickUnsubscribe: true,
    });
    expect(m.sendEmail.mock.calls[0][0].html).not.toContain('<script>');
    expect(result).toMatchObject({ sentCount: 1, failedCount: 0, skippedCount: 0 });
    expect(m.recipients).toHaveBeenCalledWith(1, 10000, 0);
  });
  it('never sends a cached address after opt-out or consent revision changes', async () => {
    m.lockedRecipient.mockResolvedValue({ eligible: false });
    expect(await sendArtistUpdate(1, 'Subject', 'Body')).toMatchObject({ sentCount: 0, skippedCount: 1, failedCount: 0 });
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('uses the rechecked current recipient rather than the stale list snapshot', async () => {
    m.lockedRecipient.mockImplementation(async (_c, _f, _r, work) => ({ eligible: true, value: await work({ ...fan, email: 'current@example.test' }, unsubscribeUrl) }));
    await sendArtistUpdate(1, 'Subject', 'Body');
    expect(m.sendEmail.mock.calls[0][0].to).toBe('current@example.test');
  });
  it('fails closed on consent/source outage without an unrestricted fallback', async () => {
    m.lockedRecipient.mockRejectedValue(new Error('source unavailable'));
    expect(await sendArtistUpdate(1, 'Subject', 'Body')).toMatchObject({ sentCount: 0, failedCount: 1 });
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('does not consume a send reservation when no fans explicitly opted in', async () => {
    m.recipients.mockResolvedValue([]);
    await expect(sendArtistUpdate(1, 'Subject', 'Body')).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(execute).not.toHaveBeenCalled(); expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('reserves before provider invocation and rejects an already reserved daily campaign', async () => {
    execute.mockResolvedValueOnce([[{ id: 3 }], []]);
    await expect(sendArtistUpdate(1, 'Subject', 'Body')).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
  it('does not report provider rejection as accepted delivery', async () => {
    m.sendEmail.mockResolvedValue(false);
    expect(await sendArtistUpdate(1, 'Subject', 'Body')).toMatchObject({ sentCount: 0, failedCount: 1 });
    expect(set).toHaveBeenCalledWith({ status: 'failed', sentCount: 0, failedCount: 1 });
  });
  it('requires actual creator ownership and paid feature access before reading recipients', async () => {
    m.hasAccess.mockResolvedValue(false);
    await expect(sendArtistUpdate(1, 'Subject', 'Body')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(m.recipients).not.toHaveBeenCalled();
  });
  it('encodes names, subjects, body, and link attributes as text rather than email HTML', () => {
    const html = buildUpdateEmail('Fan <img>', 'Creator <script>', 11, '<svg/onload=alert(1)>', '<a href="x">Body</a>\nnext', unsubscribeUrl);
    expect(html).toContain('&lt;img&gt;'); expect(html).toContain('&lt;svg/onload=alert(1)&gt;');
    expect(html).toContain('&lt;a href=&quot;x&quot;&gt;Body&lt;/a&gt;<br>next');
    expect(html).toContain('/privacy-policy'); expect(html).not.toContain('?userId=');
  });
});

describe('Fan contact API scope and exports', () => {
  it('binds consent reads and writes to the current fan, even when that fan is an admin', async () => {
    const caller = followsRouter.createCaller(context(5, 'admin'));
    await caller.getEmailConsent({ followingId: 1 });
    await caller.setEmailConsent({ followingId: 1, optIn: true, expectedRevision: 0 });
    expect(m.getConsent).toHaveBeenCalledWith(5, 1);
    expect(m.setConsent).toHaveBeenCalledWith(5, 1, { optIn: true, expectedRevision: 0 });
  });
  it('rejects attempts to pass another fan identity or a negative revision', async () => {
    const caller = followsRouter.createCaller(context());
    await expect(caller.setEmailConsent({ followingId: 3, followerId: 7, optIn: true, expectedRevision: 0 } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.setEmailConsent({ followingId: 3, optIn: true, expectedRevision: -1 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(m.setConsent).not.toHaveBeenCalled();
  });
  it('rejects anonymous contact access before contact queries', async () => {
    await expect(followsRouter.createCaller({ ...context(), user: null }).getFanEmails({ limit: 100 })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(m.fanList).not.toHaveBeenCalled();
  });
  it('does not expose contacts to an unpaid creator', async () => {
    m.hasAccess.mockResolvedValue(false);
    expect(await followsRouter.createCaller(context()).getFanEmails({})).toMatchObject({ fans: [], eligibleCount: 0, hasAccess: false });
    expect(m.fanList).not.toHaveBeenCalled();
  });
  it('checks actual owner authorization before contact reads or exports, regardless of admin role', async () => {
    m.assertCreator.mockRejectedValue(Object.assign(new Error('Denied'), { code: 'FORBIDDEN' }));
    await expect(followsRouter.createCaller(context(5, 'admin')).exportFanEmails()).rejects.toThrow('Denied');
    expect(m.fanList).not.toHaveBeenCalled();
  });
  it('exports eligible records freshly, separately from the first dashboard page', async () => {
    m.count.mockResolvedValue(12000);
    m.fanList.mockResolvedValue([{ ...fan, name: '=HYPERLINK("bad")' }]);
    const result = await followsRouter.createCaller(context()).exportFanEmails();
    expect(m.fanList).toHaveBeenCalledWith(1, 10000, 0);
    expect(result.truncated).toBe(true); expect(result.totalCount).toBe(1);
    expect(result.csv).toContain('"\'=HYPERLINK(""bad"")"');
  });
  it('keeps total followers separate from eligible email contacts', async () => {
    const result = await followsRouter.createCaller(context()).getFanEmails({});
    expect(result).toMatchObject({ totalCount: 3, eligibleCount: 1, fans: [fan] });
  });
  it('only permits viewing the authenticated fan\'s own following list', async () => {
    await expect(followsRouter.createCaller(context()).getFollowing({ userId: 5 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(m.following).not.toHaveBeenCalled();
  });
  it('rejects oversized or invalid contact pagination', async () => {
    const caller = followsRouter.createCaller(context());
    await expect(caller.getFanEmails({ limit: 101 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.getFanEmails({ offset: -1 })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
  it('previews zero eligible recipients without enabling a broadcast', async () => {
    m.count.mockResolvedValue(0);
    expect(await artistUpdatesRouter.createCaller(context()).canSend()).toMatchObject({ canSend: false, eligibleCount: 0, hasAccess: true });
  });
  it('caps the broadcast confirmation to the actual bounded delivery size', async () => {
    m.count.mockResolvedValue(20000);
    expect(await artistUpdatesRouter.createCaller(context()).canSend()).toMatchObject({ eligibleCount: 10000, eligibleTotal: 20000, recipientLimit: 10000 });
  });
});

describe('Spreadsheet-safe export fields', () => {
  it.each(['=cmd()', '+SUM(1,2)', '-1+2', '@SUM(1)', '\t=cmd()', '\r\n@evil', '\uFEFF=evil'])('neutralizes %j', value => {
    expect(fanEmailCsvCell(value)).toBe('"\'' + value.replace(/"/g, '""') + '"');
  });
  it('quotes commas, quotes, and embedded newlines without dropping records', () => {
    expect(fanEmailCsvCell('A, "B"\nC')).toBe('"A, ""B""\nC"');
    expect(fanEmailCsvCell('safe@example.test')).toBe('"safe@example.test"');
  });
});
