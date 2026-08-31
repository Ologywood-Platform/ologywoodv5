# Author / Writer Profiles and Books Creator Shop

## Product decision

OlogyWood will treat books as a **Creator Shop product type**, not as a separate bookstore or publishing business. Existing `merch_items`, Stripe Connect checkout, platform fee, order history, creator notifications, refunds, and fulfillment management remain the commerce source of truth.

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---:|
| Add every book field directly to `merch_items` | Fast initially, but leaves many nullable book-only columns on every shirt, poster, and venue offer | Low | Low |
| Keep `merch_items` as the shared product record and add a one-to-one `book_products` extension | Preserves one checkout system, isolates book metadata, and scales to more creator-product types | Low | Moderate |
| Build separate book products, carts, orders, and checkout | Clean domain separation, but duplicates payments, refunds, notifications, fulfillment, and analytics | High | High |

**Selected structure:** shared `merch_items` plus a one-to-one `book_products` extension. This is the smallest future-proof change and preserves every existing merch item.

## Author / Writer profile onboarding

Author profiles continue to use `artist_profiles`; no separate author account or duplicate profile table is required.

| User-facing field | Existing storage | Required | Author-specific wording |
|---|---|---:|---|
| Profile type | `artist_profiles.talentType` | Yes | Author / Writer |
| Public name | `artist_profiles.artistName` | Yes | Author Name / Pen Name |
| Biography | `artist_profiles.bio` | Yes | Author Bio |
| Genres | `artist_profiles.genre` | Yes | Writing Genres |
| City, state/region, country | Existing structured location columns | Yes | Based In |
| Appearance fee range | `feeRangeMin`, `feeRangeMax` | Optional | Speaking / Appearance Fee |
| Traveling party size | `touringPartySize` | Optional | Appearance Team Size |
| Profile image | `profilePhotoUrl` | Optional | Author Photo |
| Main video | Existing performance-video fields | Optional | Author Introduction / Book Trailer |
| Portfolio | Existing portfolio and media gallery | Optional | Readings, interviews, talks, and writing highlights |
| Website and social links | Existing profile fields | Optional | Author Website and Social Links |

Published books are managed through Creator Shop and displayed on the author profile. They are not entered twice during profile onboarding.

## Curated author genres

The genre list is intentionally broad enough for discovery without creating an overwhelming taxonomy:

1. Fiction
2. Literary Fiction
3. Mystery & Thriller
4. Romance
5. Science Fiction
6. Fantasy
7. Historical Fiction
8. Horror
9. Young Adult
10. Children's
11. Comics & Graphic Novels
12. Poetry
13. Drama & Plays
14. Biography & Memoir
15. History
16. Business & Entrepreneurship
17. Self-Help & Personal Development
18. Health & Wellness
19. Faith & Spirituality
20. Education
21. Art & Photography
22. Cookbooks & Food
23. Essays & Journalism
24. Politics & Social Issues
25. Travel
26. True Crime
27. Other

## Database changes

### `merch_items`

Add one backward-compatible discriminator:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `productCategory` | enum: `merchandise`, `book` | `merchandise` | Keeps existing items unchanged and enables Books filtering |

### `book_products`

One row exists only when `merch_items.productCategory = 'book'`.

| Column | Type | Notes |
|---|---|---|
| `id` | integer primary key | Internal identifier |
| `merchItemId` | integer unique, indexed | One-to-one link to the shared product |
| `bookType` | enum: `physical`, `ebook` | Determines fulfillment and access behavior |
| `format` | enum: `paperback`, `hardcover`, `board_book`, `ebook_pdf`, `ebook_epub` | Public format label |
| `isbn10` | varchar(10), nullable | Validated when present |
| `isbn13` | varchar(13), nullable | Validated when present |
| `publisherImprint` | varchar(255), nullable | Identification only; OlogyWood is not the publisher |
| `publicationDate` | date, nullable | Date-only handling |
| `edition` | varchar(100), nullable | Example: First Edition |
| `pageCount` | integer, nullable | Positive integer |
| `language` | varchar(100) | Defaults to English |
| `isSignedCopy` | boolean | Physical books only |
| `ebookFileKey` | varchar(1024), nullable | Private S3 key; never returned by public APIs |
| `ebookFileName` | varchar(255), nullable | Safe customer download filename |
| `ebookMimeType` | enum: PDF, EPUB, nullable | Server-validated file type |
| `ebookFileSizeBytes` | integer, nullable | Upload limit and audit metadata |
| `rightsConfirmed` | boolean | Required before activation |
| `rightsConfirmedAt` | timestamp, nullable | Audit record |
| `createdAt`, `updatedAt` | timestamps | Lifecycle metadata |

### `merch_orders`

Extend `fulfillmentMethod` with `digital`. Digital orders do not collect a shipping address or shipping charge. Existing physical orders continue using `shipping` or `pickup`.

### `merch_order_items`

Add immutable digital-delivery snapshots so a buyer retains the purchased edition even if the creator later updates the listing:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `productCategory` | enum: `merchandise`, `book` | `merchandise` | Historical product type |
| `bookFormat` | varchar(50), nullable | Purchased physical or digital format |
| `digitalFileKey` | varchar(1024), nullable | Private purchased file reference; never exposed publicly |
| `downloadFileName` | varchar(255), nullable | Customer-facing filename |
| `downloadCount` | integer | `0` | Tracks successful signed-link requests |
| `maxDownloads` | integer | `5` for eBooks | Simple abuse protection |
| `lastDownloadedAt` | timestamp, nullable | Audit metadata |

## Physical-book behavior

Physical books reuse native merch checkout unchanged: price, quantity, inventory, shipping, pickup, Stripe Connect payout, one-percent platform fee, order notification, tracking, refund status, and creator fulfillment. Book format and signed-copy information are displayed as product attributes.

## eBook behavior

1. The author uploads one PDF or EPUB through an authenticated server endpoint.
2. The server validates extension, MIME type, maximum size, and file signature before storing bytes in S3.
3. Public product APIs return availability and format only—never `ebookFileKey` or a storage URL.
4. eBook checkout requires an authenticated OlogyWood account so purchased access stays attached to the buyer.
5. Stripe webhook processing marks the order paid atomically; no digital file URL is placed in Stripe metadata or email.
6. The buyer opens My Orders and requests a download for the paid order item.
7. The server verifies buyer ownership, paid status, active grant, and download limit, then creates a short-lived signed URL and increments the counter.
8. Refunds revoke future downloads while preserving the order audit trail.

This approach avoids public file leakage, avoids storing file bytes in the database, and does not require a scheduled worker.

## Rights and platform role

Before publishing a book, the creator must affirm:

> I own or control the rights necessary to sell and distribute this book, including its text, cover artwork, and any third-party material.

OlogyWood provides discovery, checkout, access, order records, and creator-customer tools. The creator remains the author, rights holder or authorized seller, publisher/imprint when applicable, and physical fulfillment party. Legal language should receive attorney review before the feature is publicly launched.
