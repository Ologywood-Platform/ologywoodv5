/**
 * Image Utility Functions
 * 
 * Provides helper functions for image optimization, including:
 * - Blur-up placeholder generation
 * - Image URL validation
 * - Responsive image sizing
 */

/**
 * Generate a simple blur-up placeholder SVG
 * Used for lazy-loaded images to provide visual feedback while loading
 */
export function generateBlurPlaceholder(
  color: string = '#f3f4f6',
  width: number = 400,
  height: number = 400
): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>
    <rect fill='${color}' width='${width}' height='${height}'/>
    <filter id='blur'>
      <feGaussianBlur in='SourceGraphic' stdDeviation='10' />
    </filter>
    <circle cx='${width / 2}' cy='${height / 2}' r='${Math.min(width, height) / 4}' fill='${adjustBrightness(color, -20)}' filter='url(#blur)' opacity='0.3'/>
  </svg>`;
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}

/**
 * Adjust brightness of a hex color
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

/**
 * Generate responsive image URLs for different screen sizes
 * Useful for srcset attribute
 */
export function generateResponsiveImageUrls(baseUrl: string): {
  small: string;
  medium: string;
  large: string;
  srcSet: string;
} {
  // If using a CDN with query parameters for sizing
  const sizes = {
    small: `${baseUrl}?w=400&h=400&q=75`,
    medium: `${baseUrl}?w=800&h=800&q=80`,
    large: `${baseUrl}?w=1200&h=1200&q=85`,
  };

  const srcSet = `
    ${sizes.small} 400w,
    ${sizes.medium} 800w,
    ${sizes.large} 1200w
  `.trim();

  return {
    ...sizes,
    srcSet,
  };
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url, window.location.origin);
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(urlObj.pathname) || 
           urlObj.hostname.includes('cdn') ||
           urlObj.hostname.includes('image') ||
           urlObj.hostname.includes('s3') ||
           urlObj.hostname.includes('cloudinary');
  } catch {
    return false;
  }
}

/**
 * Get optimal image size based on container width
 */
export function getOptimalImageSize(containerWidth: number): number {
  if (containerWidth < 480) return 400;
  if (containerWidth < 768) return 600;
  if (containerWidth < 1024) return 800;
  if (containerWidth < 1280) return 1000;
  return 1200;
}

/**
 * Preload an image for better performance
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(urls: string[]): Promise<void> {
  try {
    await Promise.all(urls.map(url => preloadImage(url)));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
}
