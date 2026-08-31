import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  BOOK_FORMAT_VALUES,
  DEFAULT_EBOOK_DOWNLOAD_LIMIT,
  EBOOK_FILE_FORMAT_VALUES,
  MAX_EBOOK_SIZE_BYTES,
  isEbook,
  isPhysicalBook,
  normalizeIsbn,
} from '../shared/bookCommerce';
import { AUTHOR_GENRES, TALENT_TYPE_OPTIONS, getTalentTypeLabel } from '../shared/talentTypes';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Author / Writer profile type', () => {
  it('defines the public identity and curated writing genres centrally', () => {
    expect(TALENT_TYPE_OPTIONS).toContainEqual(expect.objectContaining({
      value: 'author_writer',
      label: 'Author / Writer',
      description: 'Books, Poetry & Publishing',
    }));
    expect(getTalentTypeLabel('author_writer')).toBe('Author / Writer');
    expect(AUTHOR_GENRES).toEqual(expect.arrayContaining([
      'Fiction', 'Poetry', "Children's", 'Comics & Graphic Novels', 'Biography & Memoir', 'Essays & Journalism',
    ]));
  });

  it('supports author-specific onboarding, editing, discovery, profiles, help, and tours', () => {
    const onboarding = read('client/src/pages/ArtistOnboarding.tsx');
    const editing = read('client/src/pages/ArtistEditProfile.tsx');
    const browse = read('client/src/pages/Browse.tsx');
    const profile = read('client/src/pages/ArtistProfile.tsx');
    const filters = read('client/src/components/SearchFilters.tsx');
    const tours = read('client/src/components/OnboardingTour.tsx');
    const help = read('client/src/pages/Help.tsx');

    expect(onboarding).toContain("talentType === 'author_writer'");
    expect(onboarding).toContain('Your name or published pen name');
    expect(onboarding).toContain('Writing Genres');
    expect(editing).toContain("talentType === 'author_writer'");
    expect(browse).toContain("talentType === 'author_writer'");
    expect(filters).toContain("talentType === 'author_writer'");
    expect(profile).toContain("(artist as any).talentType === 'author_writer'");
    expect(tours).toContain('AUTHOR_WRITER_TOUR_STEPS');
    expect(help).toContain('I am an author or writer. What can I do on OlogyWood?');
  });
});

describe('Book metadata and compatibility', () => {
  it('normalizes ISBNs and distinguishes physical and digital formats', () => {
    expect(BOOK_FORMAT_VALUES).toEqual(['paperback', 'hardcover', 'ebook']);
    expect(EBOOK_FILE_FORMAT_VALUES).toEqual(['pdf', 'epub']);
    expect(normalizeIsbn('978-1-4028-9462-6')).toBe('9781402894626');
    expect(normalizeIsbn('0-306-40615-2')).toBe('0306406152');
    expect(() => normalizeIsbn('1234')).toThrow(/10 or 13/);
    expect(isPhysicalBook('paperback')).toBe(true);
    expect(isPhysicalBook('hardcover')).toBe(true);
    expect(isPhysicalBook('ebook')).toBe(false);
    expect(isEbook('ebook')).toBe(true);
    expect(MAX_EBOOK_SIZE_BYTES).toBe(25 * 1024 * 1024);
    expect(DEFAULT_EBOOK_DOWNLOAD_LIMIT).toBe(5);
  });

  it('adds book fields without replacing the existing merch and order tables', () => {
    const schema = read('drizzle/schema.ts');
    const migration = read('drizzle/0107_square_trish_tilby.sql');
    const fulfillmentMigration = read('drizzle/0108_bouncy_corsair.sql');
    const accessStatusMigration = read('drizzle/0109_mysterious_war_machine.sql');

    expect(schema).toContain('productCategory: mysqlEnum("productCategory", ["merch", "book"])');
    expect(schema).toContain('bookFormat: mysqlEnum("bookFormat", ["paperback", "hardcover", "ebook"])');
    expect(schema).toContain('export const bookDownloadAccess = mysqlTable("book_download_access"');
    expect(schema).toContain('status: mysqlEnum("status", ["active", "refunded", "revoked"])');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS `productCategory`');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS `book_download_access`');
    expect(fulfillmentMigration).toContain("enum('shipping','pickup','digital')");
    expect(accessStatusMigration).toContain('ADD COLUMN IF NOT EXISTS `status`');
  });
});

describe('Secure Creator Shop book commerce', () => {
  it('keeps private eBook storage fields out of public product responses', () => {
    const merchRouter = read('server/routers/merch.ts');
    expect(merchRouter).toContain('function toPublicMerchItem');
    expect(merchRouter).toContain('ebookFileKey: _ebookFileKey');
    expect(merchRouter).toContain('ebookMimeType: _ebookMimeType');
    expect(merchRouter).toContain('ebookFileName: _ebookFileName');
    expect(merchRouter).toContain('...toPublicMerchItem(item)');
  });

  it('requires authenticated ownership and rights confirmation for private uploads', () => {
    const bookFiles = read('server/routes/bookFiles.ts');
    expect(bookFiles).toContain("sdk.authenticateRequest(req)");
    expect(bookFiles).toContain("rightsConfirmed !== 'true'");
    expect(bookFiles).toContain("Only PDF and EPUB eBook files are allowed");
    expect(bookFiles).toContain('Number(item.userId) !== user.id');
    expect(bookFiles).toContain('await storagePut(key, req.file.buffer, req.file.mimetype)');
    expect(bookFiles).not.toContain('return res.json({ success: true, fileKey:');
  });

  it('authorizes downloads by paid order, owner identity, active access, and an atomic limit', () => {
    const bookFiles = read('server/routes/bookFiles.ts');
    expect(bookFiles).toContain("access.paymentStatus !== 'paid' || access.status !== 'active'");
    expect(bookFiles).toContain('Number(access.buyerUserId) === user.id');
    expect(bookFiles).toContain("WHERE id = ? AND status = 'active' AND downloadCount < maxDownloads");
    expect(bookFiles).toContain('await storageGet(access.ebookFileKey)');
    expect(bookFiles).not.toContain('ebookFileKey: access.ebookFileKey');
  });

  it('reuses native checkout while separating digital from physical fulfillment', () => {
    const orders = read('server/routers/merchOrders.ts');
    const checkout = read('client/src/components/MerchCheckoutDialog.tsx');
    expect(orders).toContain("const digitalDelivery = item.productCategory === 'book' && isEbook(item.bookFormat)");
    expect(orders).toContain("Choose shipping or pickup for this physical item.");
    expect(orders).toContain("eBooks use secure digital delivery.");
    expect(orders).toContain("fulfillmentMethod: digitalDelivery ? 'digital' : input.fulfillmentMethod");
    expect(checkout).toContain("const isDigitalBook = item?.productCategory === 'book' && item?.bookFormat === 'ebook'");
    expect(checkout).toContain('Secure digital delivery');
  });

  it('grants paid access atomically and revokes it on refund', () => {
    const stripe = read('server/webhooks/stripe.ts');
    expect(stripe).toContain('await tx.insert(bookDownloadAccess).values');
    expect(stripe).toContain("await tx.update(bookDownloadAccess).set({ status: 'refunded' })");
    expect(stripe).toContain("fulfillmentMethod === 'digital' ? 'completed'");
    expect(stripe).toContain('if (!charge.refunded)');
    expect(stripe).toContain("ne(merchOrders.paymentStatus, 'refunded')");
    expect(stripe).toContain('inventoryQuantity: sql`COALESCE(${merchItems.inventoryQuantity}, 0) + ${orderItem.quantity}`');
  });

  it('keeps paid and refunded orders visible to creators', () => {
    const orders = read('server/routers/merchOrders.ts');
    expect(orders).toContain("inArray(merchOrders.paymentStatus, ['paid', 'refunded'])");
  });

  it('shows books as a first-class Creator Shop category and buyer download', () => {
    const manager = read('client/src/components/MerchManager.tsx');
    const item = read('client/src/pages/MerchItem.tsx');
    const display = read('client/src/components/MerchDisplay.tsx');
    const orders = read('client/src/pages/MerchOrders.tsx');
    const social = read('server/middleware/ogTags.ts');

    expect(manager).toContain('Creator Shop');
    expect(manager).toContain('Paperback, hardcover, or securely delivered eBook.');
    expect(manager).toContain('I own or control the rights needed to sell and distribute this eBook.');
    expect(item).toContain('OlogyWood processes payment and provides purchase-authorized access');
    expect(display).toContain('Books & Creator Shop');
    expect(orders).toContain('Download eBook');
    expect(social).toContain("const sellerName = seller?.name || 'OlogyWood Creator'");
    expect(social).toContain('Cover of ${item.title} by ${sellerName}');
    expect(social).not.toContain('ebookFileKey');
  });

  it('documents creator rights, non-publisher status, access, and refunds', () => {
    const terms = read('client/src/pages/TermsOfService.tsx');
    const disclaimer = read('client/src/pages/Disclaimer.tsx');
    const privacy = read('client/src/pages/PrivacyPolicy.tsx');
    expect(terms).toContain('11B. Creator Shop Books and eBooks');
    expect(terms).toContain('not the publisher, printer, distributor, literary agent');
    expect(terms).toContain('limited, non-exclusive, non-transferable license');
    expect(disclaimer).toContain('Creator Shop, Books, and eBooks');
    expect(privacy).toContain('Creator Shop and eBook Data');
    expect(privacy).toContain('Public product responses do not include private eBook storage keys');
  });
});
