import type { Request, Response } from "express";

// Exact version requested for the October 2026 Node security deployment.
// Update this constant, Dockerfile and .nvmrc together for a future patch.
export const REQUIRED_NODE_VERSION = "22.23.4";

export function isRequiredNodeRuntime(nodeVersion = process.versions.node): boolean {
  return nodeVersion === REQUIRED_NODE_VERSION;
}

export function assertProductionNodeRuntime(
  environment = process.env.NODE_ENV,
  nodeVersion = process.versions.node,
): void {
  if (environment === "production" && !isRequiredNodeRuntime(nodeVersion)) {
    throw new Error(
      `Production requires Node.js ${REQUIRED_NODE_VERSION}; running ${nodeVersion}. Rebuild with the pinned production image.`,
    );
  }
}

// Only the existing administrator-gated system procedure exposes exact versions.
export function getRuntimeDetails() {
  return {
    nodeVersion: process.versions.node,
    requiredNodeVersion: REQUIRED_NODE_VERSION,
    runtimeVerified: isRequiredNodeRuntime(),
  };
}

export function runtimeHealthHandler(_req: Request, res: Response): void {
  // The public endpoint reveals only exact-match verification, not the current
  // version, environment, file paths, accounts, credentials, or process details.
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtimeVerified: isRequiredNodeRuntime(),
  });
}
