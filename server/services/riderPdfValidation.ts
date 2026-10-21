import { createHash } from 'node:crypto';
import { PDFDocument, PDFName, PDFArray, PDFRef } from 'pdf-lib';
import { RIDER_PDF_MAX_BYTES, RIDER_PDF_MAX_PAGES } from '../../shared/riderDocuments';

export class RiderPdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RiderPdfValidationError';
  }
}

const FORBIDDEN_PDF_KEYS = new Set([
  'JS', 'JavaScript', 'AA', 'OpenAction', 'Launch', 'URI', 'GoToR',
  'EmbeddedFiles', 'Filespec', 'RichMedia', 'Movie', 'Sound', 'Rendition',
  'XFA', 'AcroForm', 'Annots',
]);

function ascii(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('latin1');
}

function containsUnsafeInteractiveObjects(document: PDFDocument): boolean {
  const context = document.context;
  const queue: unknown[] = context.enumerateIndirectObjects().map(([, object]) => object);
  const seen = new Set<unknown>();
  let examined = 0;
  while (queue.length) {
    let object: any = queue.pop();
    if (object instanceof PDFRef) object = context.lookup(object);
    if (!object || typeof object !== 'object' || seen.has(object)) continue;
    seen.add(object);
    if (++examined > 100_000) throw new RiderPdfValidationError('PDF is too complex. Export a simpler plain PDF.');
    if (object instanceof PDFArray) {
      for (let i = 0; i < object.size(); i++) queue.push(object.get(i));
      continue;
    }
    const dictionary = object.dict ?? object;
    if (typeof dictionary.entries !== 'function') continue;
    for (const [name, value] of dictionary.entries()) {
      const key = typeof name.decodeText === 'function' ? name.decodeText() : String(name).replace(/^\//, '');
      if (key === 'Annots') {
        const annotations = context.lookup(value);
        if (!(annotations instanceof PDFArray) || annotations.size() !== 0) return true;
        continue;
      }
      if (FORBIDDEN_PDF_KEYS.has(key)) return true;
      queue.push(value);
    }
  }
  return false;
}

/**
 * Validates bytes rather than trusting file names or client MIME type. Interactive
 * annotations/forms are rejected rather than flattened because this service does
 * not claim anti-malware scanning or unsafe partial form preservation.
 */
export async function validateAndSanitizeRiderPdf(source: Buffer): Promise<{
  bytes: Buffer;
  byteSize: number;
  pageCount: number;
  sha256: string;
}> {
  if (!Buffer.isBuffer(source) || source.length === 0) throw new RiderPdfValidationError('A non-empty PDF is required');
  if (source.length > RIDER_PDF_MAX_BYTES) throw new RiderPdfValidationError('PDF exceeds the 10 MB limit');

  const text = ascii(source);
  const headerAt = text.indexOf('%PDF-');
  if (headerAt < 0 || headerAt > 32 || !/^%PDF-(?:1\.[0-9]|2\.0)/.test(text.slice(headerAt, headerAt + 8))) {
    throw new RiderPdfValidationError('File is not a valid PDF');
  }
  // pdf-lib can recover some damaged input. For user uploads, require an actual
  // complete EOF marker near the end instead of silently accepting truncation.
  if (text.lastIndexOf('%%EOF') < Math.max(0, text.length - 2048)) {
    throw new RiderPdfValidationError('PDF is malformed or incomplete');
  }
  // These dictionary names are active-content/attachment/form indicators. A
  // lexical gate also catches malformed PDFs where a parser cannot safely walk
  // every indirect object. Non-empty annotations are rejected rather than promised as a
  // supported flattening operation.
  if (/(?:\/JavaScript\b|\/JS\b|\/AA\b|\/OpenAction\b|\/Launch\b|\/URI\b|\/GoToR\b|\/EmbeddedFiles\b|\/Filespec\b|\/RichMedia\b|\/Movie\b|\/Sound\b|\/Rendition\b|\/XFA\b|\/AcroForm\b)/.test(text)) {
    throw new RiderPdfValidationError('Interactive, scripted, linked, or attached PDF content is not accepted');
  }

  let sourceDocument: PDFDocument;
  try {
    sourceDocument = await PDFDocument.load(source, { ignoreEncryption: false, updateMetadata: false });
  } catch {
    // Encrypted, malformed, and unsupported PDFs all fail closed; no parser
    // exception is exposed to callers or logs.
    throw new RiderPdfValidationError('PDF is encrypted, malformed, or unsupported');
  }
  if ((sourceDocument as any).isEncrypted === true) {
    throw new RiderPdfValidationError('Encrypted PDFs are not accepted');
  }
  let pageCount: number;
  try {
    pageCount = sourceDocument.getPageCount();
  } catch {
    throw new RiderPdfValidationError('PDF is encrypted, malformed, or unsupported');
  }
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new RiderPdfValidationError('PDF must contain at least one page');
  if (pageCount > RIDER_PDF_MAX_PAGES) throw new RiderPdfValidationError('PDF exceeds the 100-page limit');
  try {
    if (containsUnsafeInteractiveObjects(sourceDocument)) {
      throw new RiderPdfValidationError('Interactive, scripted, linked, or attached PDF content is not accepted');
    }
  } catch (error) {
    if (error instanceof RiderPdfValidationError) throw error;
    throw new RiderPdfValidationError('PDF parser could not safely inspect document objects');
  }

  // Rebuilding only page content removes source catalog metadata and unused
  // objects without rasterizing or otherwise changing the page visual content.
  let sanitized: Uint8Array;
  try {
    const clean = await PDFDocument.create();
    const pages = await clean.copyPages(sourceDocument, sourceDocument.getPageIndices());
    for (const page of pages) clean.addPage(page);
    clean.setTitle('');
    clean.setAuthor('');
    clean.setSubject('');
    clean.setKeywords([]);
    clean.setCreator('');
    clean.setProducer('');
    sanitized = await clean.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  } catch {
    throw new RiderPdfValidationError('PDF could not be safely prepared');
  }
  const bytes = Buffer.from(sanitized);
  if (bytes.length === 0 || bytes.length > RIDER_PDF_MAX_BYTES) {
    throw new RiderPdfValidationError('Prepared PDF exceeds the 10 MB limit');
  }
  return {
    bytes,
    byteSize: bytes.length,
    pageCount,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
