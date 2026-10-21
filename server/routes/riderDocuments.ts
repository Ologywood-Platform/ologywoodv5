import { Router, type Request, type Response } from 'express';
import { fetchEncryptedRiderObject } from '../services/riderDocumentStorage';
import { sdk } from '../_core/sdk';
import { getPool } from '../db';
import { assertRiderDocumentAccess } from '../services/riderDocumentAccessService';
import { decryptRiderDocumentBytes } from '../services/riderDocumentService';
import { ensureRiderDocumentSchema } from '../services/riderDocumentSchemaService';

const router = Router();

function versionId(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function quotedFileName(value: string, preview: boolean): string {
  // RFC 5987 carries Unicode safely; filename fallback protects header syntax.
  const fallback = value.replace(/[\\"\r\n]/g, '_').replace(/[^\x20-\x7e]/g, '_') || 'rider.pdf';
  return `${preview ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(value)}`;
}

function privatePdfHeaders(res: Response, fileName: string, preview: boolean): void {
  res.status(200);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': quotedFileName(fileName, preview),
    'Cache-Control': 'private, no-store, no-cache, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Content-Type-Options': 'nosniff',
    // PDF has no browsing context, but this prevents a user agent that embeds
    // it as a document from granting active content a capability surface.
    'Content-Security-Policy': "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'",
    'Cross-Origin-Resource-Policy': 'same-origin',
  });
}


/**
 * GET /api/rider-documents/:versionId?bookingId=<id>
 * No storage URL is ever returned. Library access is owner/strict persisted
 * manageRiders only; booking access is delegated to the booking-link service.
 */
router.get('/:versionId', async (req: Request, res: Response) => {
  let connection: any;
  let started = false;
  try {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const id = versionId(req.params.versionId);
    if (!id) return res.status(400).json({ error: 'Invalid rider PDF' });
    const bookingId = req.query.bookingId === undefined ? undefined : versionId(req.query.bookingId);
    if (req.query.bookingId !== undefined && !bookingId) return res.status(400).json({ error: 'Invalid booking rider request' });

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: 'Rider documents are temporarily unavailable' });
    await ensureRiderDocumentSchema(pool as any);
    connection = await pool.getConnection();
    await connection.execute('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await connection.beginTransaction();
    started = true;

    let version: any;
    if (bookingId) {
      // Dynamic import prevents the intentional service-layer dependency cycle.
      const { authorizeBookingRiderDocumentDownload } = await import('../services/bookingRiderDocumentService');
      const bookingAuth = await authorizeBookingRiderDocumentDownload(connection, user.id, bookingId, id);
      const [found] = await connection.execute(
        `SELECT id, ownerUserId, storageKey, fileName, byteSize, pageCount
           FROM rider_document_versions
          WHERE id = ? AND storageKey = ? LIMIT 1 FOR UPDATE`,
        [id, bookingAuth.storageKey],
      );
      version = (found as any[])[0];
      if (!version) throw Object.assign(new Error('Rider PDF not found'), { code: 'NOT_FOUND' });
    } else {
      const [initialRows] = await connection.execute(
        'SELECT ownerUserId FROM rider_document_versions WHERE id = ? LIMIT 1', [id]);
      const initial = (initialRows as any[])[0];
      if (!initial) throw Object.assign(new Error('Rider PDF not found'), { code: 'NOT_FOUND' });
      await assertRiderDocumentAccess(connection, user.id, Number(initial.ownerUserId), { requirePlan: false });
      const [found] = await connection.execute(
        'SELECT id, ownerUserId, storageKey, fileName, byteSize, pageCount FROM rider_document_versions WHERE id = ? AND ownerUserId = ? FOR UPDATE', [id, initial.ownerUserId]);
      version = (found as any[])[0];
      if (!version) throw Object.assign(new Error('Rider PDF not found'), { code: 'NOT_FOUND' });
    }

    const encrypted = await fetchEncryptedRiderObject(String(version.storageKey));

    // Retained booking links remain readable after plan downgrade; only the
    // live participant/permission boundary is rechecked after external I/O.
    if (bookingId) {
      const { authorizeBookingRiderDocumentDownload } = await import('../services/bookingRiderDocumentService');
      await authorizeBookingRiderDocumentDownload(connection, user.id, bookingId, id);
    } else {
      await assertRiderDocumentAccess(connection, user.id, Number(version.ownerUserId), { requirePlan: false });
    }
    const bytes = decryptRiderDocumentBytes(encrypted, Number(version.ownerUserId), String(version.storageKey));
    await connection.commit();
    started = false;
    privatePdfHeaders(res, String(version.fileName), req.query.preview === "1");
    return res.send(bytes);
  } catch (error: any) {
    if (started && connection) {
      try { await connection.rollback(); } catch { /* preserve safe response */ }
    }
    const code = error?.code;
    if (code === 'FORBIDDEN') return res.status(403).json({ error: 'Rider PDF access denied' });
    if (code === 'NOT_FOUND') return res.status(404).json({ error: 'Rider PDF not found' });
    if (code === 'BAD_REQUEST') return res.status(400).json({ error: 'Invalid rider PDF request' });
    if (code === 'SERVICE_UNAVAILABLE') return res.status(503).json({ error: 'Rider documents are temporarily unavailable' });
    return res.status(500).json({ error: 'Unable to serve rider PDF' });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
