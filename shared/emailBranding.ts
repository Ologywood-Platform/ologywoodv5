export const EMAIL_LOGO_URL = 'https://www.ologywood.com/manus-storage/ologywood-email-logo-2026_0b47af54.png';
export const EMAIL_LOGO_ALT = 'OlogyWood neon OW logo';

export function getEmailLogoImage(options: {
  size?: number;
  marginBottom?: number;
  className?: string;
} = {}): string {
  const { size = 88, marginBottom = 10, className } = options;
  const classAttribute = className ? ` class="${className}"` : '';

  return `<img src="${EMAIL_LOGO_URL}" alt="${EMAIL_LOGO_ALT}" width="${size}" height="${size}"${classAttribute} style="display: block; width: ${size}px; height: ${size}px; max-width: ${size}px; margin: 0 auto ${marginBottom}px auto; border: 0; border-radius: 20%; object-fit: contain;" />`;
}
