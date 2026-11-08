import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(__dirname, file), 'utf8');

describe('Creator Shop security boundaries', () => {
  it('strictly bounds merch item IDs, payloads, reorder lists, and seller type ownership', () => {
    const source = read('./routers/merch.ts');
    expect(source).toContain('itemId: z.number().int().safe().positive()');
    expect(source).toContain('itemIds: z.array(z.number().int().safe().positive()).min(1).max(100)');
    expect(source).toContain('Duplicate merch item IDs are not allowed');
    expect(source).toContain('const userType = ctx.user.role === "venue" ? "venue" : "artist";');
    expect(source).toContain('eq(merchItems.userType, userType)');
    expect(source).toContain('}).strict()');
  });

  it('validates image payloads and derives storage extensions from MIME', () => {
    const source = read('./routers/merch.ts');
    expect(source).toContain('fileData: merchImageDataSchema');
    expect(source).toContain('mimeType: merchImageMimeSchema');
    expect(source).toContain('Image MIME type does not match its data');
    expect(source).toContain('const fileExtension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const)[input.mimeType];');
    expect(source).not.toContain('const fileExtension = input.fileName.split(".").pop()');
  });

  it('strictly bounds order checkout/session/fulfillment inputs', () => {
    const source = read('./routers/merchOrders.ts');
    expect(source).toContain('merchItemId: z.number().int().safe().positive()');
    expect(source).toContain("sessionId: z.string().trim().max(255).regex(/^cs_(?:test|live)_[A-Za-z0-9]+$/");
    expect(source).toContain('selectedVariantsSchema');
    expect(source).toContain('Too many selected variants');
    expect(source).toContain('orderId: z.number().int().safe().positive()');
    expect(source).toContain('}).strict())');
  });
});
