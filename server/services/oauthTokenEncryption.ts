import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || process.env.OAUTH_TOKEN_ENCRYPTION_KEY || process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error('OAuth token encryption is not configured');
  }
  return Buffer.from(secret, 'hex');
}

/**
 * Encrypt a provider token for database storage. Empty values stay empty so
 * optional refresh tokens preserve the existing schema contract.
 */
export function encryptOAuthToken(token: string): string {
  if (!token) return token;
  if (token.startsWith(PREFIX)) return token;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

/**
 * Decrypt a token written by encryptOAuthToken. Legacy plaintext rows remain
 * readable so an existing calendar connection is not broken during rollout;
 * every new OAuth callback and refresh writes ciphertext.
 */
export function decryptOAuthToken(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const encoded = value.slice(PREFIX.length).split('.');
  if (encoded.length !== 3) throw new Error('Malformed encrypted OAuth token');
  const [ivEncoded, tagEncoded, ciphertextEncoded] = encoded;
  const iv = Buffer.from(ivEncoded, 'base64url');
  const tag = Buffer.from(tagEncoded, 'base64url');
  const ciphertext = Buffer.from(ciphertextEncoded, 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0) {
    throw new Error('Malformed encrypted OAuth token');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function isEncryptedOAuthToken(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}
