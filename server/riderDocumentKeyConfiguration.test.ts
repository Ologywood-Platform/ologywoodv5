import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ENV } from './_core/env';
import { encryptRiderDocumentBytes, decryptRiderDocumentBytes } from './services/riderDocumentService';
const originalKey=process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;
const originalLoginSecret=ENV.cookieSecret;
const realConfiguration=process.env.VALIDATE_RIDER_KEY_CONFIGURATION==='1';
beforeEach(()=>{if(!realConfiguration)process.env.RIDER_DOCUMENT_ENCRYPTION_KEY='33'.repeat(32);});
afterEach(()=>{if(originalKey===undefined)delete process.env.RIDER_DOCUMENT_ENCRYPTION_KEY;else process.env.RIDER_DOCUMENT_ENCRYPTION_KEY=originalKey;ENV.cookieSecret=originalLoginSecret;});
describe('persistent private rider encryption configuration',()=>{
 it('has a valid 256-bit key and encrypts/decrypts without storage or database operations',()=>{
  // Assertions intentionally report only validity, never secret contents.
  expect(/^[a-fA-F0-9]{64}$/.test(process.env.RIDER_DOCUMENT_ENCRYPTION_KEY??'')).toBe(true);
  const plain=Buffer.from('synthetic key configuration check');const key='private/rider-documents/7/config-check.bin';
  const encrypted=encryptRiderDocumentBytes(plain,7,key);expect(decryptRiderDocumentBytes(encrypted,7,key)).toEqual(plain);
 });
 it('keeps retained files readable when login/session credentials rotate',()=>{
  const plain=Buffer.from('synthetic retained version');const key='private/rider-documents/7/rotation-check.bin';
  const encrypted=encryptRiderDocumentBytes(plain,7,key);ENV.cookieSecret='different-synthetic-login-secret';expect(decryptRiderDocumentBytes(encrypted,7,key)).toEqual(plain);
 });
 it('rejects missing/malformed dedicated keys rather than falling back to login credentials',()=>{
  for(const value of ['', 'short', 'gg'.repeat(32)]){
   process.env.RIDER_DOCUMENT_ENCRYPTION_KEY=value;
   expect(()=>encryptRiderDocumentBytes(Buffer.from('synthetic'),7,'private/rider-documents/7/config-check.bin')).toThrow();
  }
 });
});
