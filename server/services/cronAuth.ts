import type { Request, Response } from 'express';
import { sdk } from '../_core/sdk';

const CRON_TASK_UID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Validate the task identity supplied by the Manus scheduled-job gateway.
 * The gateway remains the authority for the header; this boundary rejects
 * missing, duplicated, whitespace-bearing, and oversized values before any
 * scheduled job can read or mutate application data.
 */
export function requireCronTaskUid(req: Request, res: Response): string | null {
  const header = req.headers['x-manus-cron-task-uid'];
  const taskUid = typeof header === 'string' ? header : null;
  if (!taskUid || !CRON_TASK_UID_PATTERN.test(taskUid)) {
    res.status(403).json({ error: 'cron-only' });
    return null;
  }
  return taskUid;
}

/**
 * Authenticate the scheduler's signed cron session. Heartbeat callbacks use
 * the verified cron session cookie; when a task UID header is present, it is
 * still required to be canonical and to match the signed session identity.
 */
export async function requireVerifiedCronTask(req: Request, res: Response): Promise<string | null> {
  let user;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    res.status(403).json({ error: 'cron-only' });
    return null;
  }
  if (!user.isCron || !user.taskUid || !CRON_TASK_UID_PATTERN.test(user.taskUid)) {
    res.status(403).json({ error: 'cron-only' });
    return null;
  }
  const header = req.headers['x-manus-cron-task-uid'];
  if (header !== undefined) {
    const headerUid = requireCronTaskUid(req, res);
    if (!headerUid || headerUid !== user.taskUid) return null;
  }
  return user.taskUid;
}
