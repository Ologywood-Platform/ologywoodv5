import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStoragePut = vi.fn();

vi.mock('../storage', () => ({
  storagePut: (...args: any[]) => mockStoragePut(...args),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('persistAvatarToS3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoragePut.mockResolvedValue({ key: 'user-avatars/123/spotify-1234.jpg', url: 'https://cdn.example.com/user-avatars/123/spotify-1234.jpg' });
  });

  it('should download image and upload to S3, returning permanent URL', async () => {
    const { persistAvatarToS3 } = await import('../utils/persistAvatar');

    const fakeImageBuffer = new ArrayBuffer(100);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string) => name === 'content-type' ? 'image/jpeg' : null },
      arrayBuffer: () => Promise.resolve(fakeImageBuffer),
    });

    const result = await persistAvatarToS3('https://external.com/photo.jpg', 123, 'spotify');

    expect(mockFetch).toHaveBeenCalledWith('https://external.com/photo.jpg', { redirect: 'follow' });
    expect(mockStoragePut).toHaveBeenCalledWith(
      expect.stringMatching(/^user-avatars\/123\/spotify-\d+\.jpg$/),
      expect.any(Buffer),
      'image/jpeg'
    );
    expect(result).toBe('https://cdn.example.com/user-avatars/123/spotify-1234.jpg');
  });

  it('should return null if external URL fetch fails (e.g. 403 expired)', async () => {
    const { persistAvatarToS3 } = await import('../utils/persistAvatar');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const result = await persistAvatarToS3('https://expired.com/photo.jpg', 456, 'google');

    expect(result).toBeNull();
    expect(mockStoragePut).not.toHaveBeenCalled();
  });

  it('should return null if S3 upload throws', async () => {
    const { persistAvatarToS3 } = await import('../utils/persistAvatar');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string) => name === 'content-type' ? 'image/png' : null },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(50)),
    });
    mockStoragePut.mockRejectedValueOnce(new Error('S3 upload failed'));

    const result = await persistAvatarToS3('https://example.com/photo.png', 789, 'spotify');

    expect(result).toBeNull();
  });

  it('should detect PNG content type and use .png extension', async () => {
    const { persistAvatarToS3 } = await import('../utils/persistAvatar');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (name: string) => name === 'content-type' ? 'image/png' : null },
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(50)),
    });
    mockStoragePut.mockResolvedValueOnce({ key: 'test', url: 'https://cdn.example.com/test.png' });

    await persistAvatarToS3('https://example.com/photo.png', 100, 'google');

    expect(mockStoragePut).toHaveBeenCalledWith(
      expect.stringMatching(/^user-avatars\/100\/google-\d+\.png$/),
      expect.any(Buffer),
      'image/png'
    );
  });
});
