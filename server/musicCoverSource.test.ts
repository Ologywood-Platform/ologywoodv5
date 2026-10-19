import { describe, expect, it } from 'vitest';
import { isTrustedMusicCoverSource } from './services/musicCoverSource';
const key='releases/covers/7/123-cover.png';
describe('single cover storage sources',()=>{
 it('accepts storage-resolved HTTPS CloudFront URLs for the exact current uploaded cover',()=>{
  expect(isTrustedMusicCoverSource('https://d111111.cloudfront.net/project/'+key+'?Signature=synthetic',key)).toBe(true);
  expect(isTrustedMusicCoverSource('https://files.manuscdn.com/project/'+key,key)).toBe(true);
  expect(isTrustedMusicCoverSource('https://www.ologywood.com/manus-storage/'+key,key)).toBe(true);
 });
 it.each([
  'http://d111111.cloudfront.net/project/'+key,
  'https://attacker.invalid/'+key,
  'https://d111111.cloudfront.net.attacker.invalid/'+key,
  'https://127.0.0.1/'+key,
  'https://169.254.169.254/'+key,
  'https://user:pass@d111111.cloudfront.net/project/'+key,
  'https://d111111.cloudfront.net:8443/project/'+key,
  'https://d111111.cloudfront.net/project/releases/audio/7/song.mp3',
  'https://d111111.cloudfront.net/project/releases/covers/7/fake.mp3',
  'https://d111111.cloudfront.net/project/releases/covers/7/../private.png',
  'https://www.ologywood.com/api/redirect/'+key,
  'data:image/png;base64,fake',
  '/'+key,
 ])('rejects arbitrary, private, redirected, credentialed, and non-cover sources %s',url=>expect(isTrustedMusicCoverSource(url,key)).toBe(false));
 it('rejects a cover URL for another object even on a trusted CDN',()=>{
  expect(isTrustedMusicCoverSource('https://d111111.cloudfront.net/project/releases/covers/8/other.png',key)).toBe(false);
 });
});
