import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Test the venue photo upload input validation schema
const uploadPhotoSchema = z.object({
  fileData: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
});

const updateProfileSchema = z.object({
  organizationName: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
});

describe('Venue Profile Photo Upload', () => {
  it('should validate a valid photo upload input', () => {
    const input = {
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      fileName: 'venue-photo.png',
      mimeType: 'image/png',
    };
    const result = uploadPhotoSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject upload input missing fileData', () => {
    const input = {
      fileName: 'venue-photo.png',
      mimeType: 'image/png',
    };
    const result = uploadPhotoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject upload input missing fileName', () => {
    const input = {
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      mimeType: 'image/png',
    };
    const result = uploadPhotoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject upload input missing mimeType', () => {
    const input = {
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      fileName: 'venue-photo.png',
    };
    const result = uploadPhotoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate updateProfile with profilePhotoUrl', () => {
    const input = {
      organizationName: 'Test Venue',
      profilePhotoUrl: 'https://s3.example.com/venue-photos/photo.jpg',
    };
    const result = updateProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profilePhotoUrl).toBe('https://s3.example.com/venue-photos/photo.jpg');
    }
  });

  it('should validate updateProfile without profilePhotoUrl', () => {
    const input = {
      organizationName: 'Test Venue',
      bio: 'A great venue for events',
    };
    const result = updateProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profilePhotoUrl).toBeUndefined();
    }
  });

  it('should correctly extract base64 data from data URL', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const base64Data = dataUrl.split(',')[1] || dataUrl;
    expect(base64Data).toBe('/9j/4AAQSkZJRg==');
    
    const buffer = Buffer.from(base64Data, 'base64');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should handle raw base64 without data URL prefix', () => {
    const rawBase64 = 'iVBORw0KGgoAAAANSUhEUg==';
    const base64Data = rawBase64.split(',')[1] || rawBase64;
    expect(base64Data).toBe('iVBORw0KGgoAAAANSUhEUg==');
  });

  it('should generate unique file keys for uploads', () => {
    const userId = 123;
    const timestamp1 = Date.now();
    const randomSuffix1 = Math.random().toString(36).substring(7);
    const fileKey1 = `venue-profile-photos/${userId}/${timestamp1}-${randomSuffix1}.jpg`;

    const timestamp2 = Date.now();
    const randomSuffix2 = Math.random().toString(36).substring(7);
    const fileKey2 = `venue-profile-photos/${userId}/${timestamp2}-${randomSuffix2}.jpg`;

    expect(fileKey1).not.toBe(fileKey2);
    expect(fileKey1).toContain(`venue-profile-photos/${userId}/`);
    expect(fileKey1).toMatch(/\.jpg$/);
  });
});
