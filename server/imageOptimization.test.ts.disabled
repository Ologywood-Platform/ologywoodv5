import { describe, it, expect, beforeAll } from 'vitest';
import * as imageOptimization from './imageOptimization';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Image Optimization Service', () => {
  let testImageBuffer: Buffer;

  beforeAll(() => {
    // Create a simple test image (1x1 pixel PNG)
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
      0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
      0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    testImageBuffer = pngHeader;
  });

  describe('optimizeImage', () => {
    it('should optimize image with default settings', async () => {
      const result = await imageOptimization.optimizeImage(testImageBuffer);
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.format).toBe('webp');
      expect(result.width).toBe(1);
      expect(result.height).toBe(1);
      expect(result.size).toBeGreaterThan(0);
    });

    it('should calculate compression ratio', async () => {
      const result = await imageOptimization.optimizeImage(testImageBuffer, {
        quality: 80,
      });
      
      expect(result.compressionRatio).toBeDefined();
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(result.compressionRatio).toBeLessThanOrEqual(100);
    });

    it('should convert to WebP format', async () => {
      const result = await imageOptimization.optimizeImage(testImageBuffer, {
        format: 'webp',
      });
      
      expect(result.format).toBe('webp');
    });

    it('should convert to JPEG format', async () => {
      const result = await imageOptimization.optimizeImage(testImageBuffer, {
        format: 'jpeg',
      });
      
      expect(result.format).toBe('jpeg');
    });

    it('should respect quality settings', async () => {
      const lowQuality = await imageOptimization.optimizeImage(testImageBuffer, {
        quality: 30,
        format: 'jpeg',
      });
      
      const highQuality = await imageOptimization.optimizeImage(testImageBuffer, {
        quality: 95,
        format: 'jpeg',
      });
      
      // Higher quality should result in larger file size
      expect(highQuality.size).toBeGreaterThanOrEqual(lowQuality.size);
    });

    it('should strip metadata when requested', async () => {
      const result = await imageOptimization.optimizeImage(testImageBuffer, {
        stripMetadata: true,
      });
      
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('validateImage', () => {
    it('should validate correct image', async () => {
      const result = await imageOptimization.validateImage(testImageBuffer);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject oversized images', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB
      const result = await imageOptimization.validateImage(largeBuffer, 50 * 1024 * 1024);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid image data', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const result = await imageOptimization.validateImage(invalidBuffer);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getOptimizationStats', () => {
    it('should calculate stats for multiple images', async () => {
      const images = [
        await imageOptimization.optimizeImage(testImageBuffer),
        await imageOptimization.optimizeImage(testImageBuffer),
      ];
      
      const stats = imageOptimization.getOptimizationStats(images);
      
      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.totalOptimizedSize).toBeGreaterThan(0);
      expect(stats.averageCompressionRatio).toBeGreaterThanOrEqual(0);
      expect(stats.totalSaved).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty array', () => {
      const stats = imageOptimization.getOptimizationStats([]);
      
      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalOptimizedSize).toBe(0);
      expect(stats.averageCompressionRatio).toBe(0);
      expect(stats.totalSaved).toBe(0);
    });
  });

  describe('generateResponsiveImages', () => {
    it('should generate multiple sizes', async () => {
      const sizes = [400, 800];
      const results = await imageOptimization.generateResponsiveImages(
        testImageBuffer,
        sizes
      );
      
      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.data).toBeInstanceOf(Buffer);
        expect(result.format).toBeDefined();
      });
    });
  });
});
