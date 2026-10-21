export const RIDER_PDF_MAX_BYTES = 10 * 1024 * 1024;
export const RIDER_PDF_MAX_PAGES = 100;
export type RiderDocumentContext = {
  ownerUserId: number;
  artistProfileId: number;
  artistName: string;
  isOwner: boolean;
  canManage: boolean;
  planAllowed: boolean;
  tier: string;
};
export type RiderDocumentSummary = {
  id: number;
  title: string;
  revision: number;
  currentVersionId: number;
  versionNumber: number;
  fileName: string;
  byteSize: number;
  pageCount: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};
export type BookingRiderDocumentSummary = {
  id: number;
  documentId: number;
  versionId: number;
  title: string;
  fileName: string;
  byteSize: number;
  pageCount: number;
  versionNumber: number;
  attachedAt: Date;
};
export function riderPdfDownloadPath(versionId: number, bookingId?: number, preview = false): string {
  const query = new URLSearchParams();
  if (bookingId !== undefined) query.set('bookingId', String(bookingId));
  if (preview) query.set('preview', '1');
  return `/api/rider-documents/${versionId}${query.size ? '?' + query.toString() : ''}`;
}
