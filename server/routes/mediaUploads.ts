import { Router, type Request, type Response } from 'express';
import { sdk } from '../_core/sdk';
import { mediaUploadService, MediaUploadError, type AuthenticatedMediaUser } from '../services/mediaUploadService';

const router = Router();
const RAW_LIMIT = 1024 * 1024 + 1;

function safeError(res: Response, error: unknown): Response {
  if (error instanceof MediaUploadError) return res.status(error.status).json({ error: error.message, code: error.code });
  const status = Number((error as { status?: unknown })?.status);
  if (status === 413) return res.status(413).json({ error: 'Chunk exceeds the 1 MiB limit.', code: 'CHUNK_TOO_LARGE' });
  if (status === 504 || (error as { name?: unknown })?.name === 'AbortError') return res.status(504).json({ error: 'Media processing timed out.', code: 'PROCESS_TIMEOUT' });
  console.error('[MediaUpload]', { stage: 'route_error', code: (error as { code?: unknown })?.code });
  return res.status(500).json({ error: 'Media upload could not be completed.', code: 'UPLOAD_FAILED' });
}

async function authenticatedUser(req: Request, res: Response): Promise<AuthenticatedMediaUser | undefined> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!Number.isSafeInteger(user.id) || user.id < 1) throw new Error('invalid user');
    return { id: user.id, role: user.role, openId: user.openId, email: user.email, emailVerified: user.emailVerified };
  } catch {
    res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHORIZED' });
    return undefined;
  }
}

function startBody(body: unknown): { requestId: string; purpose: string; releaseId?: number; fileName: string; mimeType: string; fileSize: number } | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const value = body as Record<string, unknown>;
  if (typeof value.requestId !== 'string' || typeof value.purpose !== 'string' || typeof value.fileName !== 'string' || typeof value.mimeType !== 'string' || !Number.isSafeInteger(value.fileSize)) return undefined;
  if (value.releaseId !== undefined && !Number.isSafeInteger(value.releaseId)) return undefined;
  return { requestId: value.requestId, purpose: value.purpose, fileName: value.fileName, mimeType: value.mimeType, fileSize: value.fileSize as number, ...(value.releaseId === undefined ? {} : { releaseId: value.releaseId as number }) };
}

router.post('/start', async (req: Request, res: Response) => {
  const user = await authenticatedUser(req, res);
  if (!user) return;
  const body = startBody(req.body);
  if (!body) return res.status(400).json({ error: 'Invalid media upload request.', code: 'INVALID_UPLOAD' });
  try { return res.status(200).json(await mediaUploadService.start(user, body as any)); }
  catch (error) { return safeError(res, error); }
});

/** Authentication deliberately occurs before the raw parser/storage allocation. */
router.post('/:id/chunks/:index', async (req: Request, res: Response) => {
  const user = await authenticatedUser(req, res);
  if (!user) return;
  const id = req.params.id;
  const index = Number(req.params.index);
  if (!Number.isSafeInteger(index) || index < 0) return res.status(400).json({ error: 'Invalid chunk index.', code: 'INVALID_UPLOAD' });
  try {
    const contentType = String(req.headers['content-type'] ?? '').toLowerCase().split(';', 1)[0];
    if (contentType !== 'application/octet-stream') return res.status(400).json({ error: 'A binary chunk is required.', code: 'INVALID_UPLOAD' });
    const length = Number(req.headers['content-length']);
    if (!Number.isSafeInteger(length) || length < 0) return res.status(400).json({ error: 'Invalid chunk length.', code: 'INVALID_UPLOAD' });
    if (length > 1024 * 1024) return res.status(413).json({ error: 'Chunk exceeds the 1 MiB limit.', code: 'CHUNK_TOO_LARGE' });
    const chunks: Buffer[] = []; let bytes = 0;
    for await (const part of req) {
      const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
      bytes += chunk.length;
      if (bytes > RAW_LIMIT) return res.status(413).json({ error: 'Chunk exceeds the 1 MiB limit.', code: 'CHUNK_TOO_LARGE' });
      chunks.push(chunk);
    }
    if (bytes !== length) return res.status(400).json({ error: 'Chunk length did not match the request.', code: 'INVALID_UPLOAD' });
    return res.status(200).json(await mediaUploadService.receiveChunk(user, id, index, Buffer.concat(chunks, bytes)));
  } catch (error) { return safeError(res, error); }
});

router.post('/:id/complete', async (req: Request, res: Response) => {
  const user = await authenticatedUser(req, res);
  if (!user) return;
  try { return res.status(202).json(await mediaUploadService.complete(user, req.params.id)); }
  catch (error) { return safeError(res, error); }
});

/** Fast, read-only polling endpoint: it never claims a lease or starts FFmpeg. */
router.get('/:id/status', async (req: Request, res: Response) => {
  const user = await authenticatedUser(req, res);
  if (!user) return;
  try { return res.status(200).json(await mediaUploadService.status(user, req.params.id)); }
  catch (error) { return safeError(res, error); }
});

/** A live request owns CPU work; no detached server task is ever scheduled. */
router.post('/:id/process', async (req: Request, res: Response) => {
  const user = await authenticatedUser(req, res);
  if (!user) return;
  try { return res.status(200).json(await mediaUploadService.process(user, req.params.id)); }
  catch (error) { return safeError(res, error); }
});

export default router;
