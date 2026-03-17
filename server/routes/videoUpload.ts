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

    // Update artist profile
    await db.updateArtistProfile(profile.id, {
      performanceVideoUrl: url,
      performanceVideoStatus: 'pending',
      performanceVideoDuration: durationSeconds,
      performanceVideoUploadedAt: new Date(),
    } as any);

    // Add to moderation queue
    await db.createVideoModerationEntry({
      artistProfileId: profile.id,
      artistUserId: user.id,
      videoUrl: url,
      durationSeconds: durationSeconds,
      status: 'pending',
    });

    return res.json({ success: true, url, status: 'pending' });
  } catch (err: any) {
    console.error('[Video Upload Error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Video file must be under 500MB' });
    }
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;
