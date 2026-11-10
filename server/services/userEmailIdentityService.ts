import type { InsertUser } from '../../drizzle/schema';
import { ensureFanEmailSchema } from './fanEmailSchemaService';
import { revokeAllFanEmailConsentsForUser, withFanEmailUserLock } from './fanEmailConsentService';

type IdentityPatch = Pick<Partial<InsertUser>, 'email' | 'emailVerified' | 'oauthProvider' | 'oauthProviderId' | 'avatarUrl' | 'lastSignedIn' | 'passwordHash' | 'loginMethod' | 'name' | 'emailVerificationToken'>;
const allowed = new Set(['email', 'emailVerified', 'oauthProvider', 'oauthProviderId', 'avatarUrl', 'lastSignedIn', 'passwordHash', 'loginMethod', 'name', 'emailVerificationToken']);
const normalizedEmail = (value: unknown) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const verified = (value: unknown) => value === true || value === 1 || value === '1';
export function emailIdentityChanged(current: { email?: unknown; emailVerified?: unknown }, patch: IdentityPatch): boolean {
  return (patch.email !== undefined && normalizedEmail(patch.email) !== normalizedEmail(current.email))
    || (patch.emailVerified !== undefined && verified(patch.emailVerified) !== verified(current.emailVerified));
}

export type EmailIdentityDependencies = {
  ensureSchema(): Promise<void>;
  withUserLock<T>(id: number, work: (connection: any) => Promise<T>): Promise<T>;
  revoke(id: number, connection: any): Promise<void>;
};
/** Ordinary unchanged OAuth logins preserve existing grants and scoped consent. */
export async function updateUserEmailIdentity(userId: number, patch: IdentityPatch, deps?: EmailIdentityDependencies): Promise<void> {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error('Invalid account identity');
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
  if (!entries.length || entries.some(([key]) => !allowed.has(key))) throw new Error('Invalid email identity update');
  const dependencies = deps || { ensureSchema: ensureFanEmailSchema, withUserLock: withFanEmailUserLock, revoke: revokeAllFanEmailConsentsForUser };
  await dependencies.ensureSchema();
  await dependencies.withUserLock(userId, async connection => {
    const [rows] = await connection.execute('SELECT email,emailVerified FROM users WHERE id=? LIMIT 1 FOR UPDATE', [userId]);
    const current = rows[0];
    if (!current) throw new Error('Account identity unavailable');
    if (emailIdentityChanged(current, patch)) await dependencies.revoke(userId, connection);
    await connection.execute(`UPDATE users SET ${entries.map(([key]) => `\`${key}\`=?`).join(',')} WHERE id=?`, [...entries.map(([, value]) => value), userId]);
  });
}
