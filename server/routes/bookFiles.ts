import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { storageGet, storagePut } from '../storage';
import { sdk } from '../_core/sdk';
import { getPool } from '../db';
import { ensureMerchItemsSchema } from '../services/merchSchemaService';
import { EBOOK_FILE_FORMAT_VALUES, MAX_EBOOK_SIZE_BYTES } from '../../shared/bookCommerce';

const router = Router();
const EBOOK_MIME_TYPES = ['application/pdf', 'application/epub+zip'] as const;

const ebookUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_EBOOK_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (EBOOK_MIME_TYPES.includes(file.mimetype as (typeof EBOOK_MIME_TYPES)[number])) cb(null, true);
    else cb(new Error('Only PDF and EPUB eBook files are allowed'));
  },
});

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180) || 'ebook';
}

router.post('/upload/:itemId', ebookUpload.single('ebook'), async (req: Request, res: Response) => {
  try {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const itemId = Number(req.params.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) return res.status(400).json({ error: 'Invalid book item' });
    if (!req.file) return res.status(400).json({ error: 'Select a PDF or EPUB file' });
    if (req.body?.rightsConfirmed !== 'true') {
      return res.status(400).json({ error: 'Confirm that you own or control the rights needed to sell this eBook' });
    }

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: 'Database unavailable' });
    await ensureMerchItemsSchema(pool as any);

    const [rows] = await pool.execute(
      'SELECT id, userId, productCategory, bookFormat FROM merch_items WHERE id = ? LIMIT 1',
      [itemId],
    );
    const item = (rows as any[])[0];
    if (!item || Number(item.userId) !== user.id) return res.status(404).json({ error: 'Book item not found' });
    if (item.productCategory !== 'book' || item.bookFormat !== 'ebook') {
      return res.status(400).json({ error: 'This item is not configured as an eBook' });
    }

    const format = req.file.mimetype === EBOOK_MIME_TYPES[1] ? EBOOK_FILE_FORMAT_VALUES[1] : EBOOK_FILE_FORMAT_VALUES[0];
    const originalName = safeFileName(req.file.originalname);
    const key = `ebooks/${user.id}/${itemId}/${randomUUID()}-${originalName}`;
    await storagePut(key, req.file.buffer, req.file.mimetype);

    await pool.execute(
      `UPDATE merch_items
       SET ebookFileKey = ?, ebookFileName = ?, ebookFileSize = ?, ebookMimeType = ?, ebookFileFormat = ?,
           ebookRightsConfirmed = TRUE, ebookRightsConfirmedAt = COALESCE(ebookRightsConfirmedAt, CURRENT_TIMESTAMP)
       WHERE id = ? AND userId = ?`,
      [key, originalName, req.file.size, req.file.mimetype, format, itemId, user.id],
    );

    return res.json({ success: true, fileName: originalName, fileSize: req.file.size, fileFormat: format });
  } catch (error: any) {
    console.error('[Book File Upload Error]', error);
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'eBook files must be under 25 MB' });
    return res.status(500).json({ error: error.message || 'eBook upload failed' });
  }
});

router.get('/download/:accessId', async (req: Request, res: Response) => {
  try {
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: 'Sign in to download your purchased eBook' });
    }

    const accessId = Number(req.params.accessId);
    if (!Number.isInteger(accessId) || accessId <= 0) return res.status(400).json({ error: 'Invalid download access' });

    const pool = getPool();
    if (!pool) return res.status(503).json({ error: 'Database unavailable' });
    await ensureMerchItemsSchema(pool as any);

    const [rows] = await pool.execute(
      `SELECT a.id, a.buyerUserId, a.buyerEmail, a.downloadCount, a.maxDownloads, a.status,
              o.paymentStatus, m.ebookFileKey, m.ebookFileName
       FROM book_download_access a
       INNER JOIN merch_orders o ON o.id = a.orderId
       INNER JOIN merch_items m ON m.id = a.merchItemId
       WHERE a.id = ? LIMIT 1`,
      [accessId],
    );
    const access = (rows as any[])[0];
    if (!access || access.paymentStatus !== 'paid' || access.status !== 'active') return res.status(404).json({ error: 'Download not available' });

    const userEmail = String(user.email || '').trim().toLowerCase();
    const buyerEmail = String(access.buyerEmail || '').trim().toLowerCase();
    const ownsAccess = Number(access.buyerUserId) === user.id || Boolean(userEmail && buyerEmail && userEmail === buyerEmail);
    if (!ownsAccess) return res.status(403).json({ error: 'You do not have access to this eBook' });
    if (Number(access.downloadCount) >= Number(access.maxDownloads)) {
      return res.status(403).json({ error: `Download limit reached (${access.maxDownloads} downloads). Contact support for assistance.` });
    }
    if (!access.ebookFileKey) return res.status(404).json({ error: 'eBook file is not available' });

    const { url } = await storageGet(access.ebookFileKey);
    const [updateResult] = await pool.execute(
      `UPDATE book_download_access
       SET downloadCount = downloadCount + 1, lastDownloadedAt = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'active' AND downloadCount < maxDownloads`,
      [accessId],
    );
    if (Number((updateResult as any).affectedRows || 0) !== 1) {
      return res.status(403).json({ error: `Download limit reached (${access.maxDownloads} downloads). Contact support for assistance.` });
    }
    const [countRows] = await pool.execute(
      'SELECT downloadCount, maxDownloads FROM book_download_access WHERE id = ? LIMIT 1',
      [accessId],
    );
    const updatedAccess = (countRows as any[])[0];

    return res.json({
      success: true,
      downloadUrl: url,
      fileName: access.ebookFileName || 'ebook',
      downloadsUsed: Number(updatedAccess.downloadCount),
      downloadsRemaining: Math.max(0, Number(updatedAccess.maxDownloads) - Number(updatedAccess.downloadCount)),
    });
  } catch (error) {
    console.error('[Book Download Error]', error);
    return res.status(500).json({ error: 'Failed to generate eBook download link' });
  }
});

export default router;
