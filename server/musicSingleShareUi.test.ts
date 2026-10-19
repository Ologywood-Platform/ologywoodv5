import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { musicReleasePath, parseMusicReleaseId, musicReleaseShareDetails, musicReleasePrice } from '../shared/musicReleaseShare';
import { getCanonicalNavigationAnswer, MUSIC_SINGLE_MANAGEMENT_GUIDANCE, MUSIC_UPLOAD_GUIDANCE, SINGLE_ORDER_GUIDANCE } from './routers/aiChat';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

describe('individual uploaded single sharing',()=>{
 it('uses readable collision-safe stable IDs and handles punctuation/Unicode',()=>{
  expect(musicReleasePath('Keep Pushin! (Single)',123)).toBe('/music/keep-pushin-single-123');
  expect(musicReleasePath('🎵',123)).toBe('/music/single-123');
  expect(musicReleasePath('A'.repeat(65),123)).toBe('/music/'+ 'a'.repeat(60)+'-123');
  expect(parseMusicReleaseId('old-title-123')).toBe(123);
  expect(parseMusicReleaseId('123')).toBe(123);
 });
 it.each(['0','-1','one-0','one-01','1.2','single-12<script>','http://evil/12','9007199254740992','one-1/2',''])('rejects invalid public identifiers %s',id=>expect(parseMusicReleaseId(id)).toBeNull());
 it('validates positive safe numeric IDs when building links',()=>{
  for(const id of [0,-1,1.1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])expect(()=>musicReleasePath('Single',id)).toThrow();
 });
 it('uses public canonical links and escaped social/mail/text parameters only',()=>{
  const item={id:5,title:'A & B <Single>',artistName:'Creator? & name',priceInCents:150,allowPayWhatYouWant:true};
  const details=musicReleaseShareDetails(item);
  expect(details.url).toBe('https://www.ologywood.com/music/a-b-single-5');
  expect(musicReleasePrice(item)).toBe('$1.50 or more');
  expect(musicReleasePrice({...item,currency:'eur',allowPayWhatYouWant:false})).toBe('€1.50');
  expect(new URL(details.social.facebook).searchParams.get('u')).toBe(details.url);
  expect(new URL(details.social.x).searchParams.get('text')).toBe(details.text);
  expect(new URL(details.social.whatsapp).searchParams.get('text')).toBe(details.text+' '+details.url);
  expect(details.social.email).toContain('mailto:?subject=');
  expect(details.social.sms).toContain('sms:?body=');
  for(const url of Object.values(details.social))expect(url).not.toMatch(/audioFileKey|download|checkout|\.mp3/);
 });
 it('sharing is explicit and cannot fetch private files or send fan marketing',()=>{
  const source=read('client/src/components/MusicReleaseShareButton.tsx');
  expect(source).not.toMatch(/useMutation|useQuery|fetch\(|sendArtistUpdate|audioFileKey|previewFileKey/);
  expect(source).toContain('navigator.clipboard.writeText(details.url)');
  expect(source).toContain('navigator.share({ title: release.title, text: details.text, url: details.url })');
  expect(source).toContain("error.name === 'AbortError'");
  expect(source).toContain("if (!document.execCommand('copy')) throw");
  expect(source).toContain('Nothing is posted or emailed automatically.');
  expect(source).toContain('Single share link');
 });
 it('uses safe text rendering and mobile scroll/layering for shared descriptions',()=>{
  const source=read('client/src/components/MusicReleaseShareButton.tsx');
  expect(source).toContain('{release.description}');
  expect(source).not.toContain('dangerouslySetInnerHTML');
  expect(source).toContain('z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto');
  expect(source).toContain('object-contain');
 });
 it('adds public sharing without changing existing card preview/checkout/download paths',()=>{
  const source=read('client/src/components/ReleaseCard.tsx');
  for(const text of ['<MusicReleaseShareButton', '/api/release/download/preview/${release.id}', "fetch('/api/release/checkout'", '/api/release/download/${purchaseId}', 'PREVIEW_MAX_SECONDS = 30'])expect(source).toContain(text);
  expect(source).toContain('musicReleasePath(release.title, release.id)');
 });
 it('adds only a content route, public DTO, and safe not-found/retry page with one header',()=>{
  const page=read('client/src/pages/MusicSingle.tsx');
  expect(read('client/src/App.tsx')).toContain('<Route path="/music/:slug">');
  expect(page.match(/<SiteHeader/g)).toHaveLength(1);
  expect(page).toContain('getPublicSingle.useQuery');
  expect(page).toContain('enabled: id !== null');
  expect(page).toContain('single.error?.data?.code');
  expect(page).toContain('navigate(path, { replace: true })');
  expect(page).not.toContain('audioFileKey');
  expect(page).toContain('showDescription={false} showDetailsLink={false}');
 });
 it.each(['Can I share my single release?','How do I edit my published song description?','Add description to my music release','Clear the single description'])('provides deterministic management help: %s',text=>expect(getCanonicalNavigationAnswer(text)).toBe(MUSIC_SINGLE_MANAGEMENT_GUIDANCE));
 it('preserves existing ordering/upload help and explains boundaries',()=>{
  expect(getCanonicalNavigationAnswer('Reorder singles')).toBe(SINGLE_ORDER_GUIDANCE);
  expect(getCanonicalNavigationAnswer('Where do I upload a downloadable song?')).toBe(MUSIC_UPLOAD_GUIDANCE);
  expect(MUSIC_SINGLE_MANAGEMENT_GUIDANCE).toContain('A published single stays live');
  expect(MUSIC_SINGLE_MANAGEMENT_GUIDANCE).toContain('full song or a private download URL');
 });
});
