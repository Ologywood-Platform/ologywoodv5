import {
  PORTFOLIO_VIDEO_ACCEPT,
  PORTFOLIO_VIDEO_FORMAT_LABEL,
  formatPortfolioDuration,
  formatPortfolioFileSize,
  getPortfolioVideoSourceFormat,
} from './videoPortfolioUpload';

export const PERFORMANCE_VIDEO_MAX_BYTES = 500 * 1024 * 1024;
export const PERFORMANCE_VIDEO_MAX_DURATION_SECONDS = 300;
export const PERFORMANCE_VIDEO_ACCEPT = PORTFOLIO_VIDEO_ACCEPT;
export const PERFORMANCE_VIDEO_FORMAT_LABEL = PORTFOLIO_VIDEO_FORMAT_LABEL;

export function getPerformanceVideoFileValidationError(file: {
  name: string;
  type?: string;
  size: number;
}): string | null {
  if (!getPortfolioVideoSourceFormat(file.name, file.type || '')) {
    return `“${file.name}” is not a supported video. Choose ${PERFORMANCE_VIDEO_FORMAT_LABEL}.`;
  }
  if (file.size > PERFORMANCE_VIDEO_MAX_BYTES) {
    return `This file is ${formatPortfolioFileSize(file.size)}. Performance Video uploads must be 500 MB or smaller.`;
  }
  if (file.size < 1) return 'This video file is empty. Choose a different file.';
  return null;
}

export function getPerformanceVideoDurationError(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'We could not read this video’s duration.';
  if (seconds > PERFORMANCE_VIDEO_MAX_DURATION_SECONDS) {
    return `This video is ${formatPortfolioDuration(seconds)}. Performance Videos must be 5:00 or shorter.`;
  }
  return null;
}

export const PERFORMANCE_VIDEO_URL_HELP = 'Use a YouTube, Vimeo, or direct MP4, MOV, or WebM link.';
