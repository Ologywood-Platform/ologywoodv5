import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PREFIX = 'enc:v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const secret = process.env.PRIVATE_DATA_ENCRYPTION_KEY || process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new Error('Private data encryption is not configured');
  }
  return Buffer.from(secret, 'hex');
}

export function encryptPrivateData(value: string): string {
  if (!value) return value;
  if (value.startsWith(PREFIX)) return value;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${PREFIX}${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

/** Legacy plaintext is intentionally readable during the migration window. */
export function decryptPrivateData(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const parts = value.slice(PREFIX.length).split('.');
  if (parts.length !== 3) throw new Error('Malformed encrypted private data');
  const [ivEncoded, tagEncoded, ciphertextEncoded] = parts;
  const iv = Buffer.from(ivEncoded, 'base64url');
  const tag = Buffer.from(tagEncoded, 'base64url');
  const ciphertext = Buffer.from(ciphertextEncoded, 'base64url');
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || ciphertext.length === 0) {
    throw new Error('Malformed encrypted private data');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function isEncryptedPrivateData(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(PREFIX));
}
