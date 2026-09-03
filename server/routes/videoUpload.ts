/**
 * Video Upload Route
 * Handles multipart file upload for performance videos, bypassing tRPC JSON body limits.
 * The file is received via multer and forwarded to S3 via storagePut.
 */

import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { storagePut } from '../storage';
import * as db from '../db';
import { sdk } from '../_core/sdk';
import { ensureVideoPortfolioSchema } from '../services/videoPortfolioSchemaService';
import { VIDEO_PORTFOLIO_CATEGORIES, type VideoPortfolioCategory } from '../../shared/videoPortfolio';
import {
  PORTFOLIO_UPLOAD_CHUNK_BYTES,
  PortfolioUploadValidationError,
  assembleUploadedAsset,
  assertUploadSessionOwner,
  createPortfolioUploadSession,
  getExpectedChunkLength,
  getUploadChunkKey,
  publicStorageUrl,
  readPortfolioUploadInput,
  signPortfolioUploadSession,
  validateAssembledMedia,
  verifyPortfolioUploadSession,
} from '../services/videoPortfolioDirectUpload';

const router = Router();

async function getPortfolioUploadContext(req: Request) {
  let user;
  try {
    user = await sdk.authenticateRequest(req as any);
  } catch {
    throw new PortfolioUploadValidationError('Unauthorized', 401);
  }
  const profile = await db.getArtistProfileByUserId(user.id);
  if (!profile) throw new PortfolioUploadValidationError('Artist profile not found', 404);
  const pool = db.getPool();
  if (!pool) throw new PortfolioUploadValidationError('Database unavailable', 503);
  await ensureVideoPortfolioSchema(pool as any);
  return { user, profile, pool };
}

async function assertPortfolioCapacity(pool: NonNullable<ReturnType<typeof db.getPool>>, profileId: number) {
  const [existing] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM video_portfolio WHERE artistProfileId = ? AND status = ?',
    [profileId, 'active'],
  );
  const count = Number((existing as any[])[0]?.cnt || 0);
  if (count >= 10) throw new PortfolioUploadValidationError('Maximum 10 videos allowed. Remove one to add another.');
  return count;
}

// Configure multer for memory storage (file in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, MOV, and WebM videos are allowed'));
    }
  },
});

const portfolioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const allowedThumbnailTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (file.fieldname === 'video' && allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (file.fieldname === 'thumbnail' && allowedThumbnailTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, MOV, and WebM videos with JPEG, PNG, or WebP thumbnails are allowed'));
    }
  },
});

// POST /api/video/upload
router.post('/upload', upload.single('video'), async (req: Request, res: Response) => {
  try {
    // Authenticate using the same SDK as tRPC
    let user;
    try {
      user = await sdk.authenticateRequest(req as any);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check artist profile
    const profile = await db.getArtistProfileByUserId(user.id);
    if (!profile) {
      return res.status(404).json({ error: 'Artist profile not found' });
    }

    // Check subscription tier
    const subscription = await db.getSubscriptionByUserId(user.id);
    const tier = subscription?.tier || 'free';
    if (tier !== 'professional' && tier !== 'starter') {
      return res.status(403).json({ error: 'Performance video upload requires a Starter or Professional subscription' });
    }

    // Check file
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Get duration from form data
    const durationSeconds = parseFloat(req.body.durationSeconds || '0');
    if (durationSeconds > 300) {
      return res.status(400).json({ error: 'Video must be 5 minutes or less' });
    }

    // Upload to S3
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || 'mp4';
    const fileKey = `performance-videos/${user.id}/${timestamp}.${ext}`;
    const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

    // Update artist profile — auto-approve (community flagging model)
    await db.updateArtistProfile(profile.id, {
      performanceVideoUrl: url,
      performanceVideoStatus: 'approved',
      performanceVideoDuration: durationSeconds,
      performanceVideoUploadedAt: new Date(),
      performanceVideoFlagCount: 0,
    } as any);

    return res.json({ success: true, url, status: 'approved' });
  } catch (err: any) {
    console.error('[Video Upload Error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Video file must be under 500MB' });
    }
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// POST /api/video/portfolio/start — create an owner-bound upload session.
router.post('/portfolio/start', async (req: Request, res: Response) => {
  try {
    const { user, profile, pool } = await getPortfolioUploadContext(req);
    const input = readPortfolioUploadInput(req.body);
    await assertPortfolioCapacity(pool, profile.id);
    const session = createPortfolioUploadSession(input, {
      userId: user.id,
      profileId: profile.id,
      sessionId: randomUUID(),
    });
    return res.json({
      token: signPortfolioUploadSession(session),
      expiresAt: session.expiresAt,
      chunkBytes: PORTFOLIO_UPLOAD_CHUNK_BYTES,
      videoChunkCount: session.videoChunkCount,
      thumbnailChunkCount: session.thumbnailChunkCount,
    });
  } catch (err: any) {
    console.error('[Portfolio Video Start Error]', err);
    const status = err instanceof PortfolioUploadValidationError ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Could not start the video upload' });
  }
});

const portfolioChunkBody = express.raw({ type: 'application/octet-stream', limit: '5mb' });

// POST /api/video/portfolio/chunk — send one bounded, authenticated chunk.
router.post('/portfolio/chunk', portfolioChunkBody, async (req: Request, res: Response) => {
  try {
    const { user, profile } = await getPortfolioUploadContext(req);
    const payload = verifyPortfolioUploadSession(String(req.header('x-portfolio-upload-token') || ''));
    assertUploadSessionOwner(payload, { userId: user.id, profileId: profile.id });

    const kindHeader = String(req.header('x-portfolio-upload-kind') || '');
    if (kindHeader !== 'video' && kindHeader !== 'thumbnail') throw new PortfolioUploadValidationError('Invalid upload chunk type');
    const kind = kindHeader as 'video' | 'thumbnail';
    const index = Number(req.header('x-portfolio-upload-index'));
    const expectedLength = getExpectedChunkLength(payload, kind, index);
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (body.length !== expectedLength) throw new PortfolioUploadValidationError('Upload chunk size did not match the signed session');

    const key = getUploadChunkKey(payload, kind, index);
    await storagePut(key, body, 'application/octet-stream');
    return res.json({ success: true, kind, index });
  } catch (err: any) {
    console.error('[Portfolio Video Chunk Error]', err);
    const status = err instanceof PortfolioUploadValidationError ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Could not upload the video chunk' });
  }
});

// POST /api/video/portfolio/finalize — assemble, validate, store, and catalog.
router.post('/portfolio/finalize', async (req: Request, res: Response) => {
  try {
    const { user, profile, pool } = await getPortfolioUploadContext(req);
    const payload = verifyPortfolioUploadSession(String(req.body?.token || ''));
    assertUploadSessionOwner(payload, { userId: user.id, profileId: profile.id });
    const count = await assertPortfolioCapacity(pool, profile.id);
    const videoUrl = publicStorageUrl(payload.finalVideoKey);
    const thumbnailUrl = publicStorageUrl(payload.finalThumbnailKey);
    const [duplicates] = await pool.execute(
      'SELECT id FROM video_portfolio WHERE videoUrl = ? OR thumbnailUrl = ? LIMIT 1',
      [videoUrl, thumbnailUrl],
    );
    if ((duplicates as any[]).length > 0) {
      throw new PortfolioUploadValidationError('This upload was already added to your portfolio', 409);
    }

    const [videoBuffer, thumbnailBuffer] = await Promise.all([
      assembleUploadedAsset(payload, 'video'),
      assembleUploadedAsset(payload, 'thumbnail'),
    ]);
    validateAssembledMedia(videoBuffer, 'video');
    validateAssembledMedia(thumbnailBuffer, 'thumbnail');
    await Promise.all([
      storagePut(payload.finalVideoKey, videoBuffer, payload.videoMimeType),
      storagePut(payload.finalThumbnailKey, thumbnailBuffer, payload.thumbnailMimeType),
    ]);

    const [result] = await pool.execute(
      'INSERT INTO video_portfolio (artistProfileId, title, videoUrl, thumbnailUrl, category, duration, sortOrder, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [profile.id, payload.title, videoUrl, thumbnailUrl, payload.category, payload.duration || null, count, 'active'],
    );

    return res.json({ success: true, id: (result as any).insertId, url: videoUrl, thumbnailUrl });
  } catch (err: any) {
    console.error('[Portfolio Video Finalize Error]', err);
    const status = err instanceof PortfolioUploadValidationError ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Could not finish the video upload' });
  }
});

// POST /api/video/portfolio — backward-compatible multipart upload for short clips.
router.post('/portfolio', portfolioUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    let user;
    try {
      user = await sdk.authenticateRequest(req as any);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await db.getArtistProfileByUserId(user.id);
    if (!profile) return res.status(404).json({ error: 'Artist profile not found' });

    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.video?.[0];
    const thumbnail = files?.thumbnail?.[0];
    if (!file) return res.status(400).json({ error: 'Select a video file to upload' });
    if (!thumbnail) return res.status(400).json({ error: 'We could not create the video thumbnail. Please try the upload again.' });
    if (thumbnail.size > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'Video thumbnail must be under 3MB' });
    }

    const title = String(req.body.title || '').trim();
    const category = String(req.body.category || '') as VideoPortfolioCategory;
    const duration = Number(req.body.durationSeconds || 0);
    if (!title || title.length > 255) {
      return res.status(400).json({ error: 'Enter a video title between 1 and 255 characters' });
    }
    if (!VIDEO_PORTFOLIO_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Select a valid video category' });
    }
    if (!Number.isFinite(duration) || duration < 0 || duration > 120) {
      return res.status(400).json({ error: 'Portfolio videos must be 2 minutes or less' });
    }

    const pool = db.getPool();
    if (!pool) return res.status(503).json({ error: 'Database unavailable' });
    await ensureVideoPortfolioSchema(pool as any);

    const [existing] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM video_portfolio WHERE artistProfileId = ? AND status = ?',
      [profile.id, 'active'],
    );
    const count = Number((existing as any[])[0]?.cnt || 0);
    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 videos allowed. Remove one to add another.' });
    }

    const safeExtension = file.mimetype === 'video/quicktime'
      ? 'mov'
      : file.mimetype === 'video/webm' ? 'webm' : 'mp4';
    const timestamp = Date.now();
    const fileKey = `video-portfolio/${user.id}/${timestamp}.${safeExtension}`;
    const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
    const thumbnailKey = `video-portfolio/${user.id}/thumbnails/${timestamp}.jpg`;
    const { url: thumbnailUrl } = await storagePut(thumbnailKey, thumbnail.buffer, thumbnail.mimetype);

    const [result] = await pool.execute(
      'INSERT INTO video_portfolio (artistProfileId, title, videoUrl, thumbnailUrl, category, duration, sortOrder, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [profile.id, title, url, thumbnailUrl, category, duration || null, count, 'active'],
    );

    return res.json({ success: true, id: (result as any).insertId, url, thumbnailUrl });
  } catch (err: any) {
    console.error('[Portfolio Video Upload Error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Portfolio video must be under 100MB' });
    }
    return res.status(500).json({ error: err.message || 'Portfolio video upload failed' });
  }
});

export default router;
