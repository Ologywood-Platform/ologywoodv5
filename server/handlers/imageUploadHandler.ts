import { TRPCError } from "@trpc/server";
import * as imageOptimization from "../imageOptimization";
import { storagePut } from "../storage";

export interface UploadPhotoInput {
  fileData: string;
  fileName: string;
  mimeType: string;
}

export interface UploadPhotoResult {
  url: string;
  optimization: {
    format: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  };
}

/**
 * Handle photo upload with optimization
 */
export async function handlePhotoUpload(
  input: UploadPhotoInput,
  userId: number,
  uploadPath: string = 'artist-photos'
): Promise<UploadPhotoResult> {
  try {
    // Convert base64 to buffer
    const base64Data = input.fileData.split(',')[1] || input.fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate image
    const validation = await imageOptimization.validateImage(buffer);
    if (!validation.valid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: validation.error || 'Invalid image',
      });
    }

    // Optimize image
    const optimized = await imageOptimization.optimizeImage(buffer, {
      quality: 85,
      maxWidth: 2000,
      maxHeight: 2000,
      format: 'auto',
      stripMetadata: true,
    });

    // Generate unique file key
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `${uploadPath}/${userId}/${timestamp}-${randomSuffix}.${optimized.format}`;

    // Upload to S3
    const { url } = await storagePut(
      fileKey,
      optimized.data,
      `image/${optimized.format}`
    );

    return {
      url,
      optimization: {
        format: optimized.format,
        originalSize: optimized.originalSize || 0,
        optimizedSize: optimized.size,
        compressionRatio: optimized.compressionRatio || 0,
      },
    };
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}

/**
 * Handle media gallery upload with optimization
 */
export async function handleMediaUpload(
  input: UploadPhotoInput,
  userId: number,
  mediaType: 'artist' | 'venue' = 'artist'
): Promise<UploadPhotoResult> {
  const uploadPath = `${mediaType}-media/${userId}`;
  return handlePhotoUpload(input, userId, uploadPath);
}
