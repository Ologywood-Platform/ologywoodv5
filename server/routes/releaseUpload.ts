/**
 * Release Upload Routes — legacy JSON/base64 endpoints for Music Releases.
 * New clients use the chunked `/api/media-uploads` transport instead. These
 * routes remain available for older clients with strict, bounded decoding.
 */

import { Router, type Request, type Response } from "express";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";

const router = Router();

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
] as const;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type AllowedAudioType = (typeof ALLOWED_AUDIO_TYPES)[number];
type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
type AllowedMimeType = AllowedAudioType | AllowedImageType;

type LegacyUploadBody = {
  fileData?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
};

const extensionByMimeType: Record<AllowedMimeType, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/aac": "aac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sendError(res: Response, status: number, error: string) {
  // Keep the legacy endpoint's established `{ error }` contract. Messages are
  // chosen locally and never contain proxy, storage, or parser internals.
  return res.status(status).json({ error });
}

function getBody(req: Request): LegacyUploadBody | null {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return null;
  return req.body as LegacyUploadBody;
}

function isSafeFileName(value: unknown): value is string {
  return typeof value === "string"
    && value.trim().length > 0
    && value.length <= 255
    && !/[\\/\u0000-\u001f]/.test(value);
}

function isMimeType(value: unknown, allowed: readonly string[]): value is AllowedMimeType {
  return typeof value === "string" && allowed.includes(value);
}

/**
 * Buffer.from silently accepts malformed base64, so validate the representation
 * first and bound encoded input before allocating decoded bytes.
 */
export function decodeReleaseBase64(value: unknown, mimeType: AllowedMimeType, maxBytes: number): Buffer | null {
  if (typeof value !== "string" || !value) return null;

  let encoded = value;
  const dataUri = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(value);
  if (dataUri) {
    if (dataUri[1] !== mimeType) return null;
    encoded = dataUri[2] ?? "";
  } else if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    return null;
  }

  // Canonical base64 cannot be empty, must be padded to 4 bytes, and can only
  // contain enough encoded data for the declared byte limit.
  if (!encoded || encoded.length % 4 !== 0 || encoded.length > Math.ceil(maxBytes / 3) * 4) {
    return null;
  }

  const bytes = Buffer.from(encoded, "base64");
  if (!bytes.length || bytes.length > maxBytes || bytes.toString("base64") !== encoded) return null;
  return bytes;
}

async function authenticate(req: Request, res: Response) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    sendError(res, 401, "Authentication required");
    return null;
  }
}

function buildKey(kind: "audio" | "covers", userId: number, mimeType: AllowedMimeType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 9);
  return `releases/${kind}/${userId}/${timestamp}-${randomSuffix}.${extensionByMimeType[mimeType]}`;
}

router.post("/audio", async (req: Request, res: Response) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const body = getBody(req);
  if (!body || !isSafeFileName(body.fileName) || !isMimeType(body.mimeType, ALLOWED_AUDIO_TYPES)) {
    return sendError(res, 400, "Provide a valid audio file name and supported audio format.");
  }

  const buffer = decodeReleaseBase64(body.fileData, body.mimeType, MAX_AUDIO_SIZE);
  if (!buffer) {
    return sendError(res, 400, "Audio data must be valid base64 and no larger than 50 MB.");
  }

  try {
    const { url, key } = await storagePut(buildKey("audio", user.id, body.mimeType), buffer, body.mimeType);
    return res.json({
      success: true,
      fileKey: key,
      url,
      fileSizeBytes: buffer.length,
      fileFormat: extensionByMimeType[body.mimeType].toUpperCase(),
    });
  } catch (error) {
    console.error("[Release Upload] Audio upload error:", error);
    return sendError(res, 500, "Failed to upload audio file");
  }
});

router.post("/cover", async (req: Request, res: Response) => {
  const user = await authenticate(req, res);
  if (!user) return;

  const body = getBody(req);
  if (!body || !isSafeFileName(body.fileName) || !isMimeType(body.mimeType, ALLOWED_IMAGE_TYPES)) {
    return sendError(res, 400, "Provide a valid cover art file name and supported image format.");
  }

  const buffer = decodeReleaseBase64(body.fileData, body.mimeType, MAX_IMAGE_SIZE);
  if (!buffer) {
    return sendError(res, 400, "Cover art data must be valid base64 and no larger than 10 MB.");
  }

  try {
    const { url, key } = await storagePut(buildKey("covers", user.id, body.mimeType), buffer, body.mimeType);
    return res.json({
      success: true,
      fileKey: key,
      url,
      fileSizeBytes: buffer.length,
      fileFormat: extensionByMimeType[body.mimeType].toUpperCase(),
    });
  } catch (error) {
    console.error("[Release Upload] Cover upload error:", error);
    return sendError(res, 500, "Failed to upload cover art");
  }
});

export default router;
