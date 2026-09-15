import {
  PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS,
  type PortfolioUploadKind,
  type PortfolioUploadSessionResponse,
} from './portfolioVideoUpload';
import type { PortfolioVideoSourceFormat } from '@shared/videoPortfolioUpload';

async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { error?: string };
    return new Error(payload.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function startPerformanceUpload(input: {
  durationSeconds: number;
  sourceFormat: PortfolioVideoSourceFormat;
  videoSize: number;
  thumbnailSize: number;
  videoMimeType: string;
  thumbnailMimeType: string;
}): Promise<PortfolioUploadSessionResponse> {
  const response = await fetch('/api/video/performance/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw await readError(response, 'Could not start the Performance Video upload');
  return response.json() as Promise<PortfolioUploadSessionResponse>;
}

export function uploadPerformanceChunk(options: {
  token: string;
  kind: PortfolioUploadKind;
  index: number;
  chunk: Blob;
  onProgress?: (loaded: number, total: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) options.onProgress?.(event.loaded, event.total);
    });
    xhr.addEventListener('load', () => {
      let payload: { error?: string } = {};
      try { payload = JSON.parse(xhr.responseText); } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(payload.error || 'Could not upload part of the Performance Video'));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during Performance Video upload')));
    xhr.addEventListener('abort', () => reject(new Error('Performance Video upload was cancelled')));
    xhr.addEventListener('timeout', () => reject(new Error('The Performance Video upload timed out. Check your connection and try again.')));
    xhr.timeout = PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS;
    xhr.open('POST', '/api/video/performance/chunk');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('x-performance-upload-token', options.token);
    xhr.setRequestHeader('x-performance-upload-kind', options.kind);
    xhr.setRequestHeader('x-performance-upload-index', String(options.index));
    xhr.send(options.chunk);
  });
}

export async function finalizePerformanceUpload(token: string): Promise<void> {
  const response = await fetch('/api/video/performance/finalize', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw await readError(response, 'Could not finish the Performance Video upload');
}
