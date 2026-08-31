export const PRODUCT_CATEGORY_VALUES = ['merch', 'book'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORY_VALUES)[number];

export const BOOK_FORMAT_VALUES = ['paperback', 'hardcover', 'ebook'] as const;
export type BookFormat = (typeof BOOK_FORMAT_VALUES)[number];

export const EBOOK_FILE_FORMAT_VALUES = ['pdf', 'epub'] as const;
export type EbookFileFormat = (typeof EBOOK_FILE_FORMAT_VALUES)[number];

export const BOOK_FORMAT_OPTIONS: Array<{ value: BookFormat; label: string; description: string }> = [
  { value: 'paperback', label: 'Paperback', description: 'A physical softcover book you ship or provide for pickup.' },
  { value: 'hardcover', label: 'Hardcover', description: 'A physical hardback book you ship or provide for pickup.' },
  { value: 'ebook', label: 'eBook', description: 'A private PDF or EPUB unlocked after verified payment.' },
];

export const BOOK_LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Arabic', 'Chinese', 'Japanese', 'Korean', 'Hindi', 'Other',
] as const;

export const MAX_EBOOK_SIZE_BYTES = 25 * 1024 * 1024;
export const DEFAULT_EBOOK_DOWNLOAD_LIMIT = 5;

export function normalizeIsbn(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.toUpperCase().replace(/[^0-9X]/g, '');
  if (normalized.length !== 10 && normalized.length !== 13) {
    throw new Error('ISBN must contain 10 or 13 digits. Hyphens are optional.');
  }
  return normalized;
}

export function isPhysicalBook(format: BookFormat | null | undefined): boolean {
  return format === 'paperback' || format === 'hardcover';
}

export function isEbook(format: BookFormat | null | undefined): boolean {
  return format === 'ebook';
}
