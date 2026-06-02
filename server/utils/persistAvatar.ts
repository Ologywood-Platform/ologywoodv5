/**
 * Download an OAuth provider avatar and persist it to S3.
 * Returns the permanent S3 CDN URL, or null if download fails.
 */
import { storagePut } from '../storage';

export async function persistAvatarToS3(
  externalUrl: string,
  userId: number | string,
  provider: string
): Promise<string | null> {
  try {
    const response = await fetch(externalUrl, { redirect: 'follow' });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine file extension from content type
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    const fileKey = `user-avatars/${userId}/${provider}-${Date.now()}.${ext}`;
    const { url } = await storagePut(fileKey, buffer, contentType);

    return url;
  } catch (error) {
    console.error(`[persistAvatar] Failed to persist avatar for user ${userId}:`, error);
    return null;
  }
}
