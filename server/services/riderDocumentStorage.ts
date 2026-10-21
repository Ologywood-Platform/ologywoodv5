import { storageGet } from '../storage';

export const MAX_ENCRYPTED_RIDER_BYTES = 10 * 1024 * 1024 + 28;
export function isTrustedRiderObjectSource(source: string, expectedKey: string): boolean {
  try {
    if (!/^private\/rider-documents\/[1-9]\d*\/[A-Za-z0-9-]{1,128}\.bin$/.test(expectedKey)) return false;
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    const host = url.hostname.toLowerCase();
    if (!host.endsWith('.cloudfront.net') && !host.endsWith('.manuscdn.com')) return false;
    return decodeURIComponent(url.pathname).endsWith('/' + expectedKey);
  } catch { return false; }
}

/** Caller-owned authorization is held/rechecked separately. This helper returns ciphertext only. */
export async function fetchEncryptedRiderObject(
  storageKey: string,
  ports: { get: typeof storageGet; fetch: typeof fetch } = { get: storageGet, fetch },
): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let abortLookup: (() => void) | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => { abortLookup = () => reject(new Error('Private object lookup timed out')); controller.signal.addEventListener('abort', abortLookup, { once: true }); });
    // Only the provider URL lookup is raced, never a transaction or database work.
    const { url } = await Promise.race([ports.get(storageKey), timeout]);
    if (!isTrustedRiderObjectSource(url, storageKey)) throw new Error('Invalid private object source');
    const response = await ports.fetch(url, { redirect: 'error', signal: controller.signal });
    if (!response.ok || !response.body) throw new Error('Private object unavailable');
    const declared = Number(response.headers.get('content-length') ?? 0);
    if (Number.isFinite(declared) && declared > MAX_ENCRYPTED_RIDER_BYTES) throw new Error('Private object too large');
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_ENCRYPTED_RIDER_BYTES) {
          controller.abort();
          await reader.cancel();
          throw new Error('Private object too large');
        }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    if (total <= 28) throw new Error('Private object unavailable');
    return Buffer.concat(chunks, total);
  } finally { clearTimeout(timer); if (abortLookup) controller.signal.removeEventListener('abort', abortLookup); controller.abort(); }
}
