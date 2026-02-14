import sharp from 'sharp';
import { Buffer } from 'buffer';

/**
 * Image Optimization Service
 * 
 * Provides image optimization capabilities including:
 * - JPEG/PNG to WebP conversion
 * - Image compression with quality settings
 * - Responsive image generation (multiple sizes)
 * - Metadata stripping for privacy
 * - Format auto-detection
 */

export interface OptimizationOptions {
  quality?: number; // 1-100, default 80
  maxWidth?: number; // max width in pixels
  maxHeight?: number; // max height in pixels
  format?: 'webp' | 'jpeg' | 'png' | 'auto'; // auto detects best format
  stripMetadata?: boolean; // remove EXIF data
}

export interface OptimizedImage {
  data: Buffer;
  format: 'webp' | 'jpeg' | 'png';
  width: number;
  height: number;
  size: number; // bytes
  originalSize?: number; // bytes
  compressionRatio?: number; // percentage
}

/**
 * Optimize a single image with compression and format conversion
 */
export async function optimizeImage(
  imageBuffer: Buffer,
  options: OptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    quality = 80,
    maxWidth = 2000,
    maxHeight = 2000,
    format = 'auto',
    stripMetadata = true,
  } = options;

  try {
    const originalSize = imageBuffer.length;
    
    // Detect original format
    const metadata = await sharp(imageBuffer).metadata();
    const originalFormat = metadata.format as 'jpeg' | 'png' | 'webp' | undefined;

    // Determine output format
    let outputFormat: 'webp' | 'jpeg' | 'png' = 'webp';
    if (format !== 'auto') {
      outputFormat = format;
    } else {
      // Auto-select: WebP for most images, PNG for images with transparency
      outputFormat = metadata.hasAlpha ? 'png' : 'webp';
    }

    // Build optimization pipeline
    let pipeline = sharp(imageBuffer);

    // Note: sharp's withMetadata() preserves metadata, no option to strip
    // Metadata stripping happens automatically when converting formats
    // stripMetadata parameter is kept for API compatibility

    // Resize if needed
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert to target format with compression
    let optimized: Buffer;
    switch (outputFormat) {
      case 'webp':
        optimized = await pipeline
          .webp({ quality, alphaQuality: quality })
          .toBuffer();
        break;
      case 'jpeg':
        optimized = await pipeline
          .jpeg({ quality, progressive: true })
          .toBuffer();
        break;
      case 'png':
        optimized = await pipeline
          .png({ compressionLevel: 9 })
          .toBuffer();
        break;
      default:
        optimized = await pipeline.toBuffer();
    }

    // Get final metadata
    const finalMetadata = await sharp(optimized).metadata();

    const compressionRatio = Math.max(0, ((1 - optimized.length / originalSize) * 100));

    return {
      data: optimized,
      format: outputFormat,
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0,
      size: optimized.length,
      originalSize,
      compressionRatio: Math.round(compressionRatio),
    };
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate multiple sizes of an image for responsive display
 */
export async function generateResponsiveImages(
  imageBuffer: Buffer,
  sizes: number[] = [400, 800, 1200],
  options: Omit<OptimizationOptions, 'maxWidth' | 'maxHeight'> = {}
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = [];

  for (const size of sizes) {
    const optimized = await optimizeImage(imageBuffer, {
      ...options,
      maxWidth: size,
      maxHeight: size,
    });
    results.push(optimized);
  }

  return results;
}

/**
 * Batch optimize multiple images
 */
export async function optimizeImageBatch(
  imageBuffers: Buffer[],
  options?: OptimizationOptions
): Promise<OptimizedImage[]> {
  return Promise.all(
    imageBuffers.map(buffer => optimizeImage(buffer, options))
  );
}

/**
 * Get optimization statistics
 */
export function getOptimizationStats(images: OptimizedImage[]): {
  totalOriginalSize: number;
  totalOptimizedSize: number;
  averageCompressionRatio: number;
  totalSaved: number;
} {
  const totalOriginalSize = images.reduce((sum, img) => sum + (img.originalSize || 0), 0);
  const totalOptimizedSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSaved = Math.max(0, totalOriginalSize - totalOptimizedSize);
  const averageCompressionRatio = images.length > 0
    ? Math.round(images.reduce((sum, img) => sum + (img.compressionRatio || 0), 0) / images.length)
    : 0;

  return {
    totalOriginalSize,
    totalOptimizedSize,
    averageCompressionRatio,
    totalSaved,
  };
}

/**
 * Validate image before optimization
 */
export async function validateImage(
  imageBuffer: Buffer,
  maxSizeBytes: number = 50 * 1024 * 1024 // 50MB default
): Promise<{ valid: boolean; error?: string }> {
  if (imageBuffer.length > maxSizeBytes) {
    return {
      valid: false,
      error: `Image size ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff'].includes(metadata.format)) {
      return {
        valid: false,
        error: `Unsupported image format: ${metadata.format}`,
      };
    }

    if (!metadata.width || !metadata.height) {
      return {
        valid: false,
        error: 'Invalid image dimensions',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
