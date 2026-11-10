import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { updateUserEmailIdentity, type EmailIdentityDependencies } from './services/userEmailIdentityService';
function fixture() {
  const state = { email: 'buyer@example.test', emailVerified: true, revision: 0 };
  let failUpdate = false;
  const execute = vi.fn(async (sql: string, values: any[]) => {
    if (sql.startsWith('SELECT')) return [[{ email: state.email, emailVerified: state.emailVerified }]];
    if (failUpdate) throw new Error('fixture update failure');
    const keys = [...sql.split(' WHERE ')[0].matchAll(/`([^`]+)`=/g)].map(match => match[1]);
    for (let i = 0; i < keys.length; i++) (state as any)[keys[i]] = values[i];
    return [{ affectedRows: 1 }];
  });
  const revoke = vi.fn(async () => { state.revision++; });
  const deps: EmailIdentityDependencies = {
    ensureSchema: vi.fn(async () => {}), revoke,
    withUserLock: async (_id, work) => {
      const old = { ...state }; try { return await work({ execute }); } catch (error) { Object.assign(state, old); throw error; }
    },
  };
  return { state, execute, revoke, deps, fail: () => { failUpdate = true; } };
}
describe('checkout snapshot email identity invalidation', () => {
  it('does not revoke ordinary unchanged verified-address logins', async () => {
    const f = fixture(); await updateUserEmailIdentity(8, { email: 'BUYER@example.test', emailVerified: true, loginMethod: 'google' }, f.deps);
    expect(f.revoke).not.toHaveBeenCalled(); expect(f.state.revision).toBe(0);
  });
  it('invalidates an old address snapshot even after A-to-B-to-A changes', async () => {
    const f = fixture(); const checkoutRevision = f.state.revision;
    await updateUserEmailIdentity(8, { email: 'changed@example.test' }, f.deps);
    await updateUserEmailIdentity(8, { email: 'buyer@example.test' }, f.deps);
    expect(f.state.revision).toBe(2); expect(f.state.revision).not.toBe(checkoutRevision);
  });
  it('invalidates an old snapshot across a verified-to-unverified-to-verified cycle', async () => {
    const f = fixture(); await updateUserEmailIdentity(8, { emailVerified: false }, f.deps);
    await updateUserEmailIdentity(8, { emailVerified: true }, f.deps);
    expect(f.state.revision).toBe(2);
  });
  it('revokes before writing identity within the same user transaction', async () => {
    const f = fixture(); await updateUserEmailIdentity(8, { email: 'changed@example.test' }, f.deps);
    expect(f.revoke.mock.invocationCallOrder[0]).toBeLessThan(f.execute.mock.invocationCallOrder[1]);
  });
  it('rolls back revision and identity if the user write fails', async () => {
    const f = fixture(); f.fail();
    await expect(updateUserEmailIdentity(8, { email: 'changed@example.test' }, f.deps)).rejects.toThrow('fixture update failure');
    expect(f.state).toMatchObject({ email: 'buyer@example.test', emailVerified: true, revision: 0 });
  });
  it('does not permit role escalation through the identity writer', async () => {
    const f = fixture(); await expect(updateUserEmailIdentity(8, { role: 'admin' } as any, f.deps)).rejects.toThrow('Invalid email identity update');
    expect(f.execute).not.toHaveBeenCalled();
  });
  it('wires global preference and token opt-outs to pending-row invalidation', () => {
    const source = readFileSync('server/db.ts', 'utf8');
    const preference = source.split('export async function updateEmailPreferences')[1].split('export async function unsubscribeAllEmailPreferencesByToken')[0];
    const token = source.split('export async function unsubscribeAllEmailPreferencesByToken')[1].split('export async function deleteEmailPreferences')[0];
    expect(preference).toContain("changes.fanUpdates === false || changes.frequency === 'never' || changes.unsubscribedAt != null");
    expect(preference).toContain('await revokeAllFanEmailConsentsForUser(userId, connection)');
    expect(token).toContain('await revokeAllFanEmailConsentsForUser(preference[0].userId, connection)');
  });
});
