import { EDU_SHARE_TITLE, EDU_SHARE_DESCRIPTION, EDU_SHARE_URL, EDU_SHARE_IMAGE, EDU_SHARE_IMAGE_ALT } from '../../shared/eduShare';

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Preserve the existing application shell, scripts, style links and runtime.
 * Only the public EDU landing route receives this replacement. */
export function injectEduShareMeta(html: string): string {
  if (!/<\/head\s*>/i.test(html)) throw new Error('EDU shell is missing its head boundary');
  const metadata = `
  <title>${escape(EDU_SHARE_TITLE)}</title>
  <meta name="description" content="${escape(EDU_SHARE_DESCRIPTION)}" />
  <link rel="canonical" href="${EDU_SHARE_URL}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OlogyWood" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content="${escape(EDU_SHARE_TITLE)}" />
  <meta property="og:description" content="${escape(EDU_SHARE_DESCRIPTION)}" />
  <meta property="og:url" content="${EDU_SHARE_URL}" />
  <meta property="og:image" content="${EDU_SHARE_IMAGE}" />
  <meta property="og:image:secure_url" content="${EDU_SHARE_IMAGE}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escape(EDU_SHARE_IMAGE_ALT)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ologywood" />
  <meta name="twitter:title" content="${escape(EDU_SHARE_TITLE)}" />
  <meta name="twitter:description" content="${escape(EDU_SHARE_DESCRIPTION)}" />
  <meta name="twitter:url" content="${EDU_SHARE_URL}" />
  <meta name="twitter:image" content="${EDU_SHARE_IMAGE}" />
  <meta name="twitter:image:alt" content="${escape(EDU_SHARE_IMAGE_ALT)}" />
`;
  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, tag => /\b(?:name|property)\s*=\s*["'](?:description|og:[^"']+|twitter:[^"']+)["']/i.test(tag) ? '' : tag)
    .replace(/<link\b[^>]*>/gi, tag => /\brel\s*=\s*["']canonical["']/i.test(tag) ? '' : tag)
    .replace(/<\/head\s*>/i, () => `${metadata}</head>`);
}
