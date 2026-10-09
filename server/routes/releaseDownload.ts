/**
 * Release Download Routes — Express endpoints for download delivery
 * Handles secure download delivery via presigned S3 URLs.
 * Tracks download count and enforces max download limit (5 per purchase).
 */

import { Router, Request, Response } from "express";
import { storageGet } from "../storage";
import * as db from "../db";
import { sdk } from "../_core/sdk";
import { getMusicPreview } from "../services/releasePreviewMedia";

const router = Router();

/**
 * GET /api/release/download/:purchaseId
 * Generate a presigned download URL for a purchased release.
 * Requires authentication and validates purchase ownership.
 */
router.get("/:purchaseId", async (req: Request, res: Response) => {
  try {
    // Authenticate user
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res.status(401).json({ error: "Authentication required" });
    }

    const purchaseId = parseInt(req.params.purchaseId);
    if (isNaN(purchaseId)) {
      return res.status(400).json({ error: "Invalid purchase ID" });
    }

    // Get the purchase record
    const purchase = await db.getPurchaseById(purchaseId);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Verify ownership: buyer must match the authenticated user
    // Allow by userId match or email match
    const userEmail = user.email?.toLowerCase();
    const purchaseEmail = purchase.buyerEmail?.toLowerCase();
    const isOwner = purchase.buyerUserId === user.id || (userEmail && purchaseEmail && userEmail === purchaseEmail);

    if (!isOwner) {
      return res.status(403).json({ error: "You do not have access to this download" });
    }

    // Check download limit
    if (purchase.downloadCount >= purchase.maxDownloads) {
      return res.status(403).json({
        error: `Download limit reached (${purchase.maxDownloads} downloads). Contact support for assistance.`,
      });
    }

    // Get the release to find the audio file key
    const release = await db.getReleaseDeliveryById(purchase.releaseId);
    if (!release) {
      return res.status(404).json({ error: "Release not found" });
    }

    if (!release.audioFileKey) {
      return res.status(404).json({ error: "Audio file not available" });
    }

    // Generate presigned URL (expires in 1 hour)
    const { url } = await storageGet(release.audioFileKey);

    // Increment download count
    await db.incrementDownloadCount(purchaseId);

    console.log(`[Release Download] User ${user.id} downloading release ${release.id} (purchase ${purchaseId}), download ${purchase.downloadCount + 1}/${purchase.maxDownloads}`);

    return res.json({
      success: true,
      downloadUrl: url,
      fileName: `${release.title}.${release.fileFormat?.toLowerCase() || 'mp3'}`,
      downloadsUsed: purchase.downloadCount + 1,
      downloadsRemaining: purchase.maxDownloads - purchase.downloadCount - 1,
    });
  } catch (error: any) {
    console.error("[Release Download] Error:", error);
    return res.status(500).json({ error: "Failed to generate download link" });
  }
});

/**
 * GET /api/release/download/preview/:releaseId
 * Stream or redirect to a 30-second preview (public, no auth required).
 * Always returns a separately clipped preview, never the full audio source.
 */
router.get("/preview/:releaseId", async (req: Request, res: Response) => {
  try {
    const releaseId = Number(req.params.releaseId);
    if (!Number.isInteger(releaseId) || releaseId < 1) {
      return res.status(400).json({ error: "Invalid release ID" });
    }

    const release = await db.getReleaseDeliveryById(releaseId);
    if (!release || release.status !== "published") {
      return res.status(404).json({ error: "Release not found" });
    }

    const sourceKey = release.previewFileKey || release.audioFileKey;
    if (sourceKey) {
      const previewUrl = await getMusicPreview(sourceKey);
      return res.json({ success: true, previewUrl, hasPreviewFile: true, maxSeconds: 30 });
    }

    return res.status(404).json({ error: "Preview not available for this release" });
  } catch (error: any) {
    console.error("[Release Preview] Error:", error);
    return res.status(500).json({ error: "Failed to generate preview link" });
  }
});

export default router;
