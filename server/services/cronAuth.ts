import type { Request, Response } from 'express';

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
