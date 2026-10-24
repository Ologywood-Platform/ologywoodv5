import {
  MEDIA_UPLOAD_CHUNK_BYTES,
  MEDIA_UPLOAD_LIMITS,
  type MediaUploadProgress,
  type MediaUploadPurpose,
  type MediaUploadResult,
  type MediaUploadState,
  type MediaUploadStatus,
} from '@shared/mediaUpload';
import { getContentReleaseCoverMimeType } from '@shared/contentReleaseCover';
import { getReleasePreviewMimeType } from '@shared/releasePreview';
import { UploadResponseError, readUploadResponse } from './uploadResponse';

const TOTAL_TIMEOUT_MS = 3 * 60 * 1000;
const CHUNK_TIMEOUT_MS = 30 * 1000;
const STATUS_TIMEOUT_MS = 110 * 1000;
const START_AND_COMPLETE_TIMEOUT_MS = 30 * 1000;
const RETRYABLE_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [500, 1_000];
const INVALID_RESPONSE_MESSAGE = 'The upload service returned an invalid response. Please try again.';
const INVALID_REQUEST_MESSAGE = 'The upload request was invalid. Check the file and try again.';
const MAX_RETAINED_REQUEST_IDS = 100;

// Keep only an opaque, owner-scoped request ID for the exact selected file.
// This lets a manual retry reconcile an unknown start outcome without retaining
// private upload/job data or allocating a second processing job.
const retainedRequestIds = new Map<string, string>();

type MediaFile = Pick<File, 'name' | 'size' | 'type' | 'slice' | 'lastModified'>;

type UploadOptions = {
  purpose: MediaUploadPurpose;
  releaseId?: number;
  onProgress?: (progress: MediaUploadProgress) => void;
  signal?: AbortSignal;
  requestId?: string;
};

type RequestSignal = {
  signal: AbortSignal;
  timedOut: () => boolean;
  dispose: () => void;
};

function invalidResponse(): UploadResponseError {
  return new UploadResponseError(200, INVALID_RESPONSE_MESSAGE);
}

function abortError(): DOMException {
  return new DOMException('The upload was cancelled.', 'AbortError');
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isRetryableError(error: unknown): error is UploadResponseError {
  return error instanceof UploadResponseError && RETRYABLE_STATUSES.has(error.status);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function normalizeMusicAudioMimeType(file: Pick<MediaFile, 'name' | 'type'>): string | null {
  const supplied = file.type.trim().toLowerCase();
  const aliases: Record<string, string> = {
    'audio/mp3': 'audio/mpeg',
    'audio/x-wav': 'audio/wav',
    'audio/wave': 'audio/wav',
    'audio/x-flac': 'audio/flac',
    'audio/x-m4a': 'audio/mp4',
    'audio/m4a': 'audio/mp4',
  };
  const allowed = new Set(['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp4']);
  const normalized = aliases[supplied] || supplied;
  if (allowed.has(normalized)) return normalized;

  const extension = /\.([a-z0-9]+)$/i.exec(file.name.trim())?.[1]?.toLowerCase();
  const fromExtension: Record<string, string> = {
    mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4',
  };
  return extension ? fromExtension[extension] || null : null;
}

function normalizeMusicCoverMimeType(file: Pick<MediaFile, 'name' | 'type'>): string | null {
  const supplied = file.type.trim().toLowerCase();
  if (['image/jpeg', 'image/png', 'image/webp'].includes(supplied)) return supplied;
  const extension = /\.([a-z0-9]+)$/i.exec(file.name.trim())?.[1]?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}

function mimeTypeFor(file: Pick<MediaFile, 'name' | 'type'>, purpose: MediaUploadPurpose): string | null {
  switch (purpose) {
    case 'content-preview':
      // File's standard properties are not enumerable in every browser/runtime;
      // do not spread it or name/type can disappear before shared validation.
      return getReleasePreviewMimeType({ name: file.name, type: file.type, size: 1 });
    case 'content-cover': {
      const mimeType = getContentReleaseCoverMimeType(file);
      return ['image/jpeg', 'image/png', 'image/webp'].includes(mimeType) ? mimeType : null;
    }
    case 'music-audio':
      return normalizeMusicAudioMimeType(file);
    case 'music-cover':
      return normalizeMusicCoverMimeType(file);
  }
}

function requestIdFor(file: MediaFile, options: UploadOptions): { requestId: string; retainedKey?: string } {
  if (options.requestId) {
    if (!isUuid(options.requestId)) throw new UploadResponseError(400, INVALID_REQUEST_MESSAGE);
    return { requestId: options.requestId };
  }
  const retainedKey = JSON.stringify({
    purpose: options.purpose,
    releaseId: options.releaseId ?? null,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  });
  const retained = retainedRequestIds.get(retainedKey);
  if (retained) {
    retainedRequestIds.delete(retainedKey);
    retainedRequestIds.set(retainedKey, retained);
    return { requestId: retained, retainedKey };
  }
  const requestId = globalThis.crypto?.randomUUID?.();
  if (!isUuid(requestId)) throw new UploadResponseError(400, INVALID_REQUEST_MESSAGE);
  retainedRequestIds.set(retainedKey, requestId);
  while (retainedRequestIds.size > MAX_RETAINED_REQUEST_IDS) {
    const oldestKey = retainedRequestIds.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    retainedRequestIds.delete(oldestKey);
  }
  return { requestId, retainedKey };
}

function createRequestSignal(externalSignal: AbortSignal | undefined, timeoutMs: number): RequestSignal {
  const timeoutAbortController = new AbortController();
  const timeoutSignal = typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(timeoutMs)
    : timeoutAbortController.signal;
  const timer = typeof AbortSignal.timeout === 'function'
    ? undefined
    : globalThis.setTimeout(() => timeoutAbortController.abort(), timeoutMs);

  if (!externalSignal) {
    return {
      signal: timeoutSignal,
      timedOut: () => timeoutSignal.aborted,
      dispose: () => { if (timer !== undefined) globalThis.clearTimeout(timer); },
    };
  }

  if (typeof AbortSignal.any === 'function') {
    return {
      signal: AbortSignal.any([externalSignal, timeoutSignal]),
      timedOut: () => timeoutSignal.aborted,
      dispose: () => { if (timer !== undefined) globalThis.clearTimeout(timer); },
    };
  }

  const combinedController = new AbortController();
  const abortFromExternal = () => combinedController.abort(externalSignal.reason);
  const abortFromTimeout = () => combinedController.abort(timeoutSignal.reason);
  if (externalSignal.aborted) abortFromExternal();
  else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  if (timeoutSignal.aborted) abortFromTimeout();
  else timeoutSignal.addEventListener('abort', abortFromTimeout, { once: true });

  return {
    signal: combinedController.signal,
    timedOut: () => timeoutSignal.aborted,
    dispose: () => {
      externalSignal.removeEventListener('abort', abortFromExternal);
      timeoutSignal.removeEventListener('abort', abortFromTimeout);
      if (timer !== undefined) globalThis.clearTimeout(timer);
    },
  };
}

function remainingTimeout(startedAt: number, requestedTimeoutMs: number): number {
  const remaining = TOTAL_TIMEOUT_MS - (Date.now() - startedAt);
  if (remaining <= 0) throw new UploadResponseError(504, 'The upload timed out. Check your connection and try again.');
  return Math.min(requestedTimeoutMs, remaining);
}

async function sleep(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw abortError();
  await new Promise<void>((resolve, reject) => {
    const complete = () => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    };
    const timer = setTimeout(complete, delayMs);
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      reject(abortError());
    };
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

async function requestJson(
  url: string,
  init: RequestInit,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<unknown> {
  if (externalSignal?.aborted) throw abortError();
  const requestSignal = createRequestSignal(externalSignal, timeoutMs);
  try {
    const response = await fetch(url, { ...init, credentials: 'include', signal: requestSignal.signal });
    return await readUploadResponse<unknown>(response);
  } catch (error) {
    if (externalSignal?.aborted) throw abortError();
    // A request timeout is deliberately treated like an unknown network outcome.
    // The caller reconciles a known session before deciding whether it may continue.
    if (requestSignal.timedOut() && isAbortError(error)) throw error;
    throw error;
  } finally {
    requestSignal.dispose();
  }
}

function parseStatus(
  payload: unknown,
  expected: { id?: string; chunkCount: number; fileSize: number },
): MediaUploadStatus {
  if (!isObject(payload)
    || !isUuid(payload.id)
    || !['uploading', 'queued', 'processing', 'done', 'failed'].includes(payload.state as string)
    || !Array.isArray(payload.receivedChunks)
    || payload.chunkBytes !== MEDIA_UPLOAD_CHUNK_BYTES
    || payload.chunkCount !== expected.chunkCount
    || !isFiniteNonNegative(payload.expiresAt)) {
    throw invalidResponse();
  }
  if (expected.id && payload.id !== expected.id) throw invalidResponse();

  const receivedChunks = payload.receivedChunks;
  if (new Set(receivedChunks).size !== receivedChunks.length
    || receivedChunks.some((chunk) => !Number.isSafeInteger(chunk) || chunk < 0 || chunk >= expected.chunkCount)) {
    throw invalidResponse();
  }
  if (payload.error !== undefined && !isNonEmptyString(payload.error)) throw invalidResponse();
  if (payload.result !== undefined && !isObject(payload.result)) throw invalidResponse();

  return {
    id: payload.id,
    state: payload.state as MediaUploadState,
    receivedChunks: [...receivedChunks] as number[],
    chunkBytes: MEDIA_UPLOAD_CHUNK_BYTES,
    chunkCount: expected.chunkCount,
    expiresAt: payload.expiresAt,
    ...(payload.result === undefined ? {} : { result: payload.result as MediaUploadResult }),
    ...(payload.error === undefined ? {} : { error: payload.error }),
  };
}

function validateResult(
  result: MediaUploadResult | undefined,
  purpose: MediaUploadPurpose,
  fileSize: number,
): MediaUploadResult {
  if (!result || !isObject(result)) throw invalidResponse();

  switch (purpose) {
    case 'content-preview':
      if (!isNonEmptyString(result.previewMedia)
        || !isNonEmptyString(result.previewUrl)
        || (result.kind !== 'audio' && result.kind !== 'video')
        || !isFiniteNonNegative(result.durationSeconds)
        || result.durationSeconds <= 0
        || result.durationSeconds > 30) throw invalidResponse();
      return result;
    case 'content-cover':
      if (!isNonEmptyString(result.url) || !isPositiveInteger(result.width) || !isPositiveInteger(result.height)) throw invalidResponse();
      return result;
    case 'music-audio':
      if (result.success !== true
        || !isNonEmptyString(result.fileKey)
        || !isFiniteNonNegative(result.fileSizeBytes)
        || !isNonEmptyString(result.fileFormat)
        || result.fileSizeBytes !== fileSize) throw invalidResponse();
      return result;
    case 'music-cover':
      if (result.success !== true
        || !isNonEmptyString(result.fileKey)
        || !isNonEmptyString(result.url)
        || !isFiniteNonNegative(result.fileSizeBytes)
        || !isNonEmptyString(result.fileFormat)) throw invalidResponse();
      return result;
  }
}

function reportUploadProgress(
  status: MediaUploadStatus,
  fileSize: number,
  onProgress: UploadOptions['onProgress'],
): void {
  const uploadedBytes = status.receivedChunks.reduce((total, index) => {
    const chunkStart = index * MEDIA_UPLOAD_CHUNK_BYTES;
    return total + Math.min(MEDIA_UPLOAD_CHUNK_BYTES, fileSize - chunkStart);
  }, 0);
  onProgress?.({
    stage: 'uploading',
    percent: Math.min(100, Math.floor((uploadedBytes / fileSize) * 100)),
  });
}

function reportProcessing(onProgress: UploadOptions['onProgress']): void {
  // Transfer is actually complete at this point; processing has no reliable percentage.
  onProgress?.({ stage: 'processing', percent: 100 });
}

function assertNotFailed(status: MediaUploadStatus): void {
  if (status.state === 'failed') {
    // The status error is server-controlled diagnostic text and must never be shown directly.
    throw new UploadResponseError(500);
  }
}

async function requestWithTransientRetries<T>(options: {
  execute: () => Promise<T>;
  signal?: AbortSignal;
  startedAt: number;
}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await options.execute();
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === RETRY_DELAYS_MS.length) throw error;
      remainingTimeout(options.startedAt, RETRY_DELAYS_MS[attempt]);
      await sleep(RETRY_DELAYS_MS[attempt], options.signal);
    }
  }
  throw lastError;
}

/**
 * Uploads an immutable file through the resumable media-upload protocol. It only
 * creates/upload/processes an object; callers decide whether and when to save a
 * returned token or URL in a business record.
 */
export async function uploadMedia(file: File, options: UploadOptions): Promise<MediaUploadResult> {
  if (!file || !isNonEmptyString(file.name) || !isPositiveInteger(file.size)) {
    throw new UploadResponseError(400, INVALID_REQUEST_MESSAGE);
  }
  if (file.size > MEDIA_UPLOAD_LIMITS[options.purpose]) throw new UploadResponseError(413);
  if (options.releaseId !== undefined && (!Number.isSafeInteger(options.releaseId) || options.releaseId < 1)) {
    throw new UploadResponseError(400, INVALID_REQUEST_MESSAGE);
  }
  if (options.signal?.aborted) throw abortError();

  const mimeType = mimeTypeFor(file, options.purpose);
  if (!mimeType) throw new UploadResponseError(400, INVALID_REQUEST_MESSAGE);
  const { requestId, retainedKey } = requestIdFor(file, options);

  const startedAt = Date.now();
  const chunkCount = Math.ceil(file.size / MEDIA_UPLOAD_CHUNK_BYTES);
  const statusShape = { chunkCount, fileSize: file.size };
  const makeStatus = (payload: unknown, id?: string) => parseStatus(payload, { ...statusShape, ...(id ? { id } : {}) });
  const endpointFor = (id: string) => `/api/media-uploads/${encodeURIComponent(id)}`;
  const rejectFailedStatus = (current: MediaUploadStatus) => {
    if (current.state === 'failed' && retainedKey) retainedRequestIds.delete(retainedKey);
    assertNotFailed(current);
  };
  const completedResult = (current: MediaUploadStatus) => {
    if (retainedKey) retainedRequestIds.delete(retainedKey);
    return validateResult(current.result, options.purpose, file.size);
  };

  options.onProgress?.({ stage: 'uploading', percent: 0 });

  let status: MediaUploadStatus;
  try {
    status = await requestWithTransientRetries({
      startedAt,
      signal: options.signal,
      execute: async () => makeStatus(await requestJson('/api/media-uploads/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: options.purpose,
          fileSize: file.size,
          mimeType,
          fileName: file.name,
          ...(options.releaseId === undefined ? {} : { releaseId: options.releaseId }),
          requestId,
        }),
      }, options.signal, remainingTimeout(startedAt, START_AND_COMPLETE_TIMEOUT_MS))),
    });
  } catch (error) {
    // There is no session ID to reconcile if start never produced a valid response.
    // In particular, do not create a second release/job after a network-unknown start.
    throw error;
  }

  rejectFailedStatus(status);
  reportUploadProgress(status, file.size, options.onProgress);
  if (status.state === 'done') return completedResult(status);

  const getStatus = async (id: string): Promise<MediaUploadStatus> => requestWithTransientRetries({
    startedAt,
    signal: options.signal,
    execute: async () => makeStatus(
      await requestJson(`${endpointFor(id)}/status`, { method: 'GET' }, options.signal, remainingTimeout(startedAt, STATUS_TIMEOUT_MS)),
      id,
    ),
  });

  const reconcile = async (id: string): Promise<MediaUploadStatus> => {
    if (options.signal?.aborted) throw abortError();
    const current = await getStatus(id);
    rejectFailedStatus(current);
    return current;
  };

  const uploadChunk = async (id: string, index: number): Promise<MediaUploadStatus> => {
    const chunk = file.slice(
      index * MEDIA_UPLOAD_CHUNK_BYTES,
      Math.min((index + 1) * MEDIA_UPLOAD_CHUNK_BYTES, file.size),
      'application/octet-stream',
    );
    let attempts = 0;
    while (true) {
      try {
        const next = makeStatus(await requestJson(`${endpointFor(id)}/chunks/${index}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: chunk,
        }, options.signal, remainingTimeout(startedAt, CHUNK_TIMEOUT_MS)), id);
        rejectFailedStatus(next);
        return next;
      } catch (error) {
        if (options.signal?.aborted) throw abortError();
        const reconciled = await reconcile(id);
        if (reconciled.receivedChunks.includes(index) || reconciled.state !== 'uploading') return reconciled;
        if (!isRetryableError(error) || attempts === RETRY_DELAYS_MS.length) throw error;
        await sleep(RETRY_DELAYS_MS[attempts], options.signal);
        attempts += 1;
      }
    }
  };

  const complete = async (id: string): Promise<MediaUploadStatus> => {
    let attempts = 0;
    while (true) {
      try {
        const next = makeStatus(await requestJson(`${endpointFor(id)}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, options.signal, remainingTimeout(startedAt, START_AND_COMPLETE_TIMEOUT_MS)), id);
        rejectFailedStatus(next);
        return next;
      } catch (error) {
        if (options.signal?.aborted) throw abortError();
        const reconciled = await reconcile(id);
        if (reconciled.state !== 'uploading') return reconciled;
        if (!isRetryableError(error) || attempts === RETRY_DELAYS_MS.length) throw error;
        await sleep(RETRY_DELAYS_MS[attempts], options.signal);
        attempts += 1;
      }
    }
  };

  const process = async (id: string): Promise<void> => {
    let attempts = 0;
    while (true) {
      try {
        // This endpoint intentionally has a long bounded timeout because its
        // request owns the FFmpeg/worker lifetime in a Cloud Run instance.
        const next = makeStatus(await requestJson(`${endpointFor(id)}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }, options.signal, remainingTimeout(startedAt, STATUS_TIMEOUT_MS)), id);
        rejectFailedStatus(next);
        return;
      } catch (error) {
        if (options.signal?.aborted) throw abortError();
        const reconciled = await reconcile(id);
        if (reconciled.state === 'done' || reconciled.state === 'processing') return;
        assertNotFailed(reconciled);
        if (!isRetryableError(error) || attempts === RETRY_DELAYS_MS.length) throw error;
        await sleep(RETRY_DELAYS_MS[attempts], options.signal);
        attempts += 1;
      }
    }
  };

  while (status.state === 'uploading') {
    const missingChunk = Array.from({ length: chunkCount }, (_, index) => index)
      .find((index) => !status.receivedChunks.includes(index));
    if (missingChunk === undefined) {
      status = await complete(status.id);
      continue;
    }
    status = await uploadChunk(status.id, missingChunk);
    rejectFailedStatus(status);
    reportUploadProgress(status, file.size, options.onProgress);
  }

  if (status.state === 'done') return completedResult(status);
  reportProcessing(options.onProgress);

  let processingPromise: Promise<void> | undefined;
  let processingFailure: unknown;
  const startProcessing = (id: string) => {
    if (processingPromise) return;
    processingFailure = undefined;
    const currentPromise = process(id);
    processingPromise = currentPromise;
    // Observe failure immediately. The poll loop surfaces it on its next turn,
    // avoiding an unhandled rejection if status reaches done first.
    void currentPromise.then(
      () => undefined,
      (error: unknown) => { processingFailure = error; },
    ).finally(() => {
      if (processingPromise === currentPromise) processingPromise = undefined;
    });
  };
  // complete only queues. This live request keeps the bounded server worker
  // alive while the quick status endpoint stays free for progress checks.
  startProcessing(status.id);

  while (true) {
    remainingTimeout(startedAt, STATUS_TIMEOUT_MS);
    if (processingFailure) throw processingFailure;
    status = await getStatus(status.id);
    rejectFailedStatus(status);
    if (status.state === 'done') return completedResult(status);
    if (status.state === 'uploading') {
      // A previously timed-out complete request may have been observed before its
      // transition. Resume the same server session rather than creating another.
      while (status.state === 'uploading') {
        const missingChunk = Array.from({ length: chunkCount }, (_, index) => index)
          .find((index) => !status.receivedChunks.includes(index));
        status = missingChunk === undefined
          ? await complete(status.id)
          : await uploadChunk(status.id, missingChunk);
        rejectFailedStatus(status);
      }
      if (status.state === 'done') return completedResult(status);
      reportProcessing(options.onProgress);
    }
    // If a prior process HTTP request settled while the queued state remains,
    // re-kick only this same session; the server claim CAS prevents duplicates.
    if (status.state === 'queued') startProcessing(status.id);
    await sleep(1_000, options.signal);
  }
}
