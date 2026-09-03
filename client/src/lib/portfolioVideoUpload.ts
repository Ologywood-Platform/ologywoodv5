import {
  getPortfolioVideoMimeType,
  getPortfolioVideoSourceFormat,
  type PortfolioVideoSourceFormat,
} from '@shared/videoPortfolioUpload';

export const PORTFOLIO_VIDEO_READ_TIMEOUT_MS = 20 * 1000;
export const PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS = 3 * 60 * 1000;

export type PortfolioUploadKind = 'video' | 'thumbnail';

export type PortfolioUploadSessionResponse = {
  token: string;
  expiresAt: number;
  chunkBytes: number;
  videoChunkCount: number;
  thumbnailChunkCount: number;
  requiresConversion: boolean;
};

export type PreparedPortfolioVideo = {
  file: File;
  relabeledMov: boolean;
};

/**
 * Chromium does not decode otherwise browser-compatible H.264/AAC MOV files
 * when the File is labelled video/quicktime. The ISO Base Media bytes do not
 * need transcoding: presenting the same immutable Blob as video/mp4 lets the
 * browser read metadata, capture a thumbnail, upload, and later play it.
 */
export function preparePortfolioVideoForBrowser(file: File): PreparedPortfolioVideo {
  const isMov = file.type.toLowerCase() === 'video/quicktime' || /\.mov$/i.test(file.name);
  if (!isMov) return { file, relabeledMov: false };

  const baseName = file.name.replace(/\.mov$/i, '') || 'portfolio-video';
  return {
    file: new File([file], `${baseName}.mp4`, {
      type: 'video/mp4',
      lastModified: file.lastModified,
    }),
    relabeledMov: true,
  };
}

export function preparePortfolioVideoForServerConversion(
  file: File,
  format?: PortfolioVideoSourceFormat,
): { file: File; sourceFormat: PortfolioVideoSourceFormat } {
  const sourceFormat = format || getPortfolioVideoSourceFormat(file.name, file.type);
  if (!sourceFormat) throw new Error('Choose an MP4, MOV, WebM, AVI, or MKV video file.');
  const expectedMimeType = getPortfolioVideoMimeType(sourceFormat);
  if (file.type === expectedMimeType) return { file, sourceFormat };
  return {
    sourceFormat,
    file: new File([file], file.name, { type: expectedMimeType, lastModified: file.lastModified }),
  };
}

export const MOV_BROWSER_COMPATIBILITY_ERROR =
  'This MOV uses a video format your browser cannot process. OlogyWood will try to convert it, or you can export it as an H.264 video with AAC audio in an MP4 file.';

async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { error?: string };
    return new Error(payload.error || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function startPortfolioUpload(input: {
  title: string;
  category: string;
  durationSeconds: number;
  sourceFormat: PortfolioVideoSourceFormat;
  videoSize: number;
  thumbnailSize: number;
  videoMimeType: string;
  thumbnailMimeType: string;
}): Promise<PortfolioUploadSessionResponse> {
  const response = await fetch('/api/video/portfolio/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw await readError(response, 'Could not start the video upload');
  return response.json() as Promise<PortfolioUploadSessionResponse>;
}

export function getPortfolioUploadChunks(blob: Blob, chunkBytes: number): Blob[] {
  if (!Number.isInteger(chunkBytes) || chunkBytes < 1) throw new Error('Invalid upload chunk size');
  const chunks: Blob[] = [];
  for (let start = 0; start < blob.size; start += chunkBytes) {
    chunks.push(blob.slice(start, Math.min(start + chunkBytes, blob.size), 'application/octet-stream'));
  }
  return chunks;
}

export function uploadPortfolioChunk(options: {
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
      else reject(new Error(payload.error || 'Could not upload part of the video'));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during video upload')));
    xhr.addEventListener('abort', () => reject(new Error('Video upload was cancelled')));
    xhr.addEventListener('timeout', () => reject(new Error('The video upload timed out. Check your connection and try again.')));
    xhr.timeout = PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS;
    xhr.open('POST', '/api/video/portfolio/chunk');
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('x-portfolio-upload-token', options.token);
    xhr.setRequestHeader('x-portfolio-upload-kind', options.kind);
    xhr.setRequestHeader('x-portfolio-upload-index', String(options.index));
    xhr.send(options.chunk);
  });
}

export async function finalizePortfolioUpload(token: string): Promise<void> {
  const response = await fetch('/api/video/portfolio/finalize', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(PORTFOLIO_UPLOAD_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw await readError(response, 'Could not finish the video upload');
}
