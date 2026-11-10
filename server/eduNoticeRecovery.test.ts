import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const mocks = vi.hoisted(() => ({ getDb: vi.fn(), pool: {}, resolve: vi.fn(), notices: { data: { notices: [] as any[], hasMore: false }, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() } }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: () => mocks.pool }));
vi.mock('./services/eduBillingService', async original => ({ ...(await original<any>()), resolveEduNoticeDelivery: mocks.resolve }));
vi.mock('@/lib/trpc', () => ({ trpc: { edu: { billingNotices: { list: { useQuery: () => mocks.notices }, resolve: { useMutation: () => ({ isPending: false }) } } } } }));
import { eduBillingNoticesRouter } from './routers/eduBillingNotices';
import { EduBillingBlocked } from './services/eduBillingService';
import EduNoticeRecoveryPanel from '../client/src/components/EduNoticeRecoveryPanel';
const context = (role = 'admin') => ({ user: { id: 42, openId: 'unit-notice-reviewer', email: 'reviewer@example.test', role }, req: { headers: {} }, res: {} }) as any;
const input = { noticeKey: 'edu:2:3:renewal_notice:fixture', decision: 'accepted' as const, providerEvidence: 'Provider activity confirms acceptance, message fixture.', acceptedAt: '2026-11-01T12:00:00Z' };
beforeEach(() => { vi.clearAllMocks(); mocks.getDb.mockResolvedValue({}); mocks.resolve.mockResolvedValue({ status: 'notice_confirmed' }); mocks.notices.data = { notices: [], hasMore: false }; });
describe('EDU admin-only notice recovery', () => {
  it.each(['fan', 'artist', 'venue', 'user'])('denies %s without reading notices or recording evidence', async role => {
    await expect(eduBillingNoticesRouter.createCaller(context(role)).resolve(input)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(mocks.resolve).not.toHaveBeenCalled(); expect(mocks.getDb).not.toHaveBeenCalled();
  });
  it('rejects a client-supplied actor identity', async () => {
    await expect(eduBillingNoticesRouter.createCaller(context()).resolve({ ...input, actorUserId: 7 } as any)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.resolve).not.toHaveBeenCalled();
  });
  it('records the authorized server actor and converts the actual provider timestamp', async () => {
    expect(await eduBillingNoticesRouter.createCaller(context()).resolve(input)).toEqual({ status: 'notice_confirmed' });
    const [payload, dependencies] = mocks.resolve.mock.calls[0];
    expect(payload).toMatchObject({ actorUserId: 42, acceptedAt: new Date(input.acceptedAt), providerEvidence: input.providerEvidence });
    expect(await dependencies.authorize(42)).toBe(true); expect(await dependencies.authorize(7)).toBe(false);
  });
  it('returns conflict on an in-flight attempt instead of authorizing a resend', async () => {
    mocks.resolve.mockRejectedValue(new EduBillingBlocked('notice_attempt_still_in_flight'));
    await expect(eduBillingNoticesRouter.createCaller(context()).resolve(input)).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('masks persistence failures without claiming audit success', async () => {
    mocks.resolve.mockRejectedValue(new Error('sensitive fixture database detail'));
    await expect(eduBillingNoticesRouter.createCaller(context()).resolve(input)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'We could not save the notice audit. No retry was authorized.' });
  });
  it('limits the uncertain delivery list to 50 with an explicit next-page indicator', async () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({ noticeKey: `fixture-${i}` }));
    const offset = vi.fn(async () => rows); const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: vi.fn(() => chain), offset };
    mocks.getDb.mockResolvedValue({ select: () => chain });
    const result = await eduBillingNoticesRouter.createCaller(context()).list({ offset: 50 });
    expect(result.notices).toHaveLength(50); expect(result.hasMore).toBe(true); expect(chain.limit).toHaveBeenCalledWith(51); expect(offset).toHaveBeenCalledWith(50);
  });
  it('renders escaped notice data, no-send explanation, empty state, and refresh without submitting', () => {
    let html = renderToStaticMarkup(React.createElement(EduNoticeRecoveryPanel));
    expect(html).toContain('No uncertain notice deliveries need review.'); expect(html).toContain('Refresh notices');
    mocks.notices.data = { notices: [{ noticeKey: 'fixture', userId: '<script>', kind: '<script>', createdAt: new Date('2000-01-01') }], hasMore: false };
    html = renderToStaticMarkup(React.createElement(EduNoticeRecoveryPanel)); expect(html).not.toContain('<script>'); expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Uncertain delivery is never retried automatically.');
  });
});
