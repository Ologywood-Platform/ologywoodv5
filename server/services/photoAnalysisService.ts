/**
 * Photo Analysis Service
 * Analyzes uploaded photos and provides AI-powered recommendations for improvement
 */

export interface PhotoRecommendation {
  category: 'lighting' | 'composition' | 'clarity' | 'background' | 'color';
  severity: 'critical' | 'warning' | 'suggestion';
  title: string;
  description: string;
  actionableAdvice: string;
  exampleImageUrl?: string;
}

export interface PhotoAnalysisResult {
  photoId: string;
  overallQuality: number; // 1-10
  recommendations: PhotoRecommendation[];
  strengths: string[];
  areasForImprovement: string[];
  estimatedImprovementPotential: number; // 1-10
}

export class PhotoAnalysisService {
  /**
   * Analyze a photo and generate recommendations
   * In production, this would integrate with Google Cloud Vision or AWS Rekognition
   */
  static async analyzePhoto(imageUrl: string, photoType: 'profile' | 'performance' | 'promotional'): Promise<PhotoAnalysisResult> {
    // Simulate AI analysis - in production, call actual vision API
    const recommendations = this.generateRecommendations(photoType);
    const quality = this.calculateQualityScore(recommendations);

    return {
      photoId: `photo_${Date.now()}`,
      overallQuality: quality,
      recommendations,
      strengths: this.identifyStrengths(recommendations),
      areasForImprovement: this.identifyWeaknesses(recommendations),
      estimatedImprovementPotential: 10 - quality
    };
  }

  /**
   * Generate recommendations based on photo type
   */
  private static generateRecommendations(photoType: string): PhotoRecommendation[] {
    const baseRecommendations: PhotoRecommendation[] = [
      {
        category: 'lighting',
        severity: 'warning',
        title: 'Lighting Could Be Improved',
        description: 'The photo has some harsh shadows on the face. Natural window light from the side would create better definition.',
        actionableAdvice: 'Try shooting near a window during golden hour (early morning or late afternoon) for softer, more flattering light.',
        exampleImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
      },
      {
        category: 'composition',
        severity: 'suggestion',
        title: 'Face Could Be Better Centered',
        description: 'Your face is slightly off-center. Moving it 2-3 inches to the left would follow the rule of thirds better.',
        actionableAdvice: 'Use the grid lines in your camera app to position your face at the intersection of the rule of thirds lines.',
        exampleImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop'
      },
      {
        category: 'background',
        severity: 'warning',
        title: 'Simplify Your Background',
        description: 'The background has some distracting elements. A simple, solid-color backdrop would make you stand out more.',
        actionableAdvice: 'Use a plain white, gray, or colored wall as your background. Avoid busy patterns or multiple objects.',
        exampleImageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop'
      }
    ];

    // Add type-specific recommendations
    if (photoType === 'performance') {
      baseRecommendations.push({
        category: 'clarity',
        severity: 'critical',
        title: 'Image Sharpness Could Be Better',
        description: 'The photo shows some motion blur. Use a faster shutter speed or stabilize your camera.',
        actionableAdvice: 'Use a tripod and set shutter speed to at least 1/250s to freeze motion during performances.',
        exampleImageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=600&h=400&fit=crop'
      });
    }

    return baseRecommendations;
  }

  /**
   * Calculate overall quality score (1-10)
   */
  private static calculateQualityScore(recommendations: PhotoRecommendation[]): number {
    let score = 10;

    recommendations.forEach((rec) => {
      if (rec.severity === 'critical') score -= 3;
      else if (rec.severity === 'warning') score -= 2;
      else if (rec.severity === 'suggestion') score -= 1;
    });

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Identify photo strengths
   */
  private static identifyStrengths(recommendations: PhotoRecommendation[]): string[] {
    const allCategories = ['lighting', 'composition', 'clarity', 'background', 'color'];
    const weakCategories = new Set(recommendations.map((r) => r.category));
    const strengths = allCategories.filter((cat) => !weakCategories.has(cat as any));

    const strengthLabels: Record<string, string> = {
      lighting: '✨ Good lighting and exposure',
      composition: '📐 Well-composed framing',
      clarity: '🔍 Sharp and clear image',
      background: '🎨 Clean, professional background',
      color: '🌈 Good color balance'
    };

    return strengths.map((s) => strengthLabels[s]).filter(Boolean);
  }

  /**
   * Identify areas for improvement
   */
  private static identifyWeaknesses(recommendations: PhotoRecommendation[]): string[] {
    return recommendations.map((rec) => {
      const icons: Record<string, string> = {
        lighting: '💡',
        composition: '📐',
        clarity: '🔍',
        background: '🎨',
        color: '🌈'
      };
      return `${icons[rec.category]} ${rec.title}`;
    });
  }

  /**
   * Get recommendation priority order
   */
  static prioritizeRecommendations(recommendations: PhotoRecommendation[]): PhotoRecommendation[] {
    const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
    return [...recommendations].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  /**
   * Generate improvement plan
   */
  static generateImprovementPlan(recommendations: PhotoRecommendation[]): string {
    const prioritized = this.prioritizeRecommendations(recommendations);
    let plan = 'Photo Improvement Plan:\n\n';

    prioritized.forEach((rec, idx) => {
      plan += `${idx + 1}. ${rec.title}\n`;
      plan += `   ${rec.actionableAdvice}\n\n`;
    });

    return plan;
  }

  /**
   * Compare two photos
   */
  static comparePhotos(
    photo1: PhotoAnalysisResult,
    photo2: PhotoAnalysisResult
  ): {
    improvement: number;
    betterPhoto: 'photo1' | 'photo2';
    differences: string[];
  } {
    const improvement = photo2.overallQuality - photo1.overallQuality;
    const betterPhoto = improvement > 0 ? 'photo2' : 'photo1';

    const differences: string[] = [];

    // Compare recommendations
    const rec1Categories = new Set(photo1.recommendations.map((r) => r.category));
    const rec2Categories = new Set(photo2.recommendations.map((r) => r.category));

    rec1Categories.forEach((cat) => {
      if (!rec2Categories.has(cat)) {
        differences.push(`✅ Improved: ${cat}`);
      }
    });

    rec2Categories.forEach((cat) => {
      if (!rec1Categories.has(cat)) {
        differences.push(`⚠️ New issue: ${cat}`);
      }
    });

    return {
      improvement: Math.abs(improvement),
      betterPhoto,
      differences
    };
  }
}
