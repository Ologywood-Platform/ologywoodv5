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
  'productCategory',
  'bookFormat',
  'isbn',
  'publisher',
  'publicationDate',
  'edition',
  'pageCount',
  'language',
  'isSigned',
  'ebookFileKey',
  'ebookFileName',
  'ebookFileSize',
  'ebookMimeType',
  'ebookFileFormat',
  'ebookRightsConfirmed',
  'ebookRightsConfirmedAt',
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

    expect(execute).toHaveBeenCalledTimes(1 + hybridColumns.length + 6);
  });

  it('does not run ALTER statements when the hybrid schema is already complete', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[
        column('id'),
        column('externalUrl', 'varchar(2048)', 'YES'),
        ...hybridColumns.map((name) => column(name)),
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[column('status')]])
      .mockResolvedValueOnce([[column('fulfillmentMethod', "enum('shipping','pickup','digital')", 'NO')]]);

    await ensureMerchItemsSchema({ execute });
    await ensureMerchItemsSchema({ execute });

    expect(execute).toHaveBeenCalledTimes(7);
  });

  it('makes a legacy required externalUrl column optional', async () => {
    const execute = vi.fn()
      .mockResolvedValueOnce([[
        column('id'),
        column('externalUrl', 'varchar(2048)', 'NO'),
        ...hybridColumns.map((name) => column(name)),
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[column('status')]])
      .mockResolvedValueOnce([[column('fulfillmentMethod', "enum('shipping','pickup','digital')", 'NO')]]);

    await ensureMerchItemsSchema({ execute });

    expect(execute).toHaveBeenCalledTimes(8);
  });
});
