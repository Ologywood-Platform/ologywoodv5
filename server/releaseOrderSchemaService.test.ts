import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), getPool: vi.fn() }));
vi.mock('./db', () => ({ getDb: mocks.getDb, getPool: mocks.getPool }));

import { ensureReleaseOrderSchema, resetReleaseOrderSchemaForTests } from './services/releaseOrderSchemaService';

beforeEach(() => {
  vi.resetAllMocks();
  resetReleaseOrderSchemaForTests();
});

describe('release-order metadata guard', () => {
  it('only inspects the additive table metadata and does not run DDL', async () => {
    const execute = vi.fn(async (sql: string) => sql.includes('information_schema.statistics')
      ? [[
        { index_name: 'uniq_profile_release_order_scope', column_name: 'profileId', non_unique: 0, seq_in_index: 1 },
        { index_name: 'uniq_profile_release_order_scope', column_name: 'kind', non_unique: 0, seq_in_index: 2 },
      ], []]
      : [[
        { column_name: 'id' }, { column_name: 'profileId' }, { column_name: 'kind' },
        { column_name: 'orderedIds' }, { column_name: 'revision' }, { column_name: 'updatedAt' },
      ], []]);
    await ensureReleaseOrderSchema({ execute });
    expect(execute).toHaveBeenCalledTimes(2);
    const statements = execute.mock.calls.map(([sql]) => sql as string);
    expect(statements.join(' ')).toContain('information_schema.columns');
    expect(statements.join(' ')).toContain('information_schema.statistics');
    expect(statements.every(sql => !/\b(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i.test(sql))).toBe(true);
  });

  it('fails rather than attempting a broad runtime repair when the migration metadata is incomplete', async () => {
    const execute = vi.fn(async () => [[{ column_name: 'id' }, { column_name: 'profileId' }], []]);
    await expect(ensureReleaseOrderSchema({ execute })).rejects.toThrow('Release-order migration is not available');
    expect(execute).toHaveBeenCalledOnce();
  });
});
