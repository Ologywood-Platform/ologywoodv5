import type { Express } from "express";
import { ENV } from "./env";

// In-memory cache for small assets (badges, icons) to avoid repeated fetches
const assetCache = new Map<string, { buffer: Buffer; contentType: string; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as any)[0] as string;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    // Check in-memory cache first
    const cached = assetCache.get(key);
    if (cached && cached.expires > Date.now()) {
      res.set("Content-Type", cached.contentType);
      res.set("Cache-Control", "public, max-age=3600");
      res.send(cached.buffer);
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      // Fetch the actual file bytes and pipe them directly to the client
      const fileResp = await fetch(url);
      if (!fileResp.ok) {
        console.error(`[StorageProxy] file fetch error: ${fileResp.status}`);
        res.status(502).send("Failed to fetch file from storage");
        return;
      }

      const contentType = fileResp.headers.get("content-type") || "application/octet-stream";
      const arrayBuffer = await fileResp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Cache small files (< 500KB) in memory
      if (buffer.length < 500 * 1024) {
        assetCache.set(key, {
          buffer,
          contentType,
          expires: Date.now() + CACHE_TTL_MS,
        });
      }

      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=3600");
      res.send(buffer);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
