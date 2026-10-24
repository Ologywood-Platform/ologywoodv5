import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadMedia } from '../client/src/lib/mediaUpload';
import { UploadResponseError } from '../client/src/lib/uploadResponse';

const chunkBytes = 1024 * 1024;
const uploadId = '00000000-0000-4000-8000-000000000001';
const requestId = '00000000-0000-4000-8000-000000000002';
const file = (size = 3, type = 'audio/mpeg', name = 'sample.mp3') => new File([new Uint8Array(size)], name, { type });

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function status(overrides: Record<string, unknown> = {}) {
  return {
    id: uploadId,
    state: 'uploading',
    receivedChunks: [],
    chunkBytes,
    chunkCount: 1,
    expiresAt: Date.now() + 60_000,
    ...overrides,
  };
}

async function body(call: Parameters<typeof fetch>[1]): Promise<Record<string, unknown>> {
  return JSON.parse(String(call?.body || '{}')) as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('uploadMedia', () => {
  it('sends binary 1 MiB chunks and only resolves after a matching done status', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json(status()))
      .mockResolvedValueOnce(json(status({ receivedChunks: [0] })))
      .mockResolvedValueOnce(json(status({ state: 'queued', receivedChunks: [0] }), 202))
      .mockResolvedValueOnce(json(status({ state: 'processing', receivedChunks: [0] })))
      .mockResolvedValueOnce(json(status({
        state: 'done',
        receivedChunks: [0],
        result: { previewMedia: 'preview-token', previewUrl: 'https://signed.example/preview', kind: 'audio', durationSeconds: 30 },
      })));
    vi.stubGlobal('fetch', fetchMock);

    const progress: Array<{ stage: string; percent: number }> = [];
    await expect(uploadMedia(file(), {
      purpose: 'content-preview',
      requestId,
      onProgress: (value) => progress.push(value),
    })).resolves.toMatchObject({ previewMedia: 'preview-token' });

    expect(fetchMock).toHaveBeenCalledTimes(5);
    const [startUrl, startRequest] = fetchMock.mock.calls[0]!;
    expect(startUrl).toBe('/api/media-uploads/start');
    expect(await body(startRequest)).toMatchObject({
      purpose: 'content-preview', fileSize: 3, mimeType: 'audio/mpeg', fileName: 'sample.mp3', requestId,
    });
    const [chunkUrl, chunkRequest] = fetchMock.mock.calls[1]!;
    expect(chunkUrl).toBe(`/api/media-uploads/${uploadId}/chunks/0`);
    expect(chunkRequest?.headers).toMatchObject({ 'Content-Type': 'application/octet-stream' });
    expect(chunkRequest?.body).toBeInstanceOf(Blob);
    expect(progress).toContainEqual({ stage: 'uploading', percent: 0 });
    expect(progress).toContainEqual({ stage: 'uploading', percent: 100 });
    expect(progress).toContainEqual({ stage: 'processing', percent: 100 });
  });

  it.each([502, 503, 504])('retries transient start HTTP %i at most twice with the same request id', async (code) => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json({ error: 'gateway' }, code))
      .mockResolvedValueOnce(json(status({
        state: 'done',
        result: { previewMedia: 'preview-token', previewUrl: 'https://signed.example/preview', kind: 'audio', durationSeconds: 30 },
      })));
    vi.stubGlobal('fetch', fetchMock);

    const retryRequestId = ({
      502: '00000000-0000-4000-8000-000000000502',
      503: '00000000-0000-4000-8000-000000000503',
      504: '00000000-0000-4000-8000-000000000504',
    } as Record<number, string>)[code]!;
    const promise = uploadMedia(file(), { purpose: 'content-preview', requestId: retryRequestId });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ previewMedia: 'preview-token' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((await body(fetchMock.mock.calls[0]?.[1])).requestId).toBe(retryRequestId);
    expect((await body(fetchMock.mock.calls[1]?.[1])).requestId).toBe(retryRequestId);
  });

  it('does not retry non-transient failures such as HTTP 413 or HTTP 500', async () => {
    for (const code of [413, 500]) {
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(json({ error: 'nope' }, code));
      vi.stubGlobal('fetch', fetchMock);
      await expect(uploadMedia(file(), { purpose: 'content-preview', requestId }))
        .rejects.toMatchObject({ status: code });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    }
  });

  it('reconciles a network-unknown chunk outcome before retrying or starting anything new', async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json(status()))
      .mockRejectedValueOnce(new TypeError('network timeout'))
      .mockResolvedValueOnce(json(status({ receivedChunks: [0] })))
      .mockResolvedValueOnce(json(status({ state: 'queued', receivedChunks: [0] }), 202))
      .mockResolvedValueOnce(json(status({ state: 'processing', receivedChunks: [0] })))
      .mockResolvedValueOnce(json(status({
        state: 'done', receivedChunks: [0],
        result: { previewMedia: 'preview-token', previewUrl: 'https://signed.example/preview', kind: 'audio', durationSeconds: 30 },
      })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadMedia(file(), { purpose: 'content-preview', requestId }))
      .resolves.toMatchObject({ previewMedia: 'preview-token' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/media-uploads/start',
      `/api/media-uploads/${uploadId}/chunks/0`,
      `/api/media-uploads/${uploadId}/status`,
      `/api/media-uploads/${uploadId}/complete`,
      `/api/media-uploads/${uploadId}/process`,
      `/api/media-uploads/${uploadId}/status`,
    ]);
  });

  it('rejects malformed terminal status payloads instead of faking success', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(json(status({
      state: 'done',
      result: { previewMedia: 'preview-token', kind: 'audio', durationSeconds: 30 },
    })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadMedia(file(), { purpose: 'content-preview', requestId }))
      .rejects.toBeInstanceOf(UploadResponseError);
  });

  it('rejects an unsupported MIME before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadMedia(file(3, 'text/plain', 'notes.txt'), {
      purpose: 'content-preview', requestId,
    })).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects oversized content-preview files before calling the API', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadMedia(file(20 * 1024 * 1024 + 1), {
      purpose: 'content-preview', requestId,
    })).rejects.toMatchObject({ status: 413 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
