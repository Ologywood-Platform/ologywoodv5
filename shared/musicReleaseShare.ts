export const MUSIC_RELEASE_PUBLIC_ORIGIN = 'https://www.ologywood.com';
export function musicReleasePath(title: string, id: number): string {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid music release ID');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'single';
  return `/music/${slug}-${id}`;
}
export function parseMusicReleaseId(value: string): number | null {
  const match = value.match(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*-)?([1-9]\d*)$/);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
export type MusicShareDetails = { id: number; title: string; artistName: string; description?: string | null; priceInCents: number; currency?: string; allowPayWhatYouWant?: boolean };
export function musicReleasePrice(details: Pick<MusicShareDetails, 'priceInCents' | 'currency' | 'allowPayWhatYouWant'>): string {
  const currency = /^[A-Za-z]{3}$/.test(details.currency || '') ? details.currency!.toUpperCase() : 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(details.priceInCents / 100) + (details.allowPayWhatYouWant ? ' or more' : '');
}
export function musicReleaseShareDetails(item: MusicShareDetails) {
  const url = MUSIC_RELEASE_PUBLIC_ORIGIN + musicReleasePath(item.title, item.id);
  const text = `${item.title} by ${item.artistName || 'OlogyWood Creator'} — ${musicReleasePrice(item)}. Preview and support this single on OlogyWood.`;
  const encode = encodeURIComponent;
  return { url, text, social: {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encode(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encode(url)}&text=${encode(text)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
    whatsapp: `https://wa.me/?text=${encode(text+' '+url)}`,
    email: `mailto:?subject=${encode(item.title+' on OlogyWood')}&body=${encode(text+'\n\n'+url)}`,
    sms: `sms:?body=${encode(text+' '+url)}`,
  }};
}
