/**
 * Image Upload Guidance Service
 * Provides guidance and best practices for artist photo uploads
 */

export interface UploadGuideline {
  id: string;
  title: string;
  description: string;
  tips: string[];
  examples: string[];
  bestPractices: string[];
}

export class ImageUploadGuidanceService {
  /**
   * Get upload guidelines for artist profile photos
   */
  static getProfilePhotoGuidelines(): UploadGuideline {
    return {
      id: 'profile-photo',
      title: 'Profile Photo Guidelines',
      description: 'Your profile photo is the first impression potential bookers have of you. Make it count!',
      tips: [
        'Use a clear, professional headshot',
        'Ensure good lighting - natural light works best',
        'Keep the background simple and uncluttered',
        'Wear clothing that represents your style/genre',
        'Make sure your face is clearly visible',
        'Avoid filters or heavy editing',
        'Use a high-resolution image (at least 400x400px)',
        'Smile naturally and make eye contact with camera'
      ],
      examples: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
      ],
      bestPractices: [
        'Square format (1:1 aspect ratio) works best',
        'Center your face in the frame',
        'Leave some headroom above your head',
        'Avoid busy backgrounds that distract from you',
        'Update your photo at least annually',
        'Use consistent branding across platforms'
      ]
    };
  }

  /**
   * Get upload guidelines for performance/event photos
   */
  static getPerformancePhotoGuidelines(): UploadGuideline {
    return {
      id: 'performance-photo',
      title: 'Performance Photo Guidelines',
      description: 'Showcase your talent with high-quality performance photos that capture the energy of your act.',
      tips: [
        'Capture action shots during performances',
        'Include audience interaction if possible',
        'Show your equipment/instruments in action',
        'Use professional lighting when available',
        'Include variety - solo shots, band shots, crowd shots',
        'Avoid photos that are too dark or blurry',
        'Include photos from different venues/events',
        'Show your personality and stage presence'
      ],
      examples: [
        'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop'
      ],
      bestPractices: [
        'Landscape orientation (16:9) works well for gallery',
        'Include 3-5 different performance photos',
        'Update gallery quarterly with new content',
        'Include photos from different event types',
        'Get permission from venues before posting photos',
        'Maintain consistent color grading across photos'
      ]
    };
  }

  /**
   * Get upload guidelines for promotional materials
   */
  static getPromotionalPhotoGuidelines(): UploadGuideline {
    return {
      id: 'promotional-photo',
      title: 'Promotional Photo Guidelines',
      description: 'Create eye-catching promotional photos that attract bookers and fans.',
      tips: [
        'Use professional photography when possible',
        'Include your artist name or logo',
        'Use consistent branding and colors',
        'Showcase your unique style/aesthetic',
        'Include text overlays sparingly',
        'Ensure text is readable and not cluttered',
        'Use high contrast for visibility',
        'Include call-to-action elements'
      ],
      examples: [
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=600&h=400&fit=crop'
      ],
      bestPractices: [
        'Use consistent dimensions across all promotional photos',
        'Keep file sizes optimized for web (under 500KB)',
        'Include your contact information or booking link',
        'Use brand colors consistently',
        'Test visibility on mobile devices',
        'Include social media handles'
      ]
    };
  }

  /**
   * Validate image dimensions and quality
   */
  static validateImageDimensions(width: number, height: number, minWidth: number = 400): {
    valid: boolean;
    message: string;
  } {
    if (width < minWidth || height < minWidth) {
      return {
        valid: false,
        message: `Image must be at least ${minWidth}x${minWidth} pixels. Current: ${width}x${height}`
      };
    }

    return {
      valid: true,
      message: 'Image dimensions are suitable for upload'
    };
  }

  /**
   * Get file size validation
   */
  static validateFileSize(fileSizeInBytes: number, maxSizeInMB: number = 5): {
    valid: boolean;
    message: string;
  } {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (fileSizeInBytes > maxSizeInBytes) {
      return {
        valid: false,
        message: `File size must be under ${maxSizeInMB}MB. Current: ${(fileSizeInBytes / 1024 / 1024).toFixed(2)}MB`
      };
    }

    return {
      valid: true,
      message: 'File size is within acceptable limits'
    };
  }

  /**
   * Get recommended image formats
   */
  static getRecommendedFormats(): string[] {
    return ['JPEG', 'PNG', 'WebP'];
  }

  /**
   * Get aspect ratio recommendations
   */
  static getAspectRatios(): Array<{ label: string; ratio: string; use: string }> {
    return [
      { label: 'Square', ratio: '1:1', use: 'Profile photos' },
      { label: 'Portrait', ratio: '3:4', use: 'Headshots' },
      { label: 'Landscape', ratio: '16:9', use: 'Performance photos' },
      { label: 'Wide', ratio: '2:1', use: 'Banner/promotional' }
    ];
  }
}
