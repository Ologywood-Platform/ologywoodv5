/**
 * Release Upload Routes — Express endpoints for file uploads
 * Handles audio file and cover art uploads for White Label Release.
 * Files are stored in S3 via the storagePut helper.
 */

import { Router, Request, Response, NextFunction } from "express";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();

// Allowed audio formats and max size (50 MB)
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",       // MP3
  "audio/wav",        // WAV
  "audio/x-wav",      // WAV (alt)
  "audio/flac",       // FLAC
  "audio/x-flac",     // FLAC (alt)
  "audio/aac",        // AAC
  "audio/mp4",        // M4A
  "audio/x-m4a",      // M4A (alt)
];
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50 MB

// Allowed image formats and max size (10 MB)
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/release/upload/audio
 * Upload an audio file for a release.
 * Expects base64-encoded file data in JSON body.
 */
router.post("/audio", async (req: Request, res: Response) => {
  try {
    // Authenticate user
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { fileData, fileName, mimeType } = req.body;

    if (!fileData || !fileName || !mimeType) {
      return res.status(400).json({ error: "Missing fileData, fileName, or mimeType" });
    }

    // Validate audio format
    if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported audio format. Allowed: MP3, WAV, FLAC, AAC, M4A`,
      });
    }

    // Decode base64
    const base64Data = fileData.split(",")[1] || fileData;
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size
    if (buffer.length > MAX_AUDIO_SIZE) {
      return res.status(400).json({
        error: `File too large. Maximum size is ${MAX_AUDIO_SIZE / (1024 * 1024)} MB`,
      });
    }

    // Generate unique S3 key
    const userId = user.id;
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const ext = fileName.split(".").pop() || "mp3";
    const fileKey = `releases/audio/${userId}/${timestamp}-${randomSuffix}.${ext}`;

    // Upload to S3
    const { url, key } = await storagePut(fileKey, buffer, mimeType);

    return res.json({
      success: true,
      fileKey: key,
      url,
      fileSizeBytes: buffer.length,
      fileFormat: ext.toUpperCase(),
    });
  } catch (error: any) {
    console.error("[Release Upload] Audio upload error:", error);
    return res.status(500).json({ error: "Failed to upload audio file" });
  }
});

/**
 * POST /api/release/upload/cover
 * Upload cover art for a release.
 * Expects base64-encoded image data in JSON body.
 */
router.post("/cover", async (req: Request, res: Response) => {
  try {
    // Authenticate user
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { fileData, fileName, mimeType } = req.body;

    if (!fileData || !fileName || !mimeType) {
      return res.status(400).json({ error: "Missing fileData, fileName, or mimeType" });
    }

    // Validate image format
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: "Unsupported image format. Allowed: JPEG, PNG, WebP",
      });
    }

    // Decode base64
    const base64Data = fileData.split(",")[1] || fileData;
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size
    if (buffer.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)} MB`,
      });
    }

    // Generate unique S3 key
    const userId = user.id;
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const ext = fileName.split(".").pop() || "jpg";
    const fileKey = `releases/covers/${userId}/${timestamp}-${randomSuffix}.${ext}`;

    // Upload to S3
    const { url, key } = await storagePut(fileKey, buffer, mimeType);

    return res.json({
      success: true,
      fileKey: key,
      url,
    });
  } catch (error: any) {
    console.error("[Release Upload] Cover upload error:", error);
    return res.status(500).json({ error: "Failed to upload cover art" });
  }
});

export default router;
