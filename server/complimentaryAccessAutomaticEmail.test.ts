import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import type { User } from '../drizzle/schema';
import { getGrantEmailNotice, type ComplimentaryEmailOutcome } from '../shared/complimentaryAccessEmail';

const grant = vi.fn();
const inspect = vi.fn();
const revoke = vi.fn();
const notify = vi.fn();

function makeUser(overrides: Partial<User> = {}): User {
  const timestamp = new Date('2030-01-01T00:00:00.000Z');
  return {
    id: 1,
    openId: 'automatic-email-owner',
    name: 'Verified Owner',
    email: 'owner@example.test',
    loginMethod: 'password',
    role: 'user',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationSentAt: null,
    passwordHash: null,
    oauthProvider: null,
    oauthProviderId: null,
    avatarUrl: null,
    customAvatarUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSignedIn: timestamp,
    ...overrides,
  };
}

function grantInput(overrides: Record<string, unknown> = {}) {
  return {
    userId: 42,
    tier: 'professional' as const,
    expiresAt: null as Date | null,
    reason: 'Approved by the platform owner',
    expectedRevision: 3,
    billingAcknowledged: true as const,
    ...overrides,
  };
}

function requireOwner(actor: User | null | undefined) {
  if (!actor || actor.openId !== process.env.OWNER_OPEN_ID) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the verified platform owner can manage complimentary access.',
    });
  }
}

async function createRouter() {
  vi.resetModules();
  vi.doMock('./services/complimentaryAccessService', () => ({
    grantComplimentaryAccess: grant,
    inspectComplimentaryAccess: inspect,
    revokeComplimentaryAccess: revoke,
    requireGrantOwner: requireOwner,
  }));
  vi.doMock('./services/complimentaryAccessEmailDelivery', () => ({
    notifyComplimentaryGrant: notify,
  }));
  const { complimentaryAccessRouter } = await import('./routers/complimentaryAccess');
  return complimentaryAccessRouter;
}

function context(user: User | null) {
  return { user, req: {}, res: {} } as any;
}

beforeEach(() => {
  vi.stubEnv('OWNER_OPEN_ID', 'automatic-email-owner');
  vi.stubEnv('OWNER_EMAIL', '');
  vi.stubEnv('OWNER_NAME', '');
  vi.clearAllMocks();
  grant.mockResolvedValue({ success: true });
  inspect.mockResolvedValue({ user: { id: 42 } });
  revoke.mockResolvedValue({ success: true });
  notify.mockResolvedValue({ outcome: 'provider_accepted' });
});

afterAll(() => {
  vi.doUnmock('./services/complimentaryAccessService');
  vi.doUnmock('./services/complimentaryAccessEmailDelivery');
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('complimentary access automatic grant email router behavior', () => {
  it('waits for the committed grant promise, then targets its user at expectedRevision + 1', async () => {
    let resolveGrant!: (result: { success: true }) => void;
    grant.mockImplementationOnce(() => new Promise<{ success: true }>((resolve) => {
      resolveGrant = resolve;
    }));
    const router = await createRouter();
    const owner = makeUser();
    const caller = router.createCaller(context(owner));

    const pending = caller.grant(grantInput());
    await vi.waitFor(() => expect(grant).toHaveBeenCalledTimes(1));
    expect(notify).not.toHaveBeenCalled();

    resolveGrant({ success: true });
    await expect(pending).resolves.toEqual({
      success: true,
      emailNotification: { outcome: 'provider_accepted' },
    });
    expect(grant).toHaveBeenCalledWith(owner, expect.objectContaining({
      userId: 42,
      expectedRevision: 3,
      reason: 'Approved by the platform owner',
    }));
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(owner, 42, 4);
  });

  it('does not notify when the grant fails and its transaction rolls back', async () => {
    grant.mockRejectedValueOnce(new Error('audit event write failed; transaction rolled back'));
    const router = await createRouter();
    const caller = router.createCaller(context(makeUser()));

    await expect(caller.grant(grantInput())).rejects.toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Complimentary access could not be updated or loaded. Please retry. No successful grant is assumed.',
    });
    expect(grant).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not call grant or email for anonymous or non-owner callers', async () => {
    const router = await createRouter();
    const anonymous = router.createCaller(context(null));
    const nonOwner = router.createCaller(context(makeUser({ id: 8, openId: 'not-the-owner', email: 'other@example.test' })));

    await expect(anonymous.grant(grantInput())).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(nonOwner.grant(grantInput())).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(grant).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('never emails for inspect or revoke operations', async () => {
    const router = await createRouter();
    const owner = makeUser();
    const caller = router.createCaller(context(owner));

    await expect(caller.inspect({ userId: 42 })).resolves.toEqual({ user: { id: 42 } });
    await expect(caller.revoke({
      userId: 42,
      expectedRevision: 4,
      reason: 'The business relationship has ended',
    })).resolves.toEqual({ success: true });

    expect(inspect).toHaveBeenCalledWith(owner, 42);
    expect(revoke).toHaveBeenCalledWith(owner, expect.objectContaining({
      userId: 42,
      expectedRevision: 4,
      reason: 'The business relationship has ended',
    }));
    expect(notify).not.toHaveBeenCalled();
  });

  it('keeps the successful grant when notification throws and reports the error outcome to the client', async () => {
    notify.mockRejectedValueOnce(new Error('provider unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const router = await createRouter();
    const owner = makeUser();

    await expect(router.createCaller(context(owner)).grant(grantInput())).resolves.toEqual({
      success: true,
      emailNotification: { outcome: 'error' },
    });
    expect(notify).toHaveBeenCalledWith(owner, 42, 4);
    expect(getGrantEmailNotice('error')).toBe(
      'Email confirmation could not be verified. Access remains granted; review delivery logs before resending.',
    );
    errorSpy.mockRestore();
  });

  it.each([
    ['provider_accepted', 'Confirmation email sent to the email provider; inbox delivery is not yet confirmed.'],
    ['skipped_opt_out', 'Confirmation email skipped because this user opted out of emails.'],
    ['provider_unconfirmed', 'Email acceptance could not be confirmed. Access remains granted; review delivery logs before resending.'],
    ['not_configured', 'Email is not configured. Access remains granted; no confirmation email was sent.'],
  ] as const)('passes the %s notification outcome and its UI notice through unchanged', async (outcome, notice) => {
    notify.mockResolvedValueOnce({ outcome });
    const router = await createRouter();

    await expect(router.createCaller(context(makeUser())).grant(grantInput())).resolves.toEqual({
      success: true,
      emailNotification: { outcome },
    });
    expect(getGrantEmailNotice(outcome as ComplimentaryEmailOutcome)).toBe(notice);
  });
});
