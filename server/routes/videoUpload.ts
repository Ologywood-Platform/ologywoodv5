/**
 * Video Upload Route
 * Handles multipart file upload for performance videos, bypassing tRPC JSON body limits.
 * The file is received via multer and forwarded to S3 via storagePut.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { storagePut } from '../storage';
import * as db from '../db';
import { sdk } from '../_core/sdk';
import { ensureVideoPortfolioSchema } from '../services/videoPortfolioSchemaService';
import { VIDEO_PORTFOLIO_CATEGORIES, type VideoPortfolioCategory } from '../../shared/videoPortfolio';

const router = Router();

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
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only MP4, MOV, and WebM videos are allowed'));
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

// POST /api/video/portfolio — multipart upload for short portfolio clips
router.post('/portfolio', portfolioUpload.single('video'), async (req: Request, res: Response) => {
  try {
    let user;
    try {
      user = await sdk.authenticateRequest(req as any);
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await db.getArtistProfileByUserId(user.id);
    if (!profile) return res.status(404).json({ error: 'Artist profile not found' });

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Select a video file to upload' });

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
    const fileKey = `video-portfolio/${user.id}/${Date.now()}.${safeExtension}`;
    const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

    const [result] = await pool.execute(
      'INSERT INTO video_portfolio (artistProfileId, title, videoUrl, category, duration, sortOrder, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [profile.id, title, url, category, duration || null, count, 'active'],
    );

    return res.json({ success: true, id: (result as any).insertId, url });
  } catch (err: any) {
    console.error('[Portfolio Video Upload Error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Portfolio video must be under 100MB' });
    }
    return res.status(500).json({ error: err.message || 'Portfolio video upload failed' });
  }
});

export default router;
