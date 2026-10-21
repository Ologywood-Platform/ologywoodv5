import { beforeEach, describe, expect, it, vi } from "vitest";

const access = vi.hoisted(() => ({ assertRiderDocumentAccess: vi.fn() }));
vi.mock("./services/riderDocumentAccessService", () => access);

import {
  attachRiderDocumentToBooking,
  authorizeBookingRiderDocumentDownload,
  captureDefaultRiderDocumentForBooking,
  getBookingRiderDocumentContext,
  persistDefaultRiderDocumentForBooking,
} from "./services/bookingRiderDocumentService";

type State = {
  booking?: any; teamPermission?: unknown; planAllowed?: boolean; document?: any; frozen?: boolean;
  links: any[]; failDuplicate?: boolean; defaultDocument?: any; archivedAfterCapture?: boolean;
};
function connection(state: State) {
  const calls: string[] = [];
  const conn: any = {
    calls,
    beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(),
    execute: vi.fn(async (statement: string, values: any[] = []) => {
      calls.push(statement);
      const b = state.booking;
      if (statement.includes("SELECT id FROM users WHERE id IN")) return [[], {}];
      if (statement.includes("FROM artist_profiles WHERE userId") && statement.includes("artistName")) return [[{ id: 7, userId: b?.ownerUserId ?? 10, artistName: "Talent" }], {}];
      if (statement.includes("SELECT id, openId, email")) return [[{ id: b?.ownerUserId ?? 10, emailVerified: false }], {}];
      if (statement.includes("user_subscriptions") || statement.includes("complimentary_access_grants")) return [[], {}];
      if (statement.includes("d.isDefault = TRUE")) return [state.defaultDocument ? [state.defaultDocument] : [], {}];
      if (statement.includes("FROM bookings b") && statement.includes("venueUserId")) return [b ? [b] : [], {}];
      if (statement.includes("FROM artist_team_members")) return [[{ permissions: state.teamPermission ?? {} }], {}];
      if (statement.includes("FROM bookings b") && statement.includes("ownerUserId") && statement.includes("FOR UPDATE")) return [b ? [{ id: b.id, ownerUserId: b.ownerUserId }] : [], {}];
      if (statement.includes("FROM bookings b") && statement.includes("ownerUserId") && statement.includes("artist_profiles ap")) return [b ? [{ ownerUserId: b.ownerUserId }] : [], {}];
      if (statement.includes("FROM rider_documents d") && statement.includes("versionDocumentId")) return [state.document ? [state.document] : [], {}];
      if (statement.includes("SELECT d.id, d.ownerUserId") && statement.includes("FROM rider_documents d")) return [state.document ? [{ id: state.document.id, ownerUserId: state.document.ownerUserId }] : [], {}];
      if (statement.includes("SELECT id, documentId FROM rider_document_versions")) return [state.frozen === false ? [] : [{ id: values[0], documentId: values[1] }], {}];
      if (statement.includes("SELECT l.id, l.documentId") && statement.includes("l.versionId")) {
        const link = state.links.find((x) => x.bookingId === values[0] && x.versionId === values[1]);
        return [link ? [link] : [], {}];
      }
      if (statement.includes("INSERT INTO booking_rider_document_links")) {
        if (state.failDuplicate) { const e: any = new Error("duplicate"); e.code = "ER_DUP_ENTRY"; throw e; }
        state.links.push({ id: state.links.length + 1, bookingId: values[0], documentId: values[1], versionId: values[2], title: values[3], attachedAt: new Date(), fileName: "locked.pdf", byteSize: 2, pageCount: 1, versionNumber: 1 });
        return [{ insertId: state.links.length }, {}];
      }
      if (statement.includes("SELECT userId FROM artist_profiles")) return [[{ userId: 10 }], {}];
      if (statement.includes("SELECT v.storageKey")) {
        const link = state.links.find((x) => x.bookingId === values[0] && x.versionId === values[1]);
        return [link ? [{ storageKey: "private/key", fileName: link.fileName, byteSize: link.byteSize, pageCount: link.pageCount, title: link.title }] : [], {}];
      }
      return [[], {}];
    }),
  };
  return conn;
}
function fixture(overrides: Partial<State> = {}) {
  return {
    booking: { id: 99, artistId: 7, venueId: 31, bookingSource: "marketplace", ownerUserId: 10, venueUserId: 20 },
    teamPermission: {}, planAllowed: true,
    document: { id: 50, ownerUserId: 10, title: "Tech rider", currentVersionId: 501, versionId: 501, revision: 3, archivedAt: null, fileName: "locked.pdf", byteSize: 2, pageCount: 1, versionNumber: 1 },
    frozen: true, links: [], ...overrides,
  } as State;
}

beforeEach(() => {
  access.assertRiderDocumentAccess.mockImplementation(async (_c: any, actorId: number, owner: number) => {
    if (actorId !== owner && actorId !== 11) throw Object.assign(new Error("manager denied"), { code: "FORBIDDEN" });
    return { canManage: true, planAllowed: true };
  });
});

describe("booking rider-document service (all persistence mocked)", () => {
  it("allows only the booking talent owner or exact manageRiders manager to attach; venue cannot attach", async () => {
    const state = fixture();
    await expect(attachRiderDocumentToBooking(connection(state), 10, { bookingId: 99, documentId: 50, expectedRevision: 3 })).resolves.toMatchObject({ versionId: 501 });
    await expect(attachRiderDocumentToBooking(connection(fixture()), 20, { bookingId: 99, documentId: 50, expectedRevision: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const manager = fixture({ teamPermission: { manageRiders: true } });
    await expect(attachRiderDocumentToBooking(connection(manager), 11, { bookingId: 99, documentId: 50, expectedRevision: 3 })).resolves.toMatchObject({ documentId: 50 });
  });

  it("fails closed after manager revocation and rejects stale document revisions", async () => {
    const revoked = fixture({ teamPermission: { manageRiders: false } });
    await expect(attachRiderDocumentToBooking(connection(revoked), 11, { bookingId: 99, documentId: 50, expectedRevision: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(attachRiderDocumentToBooking(connection(fixture()), 10, { bookingId: 99, documentId: 50, expectedRevision: 2 })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("keeps old version links immutable and treats duplicate attach races as idempotent", async () => {
    const state = fixture({ links: [{ id: 1, bookingId: 99, documentId: 50, versionId: 501, title: "Old title", attachedAt: new Date(), fileName: "locked.pdf", byteSize: 2, pageCount: 1, versionNumber: 1 }] });
    const result = await attachRiderDocumentToBooking(connection(state), 10, { bookingId: 99, documentId: 50, expectedRevision: 3 });
    expect(result.title).toBe("Old title");
    expect(state.links).toHaveLength(1);
    // A replacement makes a new current version; it never mutates the retained old link.
    state.document.versionId = 502; state.document.currentVersionId = 502; state.document.versionNumber = 2;
    await attachRiderDocumentToBooking(connection(state), 10, { bookingId: 99, documentId: 50, expectedRevision: 3 });
    expect(state.links.map((x) => x.versionId)).toEqual([501, 502]);
  });

  it("captures a default frozen version and persists it even if the library is later archived/replaced", async () => {
    const state = fixture({ defaultDocument: { documentId: 50, versionId: 501, ownerUserId: 10, title: "Default tech" } });
    const conn = connection(state);
    const snapshot = await captureDefaultRiderDocumentForBooking(conn, 7);
    expect(snapshot).toEqual({ documentId: 50, versionId: 501, ownerUserId: 10, title: "Default tech" });
    state.document.archivedAt = new Date(); state.document.currentVersionId = 502;
    await persistDefaultRiderDocumentForBooking(conn, 99, snapshot, 10);
    expect(state.links[0]).toMatchObject({ versionId: 501, title: "Default tech" });
  });

  it("permits private downloads only to the actual artist, actual venue, exact manager, or client-booking venue user", async () => {
    const state = fixture({ links: [{ id: 1, bookingId: 99, documentId: 50, versionId: 501, title: "PDF", attachedAt: new Date(), fileName: "locked.pdf", byteSize: 2, pageCount: 1, versionNumber: 1 }] });
    await expect(authorizeBookingRiderDocumentDownload(connection(state), 20, 99, 501)).resolves.toMatchObject({ storageKey: "private/key" });
    await expect(authorizeBookingRiderDocumentDownload(connection(state), 44, 99, 501)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const client = fixture({ booking: { id: 99, artistId: 7, venueId: 77, bookingSource: "client", ownerUserId: 10, venueUserId: null }, links: state.links });
    await expect(authorizeBookingRiderDocumentDownload(connection(client), 77, 99, 501)).resolves.toMatchObject({ fileName: "locked.pdf" });
  });
});
