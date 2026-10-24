import { describe, expect, it } from "vitest";
import {
  getUploadStatusMessage,
  normalizeTrpcNonJsonResponse,
  readUploadResponse,
  UploadResponseError,
} from "../client/src/lib/uploadResponse";

describe("upload response handling", () => {
  it("maps gateway statuses to stable public upload messages", () => {
    expect(getUploadStatusMessage(413)).toMatch(/too large/i);
    expect(getUploadStatusMessage(500)).not.toMatch(/internal|stack|exception/i);
    expect(getUploadStatusMessage(502)).toMatch(/temporarily unavailable/i);
    expect(getUploadStatusMessage(503)).toMatch(/temporarily unavailable/i);
    expect(getUploadStatusMessage(504)).toMatch(/timed out/i);
  });

  it("never exposes non-JSON or malformed success bodies", async () => {
    await expect(readUploadResponse(new Response("upstream trace: secret", {
      status: 503,
      headers: { "content-type": "text/plain" },
    }))).rejects.toMatchObject({
      name: "UploadResponseError",
      status: 503,
      message: getUploadStatusMessage(503),
    });

    await expect(readUploadResponse(new Response("{not json", {
      status: 200,
      headers: { "content-type": "application/json" },
    }))).rejects.toMatchObject({
      name: "UploadResponseError",
      message: "The upload service returned an invalid response. Please try again.",
    });
  });

  it("returns typed JSON only from a successful JSON response", async () => {
    const payload = await readUploadResponse<{ id: string }>(new Response(JSON.stringify({ id: "upload_1" }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    }));
    expect(payload).toEqual({ id: "upload_1" });
  });

  it("normalizes HTML and plain-text tRPC failures while preserving auth and payload statuses", async () => {
    for (const [status, expectedCode] of [[401, "UNAUTHORIZED"], [403, "FORBIDDEN"], [413, "PAYLOAD_TOO_LARGE"], [503, "INTERNAL_SERVER_ERROR"]] as const) {
      const normalized = normalizeTrpcNonJsonResponse(new Response("<html>proxy detail</html>", {
        status,
        headers: { "content-type": "text/html" },
      }));
      const body = await normalized.json() as { error: { json: { message: string; data: { code: string; httpStatus: number } } } };
      expect(normalized.status).toBe(status);
      expect(normalized.headers.get("content-type")).toContain("application/json");
      expect(body.error.json.data).toEqual({ code: expectedCode, httpStatus: status });
      expect(body.error.json.message).not.toContain("proxy detail");
    }
  });

  it("leaves valid JSON tRPC responses unchanged", () => {
    const response = new Response(JSON.stringify({ result: { data: {} } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    expect(normalizeTrpcNonJsonResponse(response)).toBe(response);
  });

  it("uses the public UploadResponseError class", () => {
    expect(new UploadResponseError(413)).toMatchObject({
      status: 413,
      message: getUploadStatusMessage(413),
    });
  });
});
