import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import releaseUploadRouter, { decodeReleaseBase64 } from "./routes/releaseUpload";

function buildApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/release/upload", releaseUploadRouter);
  return app;
}

const audio = Buffer.from("legacy audio bytes");
const image = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("legacy Music Release base64 upload routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: 42 });
    mocks.storagePut.mockImplementation(async (key: string) => ({ key, url: `/manus-storage/${key}` }));
  });

  it("accepts canonical, correctly typed base64 and returns the legacy completion shape", async () => {
    const result = await request(buildApp())
      .post("/api/release/upload/audio")
      .send({
        fileData: `data:audio/mpeg;base64,${audio.toString("base64")}`,
        fileName: "single.mp3",
        mimeType: "audio/mpeg",
      });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true,
      fileKey: expect.stringMatching(/^releases\/audio\/42\//),
      url: expect.stringMatching(/^\/manus-storage\//),
      fileSizeBytes: audio.length,
      fileFormat: "MP3",
    });
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.any(String), audio, "audio/mpeg");
  });

  it("uses the actual decoded cover byte size and normalized completion fields", async () => {
    const result = await request(buildApp())
      .post("/api/release/upload/cover")
      .send({
        fileData: image.toString("base64"),
        fileName: "cover.png",
        mimeType: "image/png",
      });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      success: true,
      fileSizeBytes: image.length,
      fileFormat: "PNG",
      fileKey: expect.stringMatching(/^releases\/covers\/42\//),
    });
  });

  it("strictly rejects malformed, noncanonical, cross-MIME, and unsafe legacy input before storage", async () => {
    const app = buildApp();
    const invalidBodies = [
      { fileData: "not base64!", fileName: "single.mp3", mimeType: "audio/mpeg" },
      { fileData: "YQ=", fileName: "single.mp3", mimeType: "audio/mpeg" },
      { fileData: `data:image/png;base64,${audio.toString("base64")}`, fileName: "single.mp3", mimeType: "audio/mpeg" },
      { fileData: audio.toString("base64"), fileName: "../single.mp3", mimeType: "audio/mpeg" },
      { fileData: audio.toString("base64"), fileName: "single.mp3", mimeType: "audio/ogg" },
    ];

    for (const body of invalidBodies) {
      const result = await request(app).post("/api/release/upload/audio").send(body);
      expect(result.status).toBe(400);
      expect(result.headers["content-type"]).toContain("application/json");
      expect(result.body).toEqual({ error: expect.any(String) });
    }
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("returns JSON authentication and storage errors without implementation details", async () => {
    mocks.authenticateRequest.mockRejectedValueOnce(new Error("session parse detail"));
    const unauthorized = await request(buildApp()).post("/api/release/upload/audio").send({
      fileData: audio.toString("base64"), fileName: "single.mp3", mimeType: "audio/mpeg",
    });
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body).toEqual({ error: "Authentication required" });

    mocks.storagePut.mockRejectedValueOnce(new Error("S3 credential detail"));
    const failed = await request(buildApp()).post("/api/release/upload/cover").send({
      fileData: image.toString("base64"), fileName: "cover.png", mimeType: "image/png",
    });
    expect(failed.status).toBe(500);
    expect(failed.body).toEqual({ error: "Failed to upload cover art" });
  });

  it("bounds decoding before allocation and rejects payloads above the declared byte limit", () => {
    expect(decodeReleaseBase64("YWJj", "audio/mpeg", 3)).toEqual(Buffer.from("abc"));
    expect(decodeReleaseBase64("YWJjZA==", "audio/mpeg", 3)).toBeNull();
    expect(decodeReleaseBase64("YWJj", "audio/mpeg", 2)).toBeNull();
  });
});
