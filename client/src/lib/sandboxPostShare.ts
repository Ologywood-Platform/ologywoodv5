export interface SandboxPostShareDetails {
  artistName: string;
  content: string;
  url: string;
}

export function buildSandboxPostShareText(details: SandboxPostShareDetails): string {
  const excerpt = details.content.replace(/\s+/g, ' ').trim().slice(0, 180);
  return `${excerpt}${details.content.length > excerpt.length ? '…' : ''} — ${details.artistName}'s Sandbox Post on OlogyWood`;
}

export function buildSandboxPostShareUrls(details: SandboxPostShareDetails) {
  const text = buildSandboxPostShareText(details);
  const encodedUrl = encodeURIComponent(details.url);
  const encodedText = encodeURIComponent(text);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${details.url}`)}`,
    email: `mailto:?subject=${encodeURIComponent(`${details.artistName}'s Sandbox Post`)}&body=${encodeURIComponent(`${text}\n\n${details.url}`)}`,
    sms: `sms:?&body=${encodeURIComponent(`${text} ${details.url}`)}`,
  };
}
