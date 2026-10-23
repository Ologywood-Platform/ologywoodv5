import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const trpcLog = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

// Runtime tests exercise the real system router and authorization middleware;
// these unrelated side-effect dependencies are inert so no services are contacted.
vi.mock("./_core/logger", () => ({
  logger: {
    trpcCall: trpcLog.success,
    trpcError: trpcLog.error,
  },
}));
vi.mock("./_core/notification", () => ({ notifyOwner: vi.fn() }));

import { systemRouter } from "./_core/systemRouter";
import {
  REQUIRED_NODE_VERSION,
  assertProductionNodeRuntime,
  getRuntimeDetails,
  isRequiredNodeRuntime,
  runtimeHealthHandler,
} from "./services/runtimeSecurityService";

const projectRoot = resolve(import.meta.dirname, "..");

function callerFor(user: { id: number; role: string; name: string } | null) {
  return systemRouter.createCaller({ user, req: { headers: {} }, res: {} } as any);
}

describe("runtime security", () => {
  it("accepts exactly the required Node patch in production", () => {
    expect(isRequiredNodeRuntime(REQUIRED_NODE_VERSION)).toBe(true);
    expect(() => assertProductionNodeRuntime("production", REQUIRED_NODE_VERSION)).not.toThrow();
  });

  it.each([
    ["an older patch", "22.23.3"],
    ["a different major", "23.0.0"],
    ["a future patch", "22.23.5"],
  ])("rejects %s in production", (_label, version) => {
    expect(isRequiredNodeRuntime(version)).toBe(false);
    expect(() => assertProductionNodeRuntime("production", version)).toThrow(
      `Production requires Node.js ${REQUIRED_NODE_VERSION}`,
    );
  });

  it.each(["development", "test"]) (
    "does not force a shutdown for a non-production %s runtime",
    (environment) => {
      expect(() => assertProductionNodeRuntime(environment, "0.0.0-test-runtime")).not.toThrow();
    },
  );

  it("returns only actual runtime details from the privileged details helper", () => {
    expect(getRuntimeDetails()).toEqual({
      nodeVersion: process.versions.node,
      requiredNodeVersion: REQUIRED_NODE_VERSION,
      runtimeVerified: isRequiredNodeRuntime(process.versions.node),
    });
    expect(Object.keys(getRuntimeDetails()).sort()).toEqual([
      "nodeVersion",
      "requiredNodeVersion",
      "runtimeVerified",
    ]);
  });

  it("registers the protected runtime query in the real application router", () => {
    const applicationSource = readFileSync(resolve(projectRoot, "server/routers.ts"), "utf8");
    expect(applicationSource).toContain('import { systemRouter } from "./_core/systemRouter"');
    expect(applicationSource).toMatch(/export const appRouter = router\(\{\s*system:\s*systemRouter,/);
  });

  it("serves a non-cacheable public health response without runtime or environment leakage", async () => {
    const app = express();
    app.get("/health", runtimeHealthHandler);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store, max-age=0");
    expect(response.body).toEqual({
      status: "ok",
      timestamp: expect.any(String),
      runtimeVerified: isRequiredNodeRuntime(process.versions.node),
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    expect(Object.keys(response.body).sort()).toEqual(["runtimeVerified", "status", "timestamp"]);
    expect(response.text).not.toContain(REQUIRED_NODE_VERSION);
    expect(response.text).not.toMatch(/node|version|environment|secret|token|password|credential|path/i);
  });

  it("denies anonymous, artist, and collaborator system-runtime callers", async () => {
    await expect(callerFor(null).runtime()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(callerFor({ id: 11, role: "artist", name: "Artist" }).runtime()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(callerFor({ id: 12, role: "user", name: "Collaborator" }).runtime()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows an actual admin system-router caller and returns actual runtime details", async () => {
    await expect(callerFor({ id: 1, role: "admin", name: "Administrator" }).runtime()).resolves.toEqual({
      nodeVersion: process.versions.node,
      requiredNodeVersion: REQUIRED_NODE_VERSION,
      runtimeVerified: isRequiredNodeRuntime(process.versions.node),
    });
  });

  it("keeps Dockerfile's digest-pinned Node image consistent with .nvmrc", () => {
    const dockerfile = readFileSync(resolve(projectRoot, "Dockerfile"), "utf8");
    const nvmrc = readFileSync(resolve(projectRoot, ".nvmrc"), "utf8").trim();

    expect(nvmrc).toBe(REQUIRED_NODE_VERSION);
    expect(dockerfile).toMatch(
      new RegExp(`^FROM\\s+node:${REQUIRED_NODE_VERSION.replace(/\\./g, "\\\\.")}-bookworm-slim@sha256:[a-f0-9]{64}\\s*$`, "m"),
    );
  });

  it("places the production runtime guard before the server listens", () => {
    const startupSource = readFileSync(resolve(projectRoot, "server/_core/index.ts"), "utf8");
    const startServer = startupSource.indexOf("async function startServer()");
    const startupBody = startupSource.slice(startServer);
    const runtimeGuard = startupBody.indexOf("assertProductionNodeRuntime()");
    const listen = startupBody.indexOf(".listen(");

    expect(startServer).toBeGreaterThanOrEqual(0);
    expect(runtimeGuard).toBeGreaterThanOrEqual(0);
    expect(listen).toBeGreaterThanOrEqual(0);
    expect(runtimeGuard).toBeLessThan(listen);
  });
});
