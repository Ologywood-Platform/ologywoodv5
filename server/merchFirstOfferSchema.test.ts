import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const routerSource = fs.readFileSync(
  path.resolve(__dirname, 'routers/merch.ts'),
  'utf8',
);

function procedureSource(startMarker: string, endMarker: string) {
  const start = routerSource.indexOf(startMarker);
  const end = routerSource.indexOf(endMarker, start + startMarker.length);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return routerSource.slice(start, end);
}

describe('first merch offer schema resilience', () => {
  it('counts items and computes the next sort position without selecting full merch rows', () => {
    const createSource = procedureSource(
      'create: protectedProcedure',
      'update: protectedProcedure',
    );

    expect(createSource).toContain('COUNT(*)');
    expect(createSource).toContain('COALESCE(MAX(${merchItems.sortOrder}), 0)');
    expect(createSource).toContain('currentCount');
    expect(createSource).toContain('maxSortOrder');
    expect(createSource).toContain('db.insert(merchItems)');
    expect(createSource).not.toContain('.select()');
  });

  it('computes tier limit information with a count-only query', () => {
    const limitSource = procedureSource(
      'getLimitInfo: protectedProcedure',
      'create: protectedProcedure',
    );

    expect(limitSource).toContain('COUNT(*)');
    expect(limitSource).toContain('currentCount');
    expect(limitSource).not.toContain('.select()');
  });

  it('retains a legacy-schema fallback for the creator merch manager', () => {
    const listSource = procedureSource(
      'myItems: protectedProcedure',
      'getLimitInfo: protectedProcedure',
    );

    expect(listSource).toContain('ER_BAD_FIELD_ERROR');
    expect(listSource).toContain('normalizeLegacyMerchItem');
    expect(listSource).toContain('SELECT id, userId, userType, title, description, priceDisplay');
  });

  it('repairs a partially migrated runtime schema before listing or creating merch', () => {
    const listSource = procedureSource(
      'myItems: protectedProcedure',
      'getLimitInfo: protectedProcedure',
    );
    const createSource = procedureSource(
      'create: protectedProcedure',
      'update: protectedProcedure',
    );

    expect(routerSource).toContain('import { ensureMerchItemsSchema }');
    expect(listSource).toContain('await ensureMerchItemsSchema(db)');
    expect(createSource).toContain('await ensureMerchItemsSchema(db)');
  });
});
