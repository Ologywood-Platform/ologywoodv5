import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEncryptedRiderObject, isTrustedRiderObjectSource, MAX_ENCRYPTED_RIDER_BYTES } from './services/riderDocumentStorage';
const key='private/rider-documents/7/synthetic.bin';
const source='https://synthetic.cloudfront.net/project/'+key;
afterEach(()=>vi.useRealTimers());
describe('private rider ciphertext storage bounds',()=>{
 it('accepts only HTTPS storage CDN origins and the exact private key namespace',()=>{
  expect(isTrustedRiderObjectSource(source,key)).toBe(true);
  for(const url of ['http://synthetic.cloudfront.net/'+key,'https://evil.example/'+key,'https://synthetic.cloudfront.net/'+key+'-other','https://user:pass@synthetic.cloudfront.net/'+key,'https://synthetic.cloudfront.net:444/'+key])expect(isTrustedRiderObjectSource(url,key)).toBe(false);
  expect(isTrustedRiderObjectSource(source,'private/rider-documents/7/../synthetic.bin')).toBe(false);
 });
 it('streams valid ciphertext and uses abortable fetch with redirects rejected',async()=>{
  const bytes=Buffer.alloc(100,7),request=vi.fn(async()=>new Response(bytes));
  await expect(fetchEncryptedRiderObject(key,{get:vi.fn(async()=>({url:source,key})),fetch:request as any})).resolves.toEqual(bytes);
  const options=request.mock.calls[0][1] as RequestInit;expect(options.redirect).toBe('error');expect(options.signal).toBeInstanceOf(AbortSignal);expect(options.signal?.aborted).toBe(true);
 });
 it('rejects an untrusted source before any network fetch',async()=>{
  const request=vi.fn();await expect(fetchEncryptedRiderObject(key,{get:vi.fn(async()=>({url:'https://evil.example/'+key,key})),fetch:request})).rejects.toThrow();expect(request).not.toHaveBeenCalled();
 });
 it('rejects a forged large content-length before buffering',async()=>{
  const response=new Response(Buffer.alloc(100),{headers:{'content-length':String(MAX_ENCRYPTED_RIDER_BYTES+1)}});
  await expect(fetchEncryptedRiderObject(key,{get:vi.fn(async()=>({url:source,key})),fetch:vi.fn(async()=>response) as any})).rejects.toThrow('too large');
 });
 it('rejects oversized chunked data even when content-length is absent',async()=>{
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(MAX_ENCRYPTED_RIDER_BYTES));controller.enqueue(new Uint8Array(1));controller.close();}});
  await expect(fetchEncryptedRiderObject(key,{get:vi.fn(async()=>({url:source,key})),fetch:vi.fn(async()=>new Response(body)) as any})).rejects.toThrow('too large');
 });
 it('bounds provider URL lookup without racing any database transaction',async()=>{
  vi.useFakeTimers();const request=vi.fn();const operation=fetchEncryptedRiderObject(key,{get:vi.fn(()=>new Promise(()=>{})),fetch:request});
  const rejected=expect(operation).rejects.toThrow('timed out');await vi.advanceTimersByTimeAsync(10_000);await rejected;expect(request).not.toHaveBeenCalled();expect(vi.getTimerCount()).toBe(0);
 });
});
