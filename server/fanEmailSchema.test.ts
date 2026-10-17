import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => ({ getDb: m.getDb, getPool: m.getPool }));
import { ensureFanEmailSchema, resetFanEmailSchemaForTests } from './services/fanEmailSchemaService';
beforeEach(() => { vi.resetAllMocks(); resetFanEmailSchemaForTests(); m.getDb.mockResolvedValue({}); });

function executor(table = true, column = true) {
  return { execute: vi.fn(async (query: string) => {
    if (query.includes('information_schema.tables')) return [table ? [{ exists: 1 }] : [], []];
    if (query.includes('information_schema.columns')) return [column ? [{ exists: 1 }] : [], []];
    return [{ affectedRows: 0 }, []];
  }) };
}
describe('Fan email additive schema guard', () => {
  it('only inspects existing declarations and caches concurrent readiness checks', async () => {
    const pool = executor(); m.getPool.mockReturnValue(pool);
    await Promise.all([ensureFanEmailSchema(), ensureFanEmailSchema()]);
    await ensureFanEmailSchema(); expect(pool.execute).toHaveBeenCalledTimes(2);
    expect(pool.execute.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
  });
  it('creates only the declared empty consent table when missing', async () => {
    const db = executor(false, true); await ensureFanEmailSchema(db);
    const statements = db.execute.mock.calls.map(([sql]) => sql);
    expect(statements.find(sql => sql.startsWith('CREATE'))).toContain('CREATE TABLE IF NOT EXISTS `fan_email_consents`');
    expect(statements.join(' ')).toContain('DEFAULT false');
    expect(statements.some(sql => /^(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER)/.test(sql))).toBe(false);
  });
  it('adds only the fanUpdates category column when it is missing', async () => {
    const db = executor(true, false); await ensureFanEmailSchema(db);
    expect(db.execute.mock.calls.map(([sql]) => sql).filter(sql => sql.startsWith('ALTER'))).toEqual(['ALTER TABLE `email_preferences` ADD COLUMN `fanUpdates` boolean NOT NULL DEFAULT true']);
    expect(db.execute.mock.calls.some(([sql]) => sql.startsWith('CREATE'))).toBe(false);
  });
  it('never treats metadata source failure as evidence that a table should be created', async () => {
    const db = { execute: vi.fn().mockRejectedValue(new Error('Unavailable')) };
    await expect(ensureFanEmailSchema(db)).rejects.toThrow('Unavailable');
    expect(db.execute.mock.calls).toHaveLength(1);
  });
  it('retries readiness after a source outage rather than caching a false ready result', async () => {
    const broken = { execute: vi.fn().mockRejectedValue(new Error('Unavailable')) }; m.getPool.mockReturnValue(broken);
    await expect(ensureFanEmailSchema()).rejects.toThrow('Unavailable');
    const ready = executor(); m.getPool.mockReturnValue(ready); await ensureFanEmailSchema(); expect(ready.execute).toHaveBeenCalledTimes(2);
  });
  it('fails when there is no DB pool without inventing readiness or accessing records', async () => {
    m.getPool.mockReturnValue(null); await expect(ensureFanEmailSchema()).rejects.toThrow('temporarily unavailable');
  });
});
