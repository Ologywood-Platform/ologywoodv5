import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureMerchItemsSchema,
  resetMerchSchemaCheckForTests,
} from './services/merchSchemaService';

const hybridColumns = [
  'sellingMethod',
  'priceInCents',
  'variants',
  'trackInventory',
  'inventoryQuantity',
  'shippingAvailable',
  'pickupAvailable',
  'shippingAmountCents',
  'fulfillmentTime',
];

function column(Field: string, Type = 'int', Null = 'YES') {
  return { Field, Type, Null };
}

describe('merch runtime schema repair', () => {
  beforeEach(() => resetMerchSchemaCheckForTests());

  it('adds each missing hybrid merch column without touching existing rows', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[
        column('id'),
        column('externalUrl', 'varchar(2048)', 'YES'),
      ]])
      .mockResolvedValue([[]]);

    await ensureMerchItemsSchema({ execute });

    expect(execute).toHaveBeenCalledTimes(1 + hybridColumns.length);
  });

  it('does not run ALTER statements when the hybrid schema is already complete', async () => {
    const execute = vi.fn().mockResolvedValueOnce([[
      column('id'),
      column('externalUrl', 'varchar(2048)', 'YES'),
      ...hybridColumns.map((name) => column(name)),
    ]]);

    await ensureMerchItemsSchema({ execute });
    await ensureMerchItemsSchema({ execute });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('makes a legacy required externalUrl column optional', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[
        column('id'),
        column('externalUrl', 'varchar(2048)', 'NO'),
        ...hybridColumns.map((name) => column(name)),
      ]])
      .mockResolvedValueOnce([[]]);

    await ensureMerchItemsSchema({ execute });

    expect(execute).toHaveBeenCalledTimes(2);
  });
});
