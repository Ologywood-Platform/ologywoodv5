import { TRPCError } from "@trpc/server";
import type { BookingRiderDocumentSummary, RiderDocumentSummary } from "../../shared/riderDocuments";
import { assertRiderDocumentAccess } from "./riderDocumentAccessService";

/**
 * This service intentionally uses the caller's raw MySQL connection.  Booking creation
 * and attachment must serialize the booking, profile, team membership and document rows
 * in one transaction; using db.ts helpers here would quietly create a second connection.
 */
export type RiderDocumentConnection = {
  execute<T = any>(sql: string, values?: unknown[]): Promise<[T, unknown]>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release?: () => void;
};

type SqlRow = Record<string, any>;
export type BookingRiderDocumentContext = {
  canAttach: boolean;
  ownerUserId: number;
  canRead: boolean;
};
export type RiderDocumentDownloadAuthorization = {
  storageKey: string;
  fileName: string;
  byteSize: number;
  pageCount: number;
  title: string;
};
export type DefaultRiderDocumentSnapshot = {
  documentId: number;
  versionId: number;
  ownerUserId: number;
  title: string;
} | null;

function trpc(code: "BAD_REQUEST" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_SERVER_ERROR", message: string): never {
  throw new TRPCError({ code, message });
}

async function rows(connection: RiderDocumentConnection, statement: string, values: unknown[] = []): Promise<SqlRow[]> {
  const [result] = await connection.execute<any[]>(statement, values);
  return Array.isArray(result) ? result as SqlRow[] : [];
}

function permissionValue(value: unknown): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    // A corrupt permission payload must fail closed rather than becoming a grant.
    return {};
  }
}

function summary(row: SqlRow): BookingRiderDocumentSummary {
  return {
    id: Number(row.id),
    documentId: Number(row.documentId),
    versionId: Number(row.versionId),
    title: String(row.title),
    fileName: String(row.fileName),
    byteSize: Number(row.byteSize),
    pageCount: Number(row.pageCount),
    versionNumber: Number(row.versionNumber),
    attachedAt: new Date(row.attachedAt),
  };
}

function documentSummary(row: SqlRow): RiderDocumentSummary {
  return {
    id: Number(row.id),
    title: String(row.title),
    revision: Number(row.revision),
    currentVersionId: Number(row.currentVersionId),
    versionNumber: Number(row.versionNumber),
    fileName: String(row.fileName),
    byteSize: Number(row.byteSize),
    pageCount: Number(row.pageCount),
    isDefault: Boolean(row.isDefault),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/** Lock the two user records in deterministic order to avoid owner/manager deadlocks. */
export async function lockRiderDocumentUsers(connection: RiderDocumentConnection, userIds: Array<number | null | undefined>) {
  const ids = [...new Set(userIds.filter((id): id is number => Number.isInteger(id) && (id as number) > 0))].sort((a, b) => a - b);
  if (!ids.length) return;
  await connection.execute(`SELECT id FROM users WHERE id IN (${ids.map(() => "?").join(",")}) ORDER BY id FOR UPDATE`, ids);
}

async function bookingBoundary(connection: RiderDocumentConnection, actorId: number, bookingId: number, lock = false) {
  const suffix = lock ? " FOR UPDATE" : "";
  const bookingRows = await rows(connection,
    `SELECT b.id, b.artistId, b.venueId, b.bookingSource, ap.userId AS ownerUserId, vp.userId AS venueUserId
       FROM bookings b
       INNER JOIN artist_profiles ap ON ap.id = b.artistId
       LEFT JOIN venue_profiles vp ON vp.id = b.venueId AND COALESCE(b.bookingSource, '') NOT IN ('client_booking', 'client')
      WHERE b.id = ? LIMIT 1${suffix}`,
    [bookingId]);
  const booking = bookingRows[0];
  if (!booking) trpc("NOT_FOUND", "Booking not found");

  const ownerUserId = Number(booking.ownerUserId);
  const artistOwner = ownerUserId === actorId;
  // Client-created bookings intentionally retain a venue *user* ID in venueId;
  // ordinary bookings retain a venue-profile ID. Do not cross these boundaries.
  const clientBooking = booking.bookingSource === "client_booking" || booking.bookingSource === "client";
  const venueOwner = clientBooking
    ? Number(booking.venueId) === actorId
    : Number(booking.venueUserId) === actorId;
  let manager = false;
  if (!artistOwner && !venueOwner) {
    const members = await rows(connection,
      `SELECT permissions FROM artist_team_members
        WHERE artistProfileId = ? AND userId = ? LIMIT 1${lock ? " FOR UPDATE" : ""}`,
      [booking.artistId, actorId]);
    manager = permissionValue(members[0]?.permissions).manageRiders === true;
  }
  return { booking, ownerUserId, artistOwner, venueOwner, manager, canRead: artistOwner || venueOwner || manager };
}

/** Discover without row locks, then lock the entire participant tuple once in sorted user order. */
async function lockedBookingBoundary(connection: RiderDocumentConnection, actorId: number, bookingId: number) {
  const initial = await bookingBoundary(connection, actorId, bookingId);
  const otherUserId = ['client_booking', 'client'].includes(initial.booking.bookingSource)
    ? Number(initial.booking.venueId) : Number(initial.booking.venueUserId);
  await lockRiderDocumentUsers(connection, [actorId, initial.ownerUserId, otherUserId]);
  const current = await bookingBoundary(connection, actorId, bookingId, true);
  if (current.ownerUserId !== initial.ownerUserId || current.booking.artistId !== initial.booking.artistId
      || current.booking.venueId !== initial.booking.venueId || current.booking.bookingSource !== initial.booking.bookingSource
      || current.booking.venueUserId !== initial.booking.venueUserId) {
    trpc('CONFLICT', 'Booking access changed. Refresh and retry.');
  }
  return current;
}

/** Context intentionally exposes neither documents nor permissions for unrelated bookings. */
export async function getBookingRiderDocumentContext(
  connection: RiderDocumentConnection,
  actorId: number,
  bookingId: number,
): Promise<BookingRiderDocumentContext> {
  const boundary = await lockedBookingBoundary(connection, actorId, bookingId);
  if (!boundary.canRead) trpc("FORBIDDEN", "You are not allowed to view rider documents for this booking");
  // Plan checks apply only to creating/attaching documents; retained booking links stay readable after downgrade.
  let canAttach = false;
  if (boundary.artistOwner || boundary.manager) {
    try {
      const access = await assertRiderDocumentAccess(connection as any, actorId, boundary.ownerUserId, { requirePlan: true });
      canAttach = Boolean((access as any)?.canManage ?? true);
    } catch (error) {
      if (error instanceof TRPCError && error.code === "FORBIDDEN") canAttach = false;
      else throw error;
    }
  }
  return { ownerUserId: boundary.ownerUserId, canAttach, canRead: true };
}

export async function listBookingRiderDocuments(
  connection: RiderDocumentConnection,
  actorId: number,
  bookingId: number,
): Promise<BookingRiderDocumentSummary[]> {
  const boundary = await lockedBookingBoundary(connection, actorId, bookingId);
  if (!boundary.canRead) trpc("FORBIDDEN", "You are not allowed to view rider documents for this booking");
  const linked = await rows(connection,
    `SELECT l.id, l.bookingId, l.documentId, l.versionId, l.titleSnapshot AS title,
            l.attachedAt, v.fileName, v.byteSize, v.pageCount, v.versionNumber
       FROM booking_rider_document_links l
       INNER JOIN rider_document_versions v ON v.id = l.versionId AND v.documentId = l.documentId
      WHERE l.bookingId = ?
      ORDER BY l.attachedAt ASC, l.id ASC`,
    [bookingId]);
  return linked.map(summary);
}

async function lockedCurrentDocument(connection: RiderDocumentConnection, documentId: number, ownerUserId: number) {
  const result = await rows(connection,
    `SELECT d.id, d.ownerUserId, d.title, d.currentVersionId, d.revision, d.archivedAt,
            v.id AS versionId, v.documentId AS versionDocumentId, v.fileName, v.byteSize, v.pageCount, v.versionNumber
       FROM rider_documents d
       INNER JOIN rider_document_versions v ON v.id = d.currentVersionId AND v.documentId = d.id
      WHERE d.id = ? AND d.ownerUserId = ? LIMIT 1 FOR UPDATE`,
    [documentId, ownerUserId]);
  return result[0];
}

async function linkedSummary(connection: RiderDocumentConnection, bookingId: number, versionId: number) {
  const result = await rows(connection,
    `SELECT l.id, l.documentId, l.versionId, l.titleSnapshot AS title, l.attachedAt,
            v.fileName, v.byteSize, v.pageCount, v.versionNumber
       FROM booking_rider_document_links l
       INNER JOIN rider_document_versions v ON v.id = l.versionId AND v.documentId = l.documentId
      WHERE l.bookingId = ? AND l.versionId = ? LIMIT 1`,
    [bookingId, versionId]);
  return result[0] ? summary(result[0]) : null;
}

/**
 * Attach the current immutable version only.  A library replacement changes the document's
 * currentVersionId, never existing booking links.  Duplicate requests are idempotent.
 */
export async function attachRiderDocumentToBooking(
  connection: RiderDocumentConnection,
  actorId: number,
  input: { bookingId: number; documentId: number; expectedRevision: number },
): Promise<BookingRiderDocumentSummary> {
  await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
  await connection.beginTransaction();
  try {
    const boundary = await lockedBookingBoundary(connection, actorId, input.bookingId);
    if (!boundary.artistOwner && !boundary.manager) trpc("FORBIDDEN", "Only the talent owner or an authorized talent manager may attach rider PDFs");
    // This exact helper owns Starter-or-higher and strict manageRiders enforcement.
    await assertRiderDocumentAccess(connection as any, actorId, boundary.ownerUserId, { requirePlan: true });

    const document = await lockedCurrentDocument(connection, input.documentId, boundary.ownerUserId);
    if (!document || document.archivedAt) trpc("NOT_FOUND", "Rider document not found");
    if (Number(document.revision) !== input.expectedRevision) trpc("CONFLICT", "This rider document changed. Refresh and review the current version.");

    const existing = await linkedSummary(connection, input.bookingId, Number(document.versionId));
    if (existing) { await connection.commit(); return existing; }
    try {
      await connection.execute(
        `INSERT INTO booking_rider_document_links
          (bookingId, documentId, versionId, titleSnapshot, attachedByUserId, attachedAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [input.bookingId, document.id, document.versionId, document.title, actorId],
      );
    } catch (error: any) {
      // The unique (bookingId, versionId) constraint converts racing attach clicks into success.
      if (!(error?.code === "ER_DUP_ENTRY" || error?.errno === 1062)) throw error;
    }
    const created = await linkedSummary(connection, input.bookingId, Number(document.versionId));
    if (!created) trpc("INTERNAL_SERVER_ERROR", "Could not attach rider document");
    await connection.commit();
    return created;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

/** Call within the booking-creation transaction, before writing the booking. */
export async function captureDefaultRiderDocumentForBooking(
  connection: RiderDocumentConnection,
  artistProfileId: number,
): Promise<DefaultRiderDocumentSnapshot> {
  const profile = await rows(connection,
    `SELECT userId FROM artist_profiles WHERE id = ? LIMIT 1 FOR UPDATE`,
    [artistProfileId]);
  if (!profile[0]) trpc("NOT_FOUND", "Artist profile not found");
  // A downgrade must not break booking creation. It only suppresses a new PDF
  // default attachment; existing linked PDFs remain readable.
  try {
    await assertRiderDocumentAccess(connection as any, Number(profile[0].userId), Number(profile[0].userId), { requirePlan: true });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "FORBIDDEN") return null;
    throw error;
  }
  const result = await rows(connection,
    `SELECT d.id AS documentId, d.ownerUserId, d.title, d.currentVersionId AS versionId
       FROM artist_profiles ap
       INNER JOIN rider_documents d ON d.ownerUserId = ap.userId
       INNER JOIN rider_document_versions v ON v.id = d.currentVersionId AND v.documentId = d.id
      WHERE ap.id = ? AND d.isDefault = TRUE AND d.archivedAt IS NULL
      ORDER BY d.updatedAt DESC, d.id DESC LIMIT 1 FOR UPDATE`,
    [artistProfileId]);
  const row = result[0];
  return row ? { documentId: Number(row.documentId), versionId: Number(row.versionId), ownerUserId: Number(row.ownerUserId), title: String(row.title) } : null;
}

/**
 * Persist the frozen default selected by captureDefaultRiderDocumentForBooking. This writes
 * only the supplemental PDF link: it deliberately never touches booking.riderTemplateId,
 * riderStatus, terms, signatures, pricing, or structured rider defaults.
 */
export async function persistDefaultRiderDocumentForBooking(
  connection: RiderDocumentConnection,
  bookingId: number,
  snapshot: DefaultRiderDocumentSnapshot,
  actorId?: number,
): Promise<BookingRiderDocumentSummary | null> {
  if (!snapshot) return null;
  const booking = await rows(connection,
    `SELECT b.id, ap.userId AS ownerUserId FROM bookings b INNER JOIN artist_profiles ap ON ap.id = b.artistId WHERE b.id = ? LIMIT 1 FOR UPDATE`,
    [bookingId]);
  if (!booking[0] || Number(booking[0].ownerUserId) !== snapshot.ownerUserId) trpc("CONFLICT", "Booking access changed. Refresh and retry.");
  const document = await rows(connection,
    `SELECT d.id, d.ownerUserId
       FROM rider_documents d
      WHERE d.id = ? AND d.ownerUserId = ? LIMIT 1 FOR UPDATE`,
    [snapshot.documentId, snapshot.ownerUserId]);
  // Capture's version remains authoritative even if the library changed before the booking insert.
  const frozen = await rows(connection,
    `SELECT id, documentId FROM rider_document_versions WHERE id = ? AND documentId = ? AND ownerUserId = ? LIMIT 1 FOR UPDATE`,
    [snapshot.versionId, snapshot.documentId, snapshot.ownerUserId]);
  // Snapshot semantics deliberately ignore a later archive/default/replacement:
  // this booking was created with a specific immutable version, not a live link.
  if (!document[0] || !frozen[0]) trpc("CONFLICT", "The captured rider version is unavailable. Refresh and retry.");
  try {
    await connection.execute(
      `INSERT INTO booking_rider_document_links
        (bookingId, documentId, versionId, titleSnapshot, attachedByUserId, attachedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [bookingId, snapshot.documentId, snapshot.versionId, snapshot.title, actorId ?? snapshot.ownerUserId],
    );
  } catch (error: any) {
    if (!(error?.code === "ER_DUP_ENTRY" || error?.errno === 1062)) throw error;
  }
  const attached = await linkedSummary(connection, bookingId, snapshot.versionId);
  if (!attached) trpc("INTERNAL_SERVER_ERROR", "Could not store the default rider version");
  return attached;
}

/**
 * Authorization hook for the encrypted rider-PDF route.  It validates both the immutable
 * booking link and the live booking participant boundary.  No plan check: historic links
 * remain available after a creator downgrades or archives/replaces their library document.
 */
export async function authorizeBookingRiderDocumentDownload(
  connection: RiderDocumentConnection,
  actorId: number,
  bookingId: number,
  versionId: number,
): Promise<RiderDocumentDownloadAuthorization> {
  const boundary = await lockedBookingBoundary(connection, actorId, bookingId);
  if (!boundary.canRead) trpc("FORBIDDEN", "You are not allowed to download rider documents for this booking");
  const result = await rows(connection,
    `SELECT v.storageKey, v.fileName, v.byteSize, v.pageCount, l.titleSnapshot AS title
       FROM booking_rider_document_links l
       INNER JOIN rider_document_versions v ON v.id = l.versionId AND v.documentId = l.documentId
      WHERE l.bookingId = ? AND l.versionId = ? LIMIT 1`,
    [bookingId, versionId]);
  const row = result[0];
  if (!row) trpc("NOT_FOUND", "Rider document is not attached to this booking");
  return { storageKey: String(row.storageKey), fileName: String(row.fileName), byteSize: Number(row.byteSize), pageCount: Number(row.pageCount), title: String(row.title) };
}

/** Useful to the library router; it returns only current, non-archived documents. */
export async function listCurrentRiderDocumentsForOwner(connection: RiderDocumentConnection, ownerUserId: number): Promise<RiderDocumentSummary[]> {
  const result = await rows(connection,
    `SELECT d.id, d.title, d.revision, d.currentVersionId, d.isDefault, d.createdAt, d.updatedAt,
            v.versionNumber, v.fileName, v.byteSize, v.pageCount
       FROM rider_documents d
       INNER JOIN rider_document_versions v ON v.id = d.currentVersionId AND v.documentId = d.id
      WHERE d.ownerUserId = ? AND d.archivedAt IS NULL
      ORDER BY d.updatedAt DESC, d.id DESC`,
    [ownerUserId]);
  return result.map(documentSummary);
}
