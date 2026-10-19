import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));
import { ensureReleaseOrderSchema, resetReleaseOrderSchemaForTests } from './services/releaseOrderSchemaService';
const columns = ['id','profileId','kind','orderedIds','revision','updatedAt'].map(column_name => ({ column_name }));
const indexes = [
  { index_name: 'uniq_profile_release_order_scope', column_name: 'profileId', non_unique: 0, seq_in_index: 1 },
  { index_name: 'uniq_profile_release_order_scope', column_name: 'kind', non_unique: 0, seq_in_index: 2 },
];
beforeEach(() => { vi.resetAllMocks(); resetReleaseOrderSchemaForTests(); });

function fixture(options: { absent?: boolean; createError?: string; existingButNoColumns?: boolean; incompleteAfterCreate?: boolean } = {}) {
  let present = !options.absent;
  const execute = vi.fn(async (sql: string) => {
    if (sql.includes('information_schema.columns')) return [present ? (options.incompleteAfterCreate ? columns.slice(0,2) : columns) : [], []];
    if (sql.includes('information_schema.statistics')) return [indexes, []];
    if (sql.includes('information_schema.tables')) return [present || options.existingButNoColumns ? [{ '1': 1 }] : [], []];
    if (sql.startsWith('CREATE TABLE IF NOT EXISTS')) {
      if (options.createError) { if (options.createError === 'ER_TABLE_EXISTS_ERROR') present = true; throw Object.assign(new Error('synthetic ddl failure'), { code: options.createError }); }
      present = true; return [{ affectedRows: 0 }, []];
    }
    throw new Error('Unexpected SQL');
  });
  return { execute };
}

describe('release-order runtime schema guard', () => {
  it('only inspects metadata when the actual application table is healthy', async () => {
    const executor = fixture(); await ensureReleaseOrderSchema(executor);
    expect(executor.execute).toHaveBeenCalledTimes(2);
    expect(executor.execute.mock.calls.every(([sql]) => !/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i.test(sql))).toBe(true);
  });
  it('fails without changing an existing incomplete table', async () => {
    const execute = vi.fn(async () => [[{ column_name: 'id' }, { column_name: 'profileId' }], []]);
    await expect(ensureReleaseOrderSchema({ execute })).rejects.toThrow('Release-order migration is not available');
    expect(execute).toHaveBeenCalledOnce();
  });
  it('restores only the entirely absent presentation table in the application pool and reinspects it', async () => {
    const executor = fixture({ absent: true });await ensureReleaseOrderSchema(executor);
    const sql = executor.execute.mock.calls.map(([s]) => s);
    expect(sql.filter(s => s.startsWith('CREATE'))).toHaveLength(1);
    const ddl = sql.find(s => s.startsWith('CREATE'))!;
    const migration = readFileSync(new URL('../drizzle/0118_glorious_omega_sentinel.sql', import.meta.url), 'utf8');
    for (const definition of ['`profileId` int NOT NULL',"`kind` enum('music','content_singles') NOT NULL",'`orderedIds` json','`revision` int NOT NULL DEFAULT 0','`updatedAt` bigint NOT NULL']) {expect(ddl).toContain(definition);expect(migration).toContain(definition);}
    expect(ddl).toContain('UNIQUE KEY `uniq_profile_release_order_scope` (`profileId`,`kind`)');
    expect(sql.filter(s => s.includes('information_schema.columns'))).toHaveLength(2);
    expect(sql.every(s => !/\b(?:ALTER|DROP|INSERT|UPDATE|DELETE)\b/i.test(s))).toBe(true);
    await ensureReleaseOrderSchema(executor);expect(executor.execute.mock.calls.filter(([s]) => s.startsWith('CREATE'))).toHaveLength(1);
  });
  it('shares a single cached repair across concurrent callers on the real pool abstraction', async () => {
    const executor = fixture({ absent: true }); mocks.getDb.mockResolvedValue({});mocks.getPool.mockReturnValue(executor);
    await Promise.all([ensureReleaseOrderSchema(),ensureReleaseOrderSchema(),ensureReleaseOrderSchema()]);
    expect(executor.execute.mock.calls.filter(([s]) => s.startsWith('CREATE'))).toHaveLength(1);
  });
  it('accepts a concurrently completed creation only after checking the declarations again', async () => {
    const executor = fixture({ absent: true, createError: 'ER_TABLE_EXISTS_ERROR' }); await expect(ensureReleaseOrderSchema(executor)).resolves.toBeUndefined();
    expect(executor.execute.mock.calls.at(-1)?.[0]).toContain('information_schema.statistics');
  });
  it('propagates permission failure and permits a later retry rather than fabricating readiness', async () => {
    const denied = fixture({ absent: true, createError: 'ER_TABLEACCESS_DENIED_ERROR' }); mocks.getDb.mockResolvedValue({});mocks.getPool.mockReturnValue(denied);
    await expect(ensureReleaseOrderSchema()).rejects.toMatchObject({ code: 'ER_TABLEACCESS_DENIED_ERROR' });
    const healthy=fixture();mocks.getPool.mockReturnValue(healthy);await expect(ensureReleaseOrderSchema()).resolves.toBeUndefined();
  });
  it('does not create when table metadata says an existing table has unreadable columns', async () => {
    const executor=fixture({ absent:true,existingButNoColumns:true });await expect(ensureReleaseOrderSchema(executor)).rejects.toThrow('Release-order migration is not available');
    expect(executor.execute.mock.calls.some(([s])=>s.startsWith('CREATE'))).toBe(false);
  });
  it('rejects incomplete declarations after creation without broadening the repair', async () => {
    const executor=fixture({ absent:true,incompleteAfterCreate:true });await expect(ensureReleaseOrderSchema(executor)).rejects.toThrow('Release-order migration is not available');
    expect(executor.execute.mock.calls.some(([s])=>/\b(?:ALTER|DROP)\b/.test(s))).toBe(false);
  });
  it('accepts actual mysql2/TiDB uppercase metadata keys', async () => {
    const execute=vi.fn(async (sql:string)=>sql.includes('information_schema.statistics') ? [indexes.map(x=>({INDEX_NAME:x.index_name,COLUMN_NAME:x.column_name,NON_UNIQUE:String(x.non_unique),SEQ_IN_INDEX:String(x.seq_in_index)})),[]] : [columns.map(x=>({COLUMN_NAME:x.column_name})),[]]);
    await expect(ensureReleaseOrderSchema({execute})).resolves.toBeUndefined();
  });
});
