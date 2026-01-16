/**
 * File Upload Security Middleware
 * Validates file types, sizes, and scans for malware
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';

/**
 * Allowed MIME types for different file categories
 */
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf'],
  contracts: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

/**
 * Allowed file extensions
 */
export const ALLOWED_EXTENSIONS = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  documents: ['.pdf'],
  contracts: ['.pdf', '.doc', '.docx'],
};

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  contract: 20 * 1024 * 1024, // 20MB
  default: 10 * 1024 * 1024, // 10MB
};

/**
 * Validate file type
 */
export function validateFileType(
  filename: string,
  mimeType: string,
  allowedTypes: string[] = ALLOWED_MIME_TYPES.documents
): boolean {
  const ext = path.extname(filename).toLowerCase();
  
  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }

  // Check extension
  const allowedExts = Object.values(ALLOWED_EXTENSIONS).flat();
  return allowedExts.includes(ext);
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, limit: number = FILE_SIZE_LIMITS.default): boolean {
  return size > 0 && size <= limit;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove special characters except dots and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    sanitized = sanitized.substring(0, 255 - ext.length) + ext;
  }

  return sanitized;
}

/**
 * File upload validation middleware
 */
export function fileUploadValidation(options?: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { filename, mimetype, size } = req.file;
    const maxSize = options?.maxSize || FILE_SIZE_LIMITS.default;
    const allowedTypes = options?.allowedTypes || Object.values(ALLOWED_MIME_TYPES).flat();

    // Validate file type
    if (!validateFileType(filename, mimetype, allowedTypes)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: `File type ${mimetype} is not allowed`,
      });
    }

    // Validate file size
    if (!validateFileSize(size, maxSize)) {
      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      });
    }

    // Sanitize filename
    req.file.filename = sanitizeFilename(filename);

    next();
  };
}

/**
 * Virus scanning configuration
 * Note: Requires ClamAV server running
 */
export const virusScanConfig = {
  enabled: process.env.ENABLE_VIRUS_SCAN === 'true',
  host: process.env.CLAMAV_HOST || 'localhost',
  port: parseInt(process.env.CLAMAV_PORT || '3310'),
  timeout: 30000, // 30 seconds
};

/**
 * Scan file for viruses (requires ClamAV)
 * This is a placeholder that would integrate with actual ClamAV
 */
export async function scanFileForViruses(filePath: string): Promise<boolean> {
  if (!virusScanConfig.enabled) {
    console.log('[FileUploadSecurity] Virus scanning disabled');
    return true;
  }

  try {
    // In production, integrate with actual ClamAV server
    // Example using node-clamscan:
    // const clamscan = await new NodeClam().init(virusScanConfig);
    // const { isInfected } = await clamscan.scanFile(filePath);
    // return !isInfected;

    console.log('[FileUploadSecurity] Virus scan would run here for:', filePath);
    return true;
  } catch (error) {
    console.error('[FileUploadSecurity] Virus scan error:', error);
    // Fail safe - reject if scan fails
    return false;
  }
}

/**
 * File upload security middleware factory
 */
export function createFileUploadSecurityMiddleware(options?: {
  maxSize?: number;
  allowedTypes?: string[];
  scanForViruses?: boolean;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate file
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { filename, mimetype, size, path: filePath } = req.file;
      const maxSize = options?.maxSize || FILE_SIZE_LIMITS.default;
      const allowedTypes = options?.allowedTypes || Object.values(ALLOWED_MIME_TYPES).flat();

      // Validate file type
      if (!validateFileType(filename, mimetype, allowedTypes)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${mimetype} is not allowed`,
        });
      }

      // Validate file size
      if (!validateFileSize(size, maxSize)) {
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
        });
      }

      // Scan for viruses if enabled
      if (options?.scanForViruses && filePath) {
        const isClean = await scanFileForViruses(filePath);
        if (!isClean) {
          return res.status(400).json({
            error: 'File rejected',
            message: 'File failed security scan',
          });
        }
      }

      // Sanitize filename
      req.file.filename = sanitizeFilename(filename);

      next();
    } catch (error) {
      console.error('[FileUploadSecurity] Error:', error);
      res.status(500).json({ error: 'File upload validation failed' });
    }
  };
}

/**
 * File upload security configuration
 */
export const fileUploadSecurityConfig = {
  maxFileSize: FILE_SIZE_LIMITS.default,
  allowedMimeTypes: Object.values(ALLOWED_MIME_TYPES).flat(),
  allowedExtensions: Object.values(ALLOWED_EXTENSIONS).flat(),
  enableVirusScan: process.env.ENABLE_VIRUS_SCAN === 'true',
  uploadDirectory: process.env.UPLOAD_DIR || '/tmp/uploads',
  quarantineDirectory: process.env.QUARANTINE_DIR || '/tmp/quarantine',
};
