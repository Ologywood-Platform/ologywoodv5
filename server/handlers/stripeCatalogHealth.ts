import type { Request, Response } from "express";
import { requireVerifiedCronTask } from "../services/cronAuth";
import { runStripeCatalogHealthCheck, type StripeCatalogMode } from "../services/stripeCatalogHealthService";

export async function stripeCatalogHealthHandler(req: Request, res: Response): Promise<void> {
  if (!(await requireVerifiedCronTask(req, res))) return;

  const requestedMode = req.body?.mode;
  const mode: StripeCatalogMode = requestedMode === "test" ? "test" : "live";

  try {
    const result = await runStripeCatalogHealthCheck(mode);
    res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    console.error("[StripeCatalogHealth] Check failed", error);
    res.status(503).json({
      ok: false,
      mode,
      checkedAt: new Date().toISOString(),
      error: "Stripe catalog health check failed",
    });
  }
}
