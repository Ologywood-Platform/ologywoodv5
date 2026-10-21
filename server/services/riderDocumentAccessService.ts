import { TRPCError } from '@trpc/server';
import type { RiderDocumentContext } from '../../shared/riderDocuments';
import { getGrantStatus } from '../../shared/complimentaryAccess';
import { hasComplimentaryOwnerAccess } from './ownerSubscriptionAccess';

export type RiderDocumentConnection = {
  execute<T = any>(sql: string, values?: readonly unknown[]): Promise<[T, unknown]>;
};

type SqlRow = Record<string, any>;

type AccessOptions = { requirePlan?: boolean };

function fail(code: 'BAD_REQUEST' | 'FORBIDDEN' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR', message: string): never {
  throw new TRPCError({ code, message });
}

function validId(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

async function rows(connection: RiderDocumentConnection, statement: string, values: readonly unknown[] = []): Promise<SqlRow[]> {
  const [result] = await connection.execute<any[]>(statement, values);
  return Array.isArray(result) ? result as SqlRow[] : [];
}

function permissionObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function billingPlanAllowed(subscription: SqlRow | undefined): boolean {
  if (!subscription) return false;
  const tier = String(subscription.tier ?? 'free');
  const status = String(subscription.status ?? '');
  // Existing Rider Builder checks historically only used a non-free tier. For
  // new document writes retain the active/trialing entitlement boundary.
  return (tier === 'starter' || tier === 'professional' || tier === 'enterprise')
    && (status === 'active' || status === 'trialing');
}

function grantPlanAllowed(grant: SqlRow | undefined): boolean {
  if (!grant || getGrantStatus({
    status: grant.status,
    expiresAt: grant.expiresAt ? new Date(grant.expiresAt) : null,
  }) !== 'active') return false;
  return grant.tier === 'starter' || grant.tier === 'professional' || grant.tier === 'enterprise';
}

/** Lock user records in ascending order when the caller already has a write transaction. */
export async function lockRiderDocumentUsers(connection: RiderDocumentConnection, userIds: Array<number | null | undefined>): Promise<void> {
  const ids = [...new Set(userIds.filter((id): id is number => validId(id as number)))].sort((a, b) => a - b);
  if (!ids.length) return;
  await connection.execute(`SELECT id FROM users WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`, ids);
}

/**
 * Resolves the library owner context through the owner's artist profile. A
 * caller is an owner only when actorId equals artist_profiles.userId; a legacy
 * profile/team role or any admin role never implies ownership. Managers must
 * have an exact persisted JSON boolean `manageRiders: true`.
 *
 * This accepts a raw mysql2 connection so booking mutations can share locks.
 * Call ensureRiderDocumentSchema outside the surrounding transaction first.
 */
export async function getRiderDocumentContext(
  connection: RiderDocumentConnection,
  actorId: number,
  requestedOwnerUserId?: number,
): Promise<RiderDocumentContext> {
  if (!validId(actorId)) fail('FORBIDDEN', 'Authentication is required');
  const ownerUserId = requestedOwnerUserId === undefined ? actorId : requestedOwnerUserId;
  if (!validId(ownerUserId)) fail('BAD_REQUEST', 'Invalid rider library owner');

  // Lock the principal records first. This is intentionally deterministic and
  // makes a concurrent team-permission revocation visible before writes commit.
  await lockRiderDocumentUsers(connection, [actorId, ownerUserId]);
  const profiles = await rows(connection,
    'SELECT id, userId, artistName FROM artist_profiles WHERE userId = ? LIMIT 1 FOR UPDATE',
    [ownerUserId],
  );
  const profile = profiles[0];
  if (!profile) fail('NOT_FOUND', 'Rider library owner was not found');

  let isOwner = actorId === ownerUserId;
  if (isOwner) {
    const nonOwnerMemberships = await rows(connection,
      'SELECT id FROM artist_team_members WHERE userId = ? AND teamRole <> ? LIMIT 1 FOR UPDATE',
      [actorId, 'owner']);
    // An invitation-created legacy artist profile is not a standalone talent library.
    if (nonOwnerMemberships.length) fail('FORBIDDEN', 'Team members must use their talent owner’s rider library');
  }
  let canManage = isOwner;
  if (!isOwner) {
    const memberships = await rows(connection,
      'SELECT permissions FROM artist_team_members WHERE artistProfileId = ? AND userId = ? LIMIT 1 FOR UPDATE',
      [Number(profile.id), actorId],
    );
    // Strict type equality prevents truthy/string/legacy permission grants.
    canManage = permissionObject(memberships[0]?.permissions).manageRiders === true;
  }

  const [ownerRows, billingRows, grantRows] = await Promise.all([
    rows(connection, 'SELECT id, openId, email, emailVerified FROM users WHERE id = ? LIMIT 1 FOR UPDATE', [ownerUserId]),
    rows(connection, 'SELECT tier, status FROM user_subscriptions WHERE userId = ? LIMIT 1 FOR UPDATE', [ownerUserId]),
    rows(connection, 'SELECT userId, tier, status, expiresAt, reason, grantedByUserId, grantedAt, revision, revokedAt, updatedAt FROM complimentary_access_grants WHERE userId = ? LIMIT 1 FOR UPDATE', [ownerUserId]),
  ]);
  const owner = ownerRows[0];
  if (!owner) fail('NOT_FOUND', 'Rider library owner was not found');

  const ownerPlan = hasComplimentaryOwnerAccess({
    id: Number(owner.id), openId: owner.openId ?? null, email: owner.email ?? null,
    emailVerified: Boolean(owner.emailVerified),
  });
  const billing = billingRows[0];
  const grant = grantRows[0];
  const planAllowed = ownerPlan || billingPlanAllowed(billing) || grantPlanAllowed(grant);
  const tier = ownerPlan ? 'enterprise' : grantPlanAllowed(grant) ? String(grant!.tier) : String(billing?.tier ?? 'free');

  return {
    ownerUserId,
    artistProfileId: Number(profile.id),
    artistName: String(profile.artistName),
    isOwner,
    canManage,
    planAllowed,
    tier,
  };
}

/**
 * Strict authorization boundary shared by library and booking code.
 * `requirePlan: false` intentionally preserves reading/archiving/clearing of
 * existing riders after downgrade; it never grants document management itself.
 */
export async function assertRiderDocumentAccess(
  connection: RiderDocumentConnection,
  actorId: number,
  ownerUserId: number,
  options: AccessOptions = {},
): Promise<RiderDocumentContext> {
  const context = await getRiderDocumentContext(connection, actorId, ownerUserId);
  if (!context.canManage) fail('FORBIDDEN', 'You are not permitted to manage this rider library');
  if (options.requirePlan === true && !context.planAllowed) {
    fail('FORBIDDEN', 'Rider documents require a Starter plan or higher');
  }
  return context;
}
