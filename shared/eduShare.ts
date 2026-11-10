/** Public, viewer-independent EDU sharing metadata. Never derive these URLs from Host. */
export const EDU_SHARE_TITLE = 'OlogyWood EDU — The Next Generation of Entertainment Starts Here';
export const EDU_SHARE_DESCRIPTION = 'A creative-business launchpad for students and school pilots. Build a profile, showcase work, connect with creators, and explore direct-to-fan opportunities on OlogyWood EDU.';
export const EDU_SHARE_URL = 'https://www.ologywood.com/edu';
export const EDU_SHARE_IMAGE = 'https://www.ologywood.com/manus-storage/ologywood-edu-share-1200x630_ae0fddac.png';
export const EDU_SHARE_IMAGE_ALT = 'OlogyWood EDU — The next generation of entertainment starts here. Create. Connect. Showcase. Grow.';
export const EDU_SHARE_TEXT = 'Build your creative future with OlogyWood EDU. Create. Connect. Showcase. Grow.';
export const EDU_SOCIAL_LINKS = {
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(EDU_SHARE_URL)}`,
  x: `https://x.com/intent/tweet?text=${encodeURIComponent(EDU_SHARE_TEXT)}&url=${encodeURIComponent(EDU_SHARE_URL)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(EDU_SHARE_URL)}`,
} as const;
export function isEduLandingPath(pathname: string): boolean {
  return pathname === '/edu' || pathname === '/edu/';
}
