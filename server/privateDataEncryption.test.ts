import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { decryptPrivateData, encryptPrivateData, isEncryptedPrivateData } from './services/privateDataEncryption';

const originalKey = process.env.PRIVATE_DATA_ENCRYPTION_KEY;
const originalRiderKey = process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.PRIVATE_DATA_ENCRYPTION_KEY;
  else process.env.PRIVATE_DATA_ENCRYPTION_KEY = originalKey;
  if (originalRiderKey === undefined) delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
  else process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = originalRiderKey;
});

describe('private signature data encryption', () => {
  it('round-trips drawn and typed signature payloads without storing plaintext', () => {
    process.env.PRIVATE_DATA_ENCRYPTION_KEY = '88'.repeat(32);
    const drawn = encryptPrivateData('data:image/png;base64,private-signature');
    const typed = encryptPrivateData('Signer Legal Name');
    expect(isEncryptedPrivateData(drawn)).toBe(true);
    expect(isEncryptedPrivateData(typed)).toBe(true);
    expect(drawn).not.toContain('private-signature');
    expect(typed).not.toContain('Signer Legal Name');
    expect(decryptPrivateData(drawn)).toBe('data:image/png;base64,private-signature');
    expect(decryptPrivateData(typed)).toBe('Signer Legal Name');
  });

  it('keeps legacy signature rows readable during migration and fails closed for new writes without a key', () => {
    delete process.env.PRIVATE_DATA_ENCRYPTION_KEY;
    delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
    expect(decryptPrivateData('legacy-signature-value')).toBe('legacy-signature-value');
    expect(() => encryptPrivateData('new-signature-value')).toThrow(/not configured/i);
  });

  it('uses the configured rider key as an operational fallback when the dedicated key is absent', () => {
    delete process.env.PRIVATE_DATA_ENCRYPTION_KEY;
    process.env.RIDER_DOCUMENT_ENCRYPTION_KEY = '99'.repeat(32);
    const encrypted = encryptPrivateData('signature');
    expect(decryptPrivateData(encrypted)).toBe('signature');
  });

  it('keeps both DB signature tables behind encryption/decryption helpers', () => {
    const db = readFileSync('server/db.ts', 'utf8');
    expect(db).toContain('signatureData: encryptPrivateData(data.signatureData)');
    expect(db).toContain('return rows.map(decryptSignature)');
    expect(db).toContain('signatureData: encryptPrivateData(data.signatureData),');
    expect(db).toContain('return rows.map(decryptVenueContractSignature)');
  });

  it('makes legacy remediation dry-run by default and owner-gated for writes', () => {
    const script = readFileSync('scripts/reencrypt-sensitive-data.ts', 'utf8');
    expect(script).toContain("const apply = process.argv.includes('--apply');");
    expect(script).toContain("ALLOW_PRIVATE_DATA_REENCRYPTION === '1'");
    expect(script).toContain("mode: apply ? 'apply' : 'dry-run'");
    expect(script).not.toMatch(/\.delete\(/);
  });
});
