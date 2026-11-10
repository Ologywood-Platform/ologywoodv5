import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTableName, type SQL } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { eduVerificationEvents, eduVerifications, users, type EduVerification, type User } from '../drizzle/schema';
import type { TrpcContext } from './_core/context';
import { getEffectiveEduStatus, isEduVerificationEligible } from '../shared/eduPolicy';

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb }));
vi.mock('./_core/logger', () => ({ logger: { trpcCall: vi.fn(), trpcError: vi.fn() } }));
import { eduRouter } from './routers/edu';

const NOW = new Date('2030-06-15T12:00:00Z');
const UNTIL = new Date('2030-07-01T12:00:00Z');
const GRACE = new Date('2030-07-31T12:00:00Z');
const user = { id: 7, openId: 'student-test', email: 'student@example.test', name: 'Student', role: 'user' } as User;
const caller = (actor: User | null = user) => eduRouter.createCaller({ user: actor, req: {}, res: {} } as TrpcContext);
const admin = () => caller({ ...user, id: 9, role: 'admin' });
const submission = {
  institution: 'New School', program: 'Arts', verificationMethod: 'school_code' as const,
  schoolCode: 'PRIVATE-CODE-ABCD', verificationNote: 'Current enrollment documented by school registrar.', evidenceAcknowledged: true as const,
};
const reviewInput = (expectedRevision = 3) => ({ verificationId: 11, expectedRevision, decision: 'renew' as const, note: 'Registrar enrollment proof reviewed.', manualProofConfirmed: true });

function row(overrides: Partial<EduVerification> = {}): EduVerification {
  return {
    id: 11, userId: 7, status: 'approved', revision: 3,
    verificationMethod: 'school_email', institution: 'Original School', program: null,
    schoolEmail: 'student@original.test', schoolCodeLast4: null, verificationNote: 'Original evidence', evidenceAcknowledged: true,
    verifiedUntil: UNTIL, graceUntil: GRACE, reviewedAt: NOW, reviewedByUserId: 9, rejectionReason: null,
    renewalVerificationMethod: null, renewalInstitution: null, renewalProgram: null, renewalSchoolEmail: null,
    renewalSchoolCodeLast4: null, renewalVerificationNote: null, renewalEvidenceAcknowledged: null,
    renewalSubmittedAt: null, renewalRejectionReason: null,
    checkoutSessionId: 'cs_existing', stripeCouponId: 'coupon_existing', stripeSubscriptionId: 'sub_existing',
    billingMode: 'test', billingVerificationRevision: 3, renewalNoticeSentAt: NOW, expiryNoticeSentAt: NOW,
    discountEndsAt: GRACE, billingReconcileAfter: null, createdAt: NOW, updatedAt: NOW,
    ...overrides,
  };
}

/** Serial transactions model row locks; drafts commit only after successful audit. No real DB module is loaded. */
function memoryDb(initial: EduVerification | null = row()) {
  let state = { verification: initial ? structuredClone(initial) : null, events: [] as Record<string, unknown>[] };
  let queue = Promise.resolve();
  const faults = { audit: false, updateConflict: false };
  const calls = { transactions: 0, locks: [] as string[], updates: 0 };
  const dialect = new MySqlDialect();
  const connection = (data: typeof state) => ({
    select: () => {
      let table: unknown;
      let predicate: SQL | undefined;
      const result = () => {
        const params = predicate ? dialect.sqlToQuery(predicate).params : [];
        if (table === users) return params[0] === user.id ? [{ id: user.id }] : [];
        const found = data.verification;
        if (!found) return [];
        const query = predicate ? dialect.sqlToQuery(predicate).sql : '';
        const matches = query.includes('`userId`') ? found.userId === params[0] : !params.length || found.id === params[0];
        return matches ? [structuredClone(found)] : [];
      };
      const query = {
        from: (value: unknown) => { table = value; return query; },
        where: (value: SQL) => { predicate = value; return query; },
        limit: () => query,
        for: (mode: string) => { calls.locks.push(`${getTableName(table as typeof users)}:${mode}`); return query; },
        then: (resolve: (value: unknown[]) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
      };
      return query;
    },
    update: (table: unknown) => ({ set: (values: Partial<EduVerification>) => ({ where: async (predicate: SQL) => {
      expect(table).toBe(eduVerifications);
      const params = dialect.sqlToQuery(predicate).params;
      if (faults.updateConflict || !data.verification || params[0] !== data.verification.id || params[1] !== data.verification.revision) return [{ affectedRows: 0 }];
      calls.updates++;
      data.verification = { ...data.verification, ...structuredClone(values) };
      return [{ affectedRows: 1 }];
    } }) }),
    insert: (table: unknown) => ({ values: (values: Record<string, unknown>) => {
      const apply = () => {
        if (table === eduVerificationEvents) {
          if (faults.audit) throw new Error('Mock audit storage failed');
          data.events.push(structuredClone(values));
        } else {
          expect(table).toBe(eduVerifications);
          data.verification = row(values as Partial<EduVerification>);
        }
      };
      return {
        $returningId: async () => { apply(); return [{ id: 11 }]; },
        then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve().then(apply).then(resolve, reject),
      };
    } }),
  });
  const db = {
    select: () => connection(state).select(),
    transaction: async (work: (tx: ReturnType<typeof connection>) => Promise<unknown>) => {
      calls.transactions++;
      const preceding = queue;
      let release!: () => void;
      queue = new Promise<void>(resolve => { release = resolve; });
      await preceding;
      const draft = structuredClone(state);
      try {
        const result = await work(connection(draft));
        state = draft;
        return result;
      } finally { release(); }
    },
  };
  mocks.getDb.mockResolvedValue(db);
  return { snapshot: () => structuredClone(state), faults, calls };
}

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

describe('EDU runtime renewal and transactional review', () => {
  it.each(['active', 'grace', 'expired'] as const)('preserves approved %s deadlines while staging separate renewal evidence', async effective => {
    const now = effective === 'active' ? NOW : effective === 'grace' ? new Date('2030-07-15T12:00:00Z') : new Date('2030-08-01T12:00:00Z');
    vi.setSystemTime(now);
    const db = memoryDb();
    const before = db.snapshot().verification!;
    expect(getEffectiveEduStatus(before, now)).toBe(effective);
    const result = await caller().submitVerification(submission);
    const saved = db.snapshot().verification!;
    expect(result).toEqual({ success: true, status: 'approved', renewalPending: true, revision: 4 });
    expect(saved).toMatchObject({
      status: 'approved', verifiedUntil: UNTIL, graceUntil: GRACE, institution: 'Original School',
      schoolEmail: 'student@original.test', reviewedAt: NOW, reviewedByUserId: 9,
      renewalInstitution: 'New School', renewalSchoolCodeLast4: 'ABCD', revision: 4,
      checkoutSessionId: 'cs_existing', stripeSubscriptionId: 'sub_existing', stripeCouponId: 'coupon_existing',
    });
    expect(isEduVerificationEligible(saved, now)).toBe(isEduVerificationEligible(before, now));
    expect(JSON.stringify(db.snapshot())).not.toContain(submission.schoolCode);
    expect(db.snapshot().events).toMatchObject([{ action: 'submitted', revision: 4 }]);
    expect(db.calls.locks).toEqual(['users:update', 'edu_verifications:update']);
  });

  it('requires a fresh revision and explicit renew action; an old admin cannot approve overwritten evidence', async () => {
    const db = memoryDb();
    await caller().submitVerification(submission);
    await expect(admin().adminReview(reviewInput(3))).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(db.snapshot().verification?.revision).toBe(4);
    expect(db.snapshot().events).toHaveLength(1);
    await expect(admin().adminReview({ ...reviewInput(4), decision: 'approve' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    const result = await admin().adminReview(reviewInput(4));
    expect(result.status).toBe('approved');
    const saved = db.snapshot().verification!;
    expect(saved).toMatchObject({ institution: 'New School', schoolCodeLast4: 'ABCD', schoolEmail: null, revision: 5, renewalSubmittedAt: null, billingReconcileAfter: NOW });
    expect(saved.verifiedUntil!.getTime()).toBeGreaterThan(UNTIL.getTime());
    expect(saved.stripeSubscriptionId).toBe('sub_existing');
    expect(saved.discountEndsAt).toEqual(GRACE);
    expect(db.snapshot().events[1]).toMatchObject({ action: 'approved', reviewDecision: 'renew', revision: 5, manualProofConfirmed: true });
  });

  it('rejects renewal evidence without revoking current eligibility or clearing grace', async () => {
    const db = memoryDb();
    await caller().submitVerification(submission);
    await admin().adminReview({ ...reviewInput(4), decision: 'reject', manualProofConfirmed: false });
    expect(db.snapshot().verification).toMatchObject({ status: 'approved', verifiedUntil: UNTIL, graceUntil: GRACE, institution: 'Original School', renewalSubmittedAt: null, renewalRejectionReason: reviewInput().note });
    expect(db.snapshot().events[1]).toMatchObject({ action: 'rejected', reviewDecision: 'reject' });
  });

  it('revocation immediately removes eligibility but preserves billing identity and deadline history', async () => {
    const db = memoryDb();
    await admin().adminReview({ ...reviewInput(), decision: 'revoke', manualProofConfirmed: false });
    const saved = db.snapshot().verification!;
    expect(isEduVerificationEligible(saved)).toBe(false);
    expect(getEffectiveEduStatus(saved)).toBe('revoked');
    expect(saved).toMatchObject({ verifiedUntil: UNTIL, graceUntil: GRACE, stripeSubscriptionId: 'sub_existing', billingReconcileAfter: NOW });
  });

  it.each(['approve', 'reject', 'revoke', 'renew'] as const)('rolls back all %s state changes when audit insert fails', async decision => {
    const db = memoryDb(decision === 'approve' || decision === 'reject' ? row({ status: 'pending', verifiedUntil: null, graceUntil: null }) : row());
    if (decision === 'renew') await caller().submitVerification(submission);
    const before = db.snapshot();
    db.faults.audit = true;
    await expect(admin().adminReview({ ...reviewInput(decision === 'renew' ? 4 : 3), decision })).rejects.toThrow('Mock audit storage failed');
    expect(db.snapshot()).toEqual(before);
  });

  it.each([false, true])('rolls back %s-existing submission when its audit fails', existing => {
    const db = memoryDb(existing ? row() : null);
    const before = db.snapshot();
    db.faults.audit = true;
    return expect(caller().submitVerification(submission)).rejects.toThrow('Mock audit storage failed').then(() => expect(db.snapshot()).toEqual(before));
  });

  it('allows only one of two simultaneous reviews of the same revision', async () => {
    const db = memoryDb(row({ status: 'pending', verifiedUntil: null, graceUntil: null }));
    const request = { ...reviewInput(), decision: 'approve' as const };
    const results = await Promise.allSettled([admin().adminReview(request), admin().adminReview(request)]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'CONFLICT' } });
    expect(db.snapshot().events).toHaveLength(1);
    expect(db.snapshot().verification?.revision).toBe(4);
  });

  it('serializes concurrent first submissions into one row and two distinct audit revisions', async () => {
    const db = memoryDb(null);
    await Promise.all([caller().submitVerification(submission), caller().submitVerification({ ...submission, institution: 'Another School' })]);
    expect(db.snapshot().verification).toMatchObject({ revision: 2, institution: 'Another School', status: 'pending' });
    expect(db.snapshot().events.map(event => event.revision)).toEqual([1, 2]);
  });

  it('fails closed if the conditional update affects no row; never records a fake audit success', async () => {
    const db = memoryDb(row({ status: 'pending' }));
    const before = db.snapshot();
    db.faults.updateConflict = true;
    await expect(admin().adminReview({ ...reviewInput(), decision: 'approve' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(db.snapshot()).toEqual(before);
  });

  it('redacts full school code from narrative and audit evidence', async () => {
    const db = memoryDb();
    await caller().submitVerification({ ...submission, verificationNote: `Registrar code ${submission.schoolCode} documents enrollment.` });
    expect(JSON.stringify(db.snapshot())).not.toContain(submission.schoolCode);
    expect(db.snapshot().verification?.renewalVerificationNote).toContain('[code redacted]');
  });

  it('requires acknowledgement and rejects missing school evidence before opening a transaction', async () => {
    const db = memoryDb();
    await expect(caller().submitVerification({ ...submission, evidenceAcknowledged: false } as unknown as typeof submission)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().submitVerification({ ...submission, schoolCode: undefined })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller().submitVerification({ ...submission, verificationMethod: 'school_email', schoolEmail: undefined })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.calls.transactions).toBe(0);
  });

  it('requires manual proof confirmation, expected revision, and review notes no longer than storage', async () => {
    const db = memoryDb(row({ status: 'pending' }));
    await expect(admin().adminReview({ ...reviewInput(), decision: 'approve', manualProofConfirmed: false })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(admin().adminReview({ ...reviewInput(), note: 'x'.repeat(501) })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(admin().adminReview({ ...reviewInput(), expectedRevision: undefined } as unknown as ReturnType<typeof reviewInput>)).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(db.calls.transactions).toBe(0);
  });

  it('requires new evidence before approving rejected or revoked requests, and renewal before renew', async () => {
    for (const status of ['rejected', 'revoked', 'approved'] as const) {
      const db = memoryDb(row({ status }));
      await expect(admin().adminReview({ ...reviewInput(), decision: status === 'approved' ? 'renew' : 'approve' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
      expect(db.snapshot().events).toHaveLength(0);
    }
  });

  it('exposes effective student status without any billing activation claim', async () => {
    const db = memoryDb();
    await caller().submitVerification(submission);
    const result = await caller().getStatus();
    expect(result).toMatchObject({ effectiveStatus: 'active', eligible: true, verification: { status: 'approved', revision: 4, renewalSubmittedAt: NOW } });
    expect(result.verification).not.toHaveProperty('stripeSubscriptionId');
    memoryDb(null);
    expect(await caller().getStatus()).toEqual({ verification: null, eligible: false, effectiveStatus: 'not_submitted' });
  });

  it('preserves authentication and admin authorization boundaries', async () => {
    memoryDb();
    await expect(caller(null).getStatus()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller().adminReview(reviewInput())).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('surfaces database unavailability as failure, never success', async () => {
    mocks.getDb.mockResolvedValue(null);
    await expect(caller().getStatus()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    await expect(caller().submitVerification(submission)).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});
