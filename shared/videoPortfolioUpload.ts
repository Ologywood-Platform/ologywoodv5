export const PORTFOLIO_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const PORTFOLIO_VIDEO_MAX_DURATION_SECONDS = 120;
export const PORTFOLIO_VIDEO_FORMATS = ['mp4', 'mov', 'webm', 'avi', 'mkv'] as const;
export type PortfolioVideoSourceFormat = typeof PORTFOLIO_VIDEO_FORMATS[number];

export const PORTFOLIO_VIDEO_FORMAT_LABEL = 'MP4, MOV, WebM, AVI, or MKV';
export const PORTFOLIO_VIDEO_ACCEPT = '.mp4,.mov,.webm,.avi,.mkv,video/mp4,video/quicktime,video/webm,video/x-msvideo,video/avi,video/x-matroska,video/mkv';

const MIME_BY_FORMAT: Record<PortfolioVideoSourceFormat, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
};

const FORMAT_BY_MIME: Record<string, PortfolioVideoSourceFormat> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-msvideo': 'avi',
  'video/avi': 'avi',
  'video/msvideo': 'avi',
  'video/x-matroska': 'mkv',
  'video/mkv': 'mkv',
};

export function getPortfolioVideoSourceFormat(fileName: string, mimeType = ''): PortfolioVideoSourceFormat | null {
  const extension = fileName.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (extension) return PORTFOLIO_VIDEO_FORMATS.includes(extension as PortfolioVideoSourceFormat)
    ? extension as PortfolioVideoSourceFormat
    : null;
  return FORMAT_BY_MIME[mimeType.trim().toLowerCase()] || null;
}

export function getPortfolioVideoMimeType(format: PortfolioVideoSourceFormat): string {
  return MIME_BY_FORMAT[format];
}

export function portfolioVideoRequiresConversion(format: PortfolioVideoSourceFormat): boolean {
  return format === 'avi' || format === 'mkv' || format === 'mov';
}

export function formatPortfolioFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getPortfolioFileValidationError(file: { name: string; type?: string; size: number }): string | null {
  const format = getPortfolioVideoSourceFormat(file.name, file.type || '');
  if (!format) return `“${file.name}” is not a supported video. Choose ${PORTFOLIO_VIDEO_FORMAT_LABEL}.`;
  if (file.size > PORTFOLIO_VIDEO_MAX_BYTES) {
    return `This file is ${formatPortfolioFileSize(file.size)}. Video Portfolio uploads must be 100 MB or smaller.`;
  }
  if (file.size < 1) return 'This video file is empty. Choose a different file.';
  return null;
}

export function formatPortfolioDuration(seconds: number): string {
  const rounded = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${String(rounded % 60).padStart(2, '0')}`;
}
