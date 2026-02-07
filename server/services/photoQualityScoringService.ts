/**
 * Photo Quality Scoring Service
 * Calculates quality scores for photos based on multiple criteria
 */

export interface QualityScoreBreakdown {
  lighting: number; // 0-2
  composition: number; // 0-2
  clarity: number; // 0-2
  background: number; // 0-2
  colorBalance: number; // 0-2
  total: number; // 0-10
}

export interface PhotoQualityScore {
  photoId: string;
  score: number; // 1-10
  breakdown: QualityScoreBreakdown;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  ratingDescription: string;
  percentile: number; // 0-100 (how this photo ranks among all photos)
}

export class PhotoQualityScoringService {
  /**
   * Calculate quality score for a photo
   */
  static calculateScore(
    lightingQuality: number,
    compositionQuality: number,
    clarityQuality: number,
    backgroundQuality: number,
    colorBalanceQuality: number
  ): PhotoQualityScore {
    const breakdown: QualityScoreBreakdown = {
      lighting: Math.min(2, Math.max(0, lightingQuality)),
      composition: Math.min(2, Math.max(0, compositionQuality)),
      clarity: Math.min(2, Math.max(0, clarityQuality)),
      background: Math.min(2, Math.max(0, backgroundQuality)),
      colorBalance: Math.min(2, Math.max(0, colorBalanceQuality)),
      total: 0
    };

    breakdown.total =
      breakdown.lighting +
      breakdown.composition +
      breakdown.clarity +
      breakdown.background +
      breakdown.colorBalance;

    const score = Math.round((breakdown.total / 10) * 10);
    const rating = this.getRating(score);
    const ratingDescription = this.getRatingDescription(rating);

    return {
      photoId: `photo_${Date.now()}`,
      score,
      breakdown,
      rating,
      ratingDescription,
      percentile: this.estimatePercentile(score)
    };
  }

  /**
   * Get rating based on score
   */
  private static getRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }

  /**
   * Get human-readable rating description
   */
  private static getRatingDescription(rating: string): string {
    const descriptions: Record<string, string> = {
      excellent: 'Professional quality - This photo will attract more bookings',
      good: 'Good quality - Consider making small improvements for better results',
      fair: 'Average quality - Several improvements recommended',
      poor: 'Below average - Significant improvements needed'
    };
    return descriptions[rating] || '';
  }

  /**
   * Estimate percentile ranking (how this photo compares to others)
   */
  private static estimatePercentile(score: number): number {
    // Simulate percentile distribution
    // In production, this would compare against actual database of photos
    const percentiles: Record<number, number> = {
      10: 5,
      9: 15,
      8: 35,
      7: 55,
      6: 70,
      5: 82,
      4: 90,
      3: 95,
      2: 98,
      1: 99
    };
    return percentiles[score] || 50;
  }

  /**
   * Get improvement suggestions based on score breakdown
   */
  static getImprovementSuggestions(breakdown: QualityScoreBreakdown): string[] {
    const suggestions: string[] = [];

    if (breakdown.lighting < 1.5) {
      suggestions.push('💡 Improve lighting - Use natural window light or professional lighting');
    }
    if (breakdown.composition < 1.5) {
      suggestions.push('📐 Improve composition - Center your face using the rule of thirds');
    }
    if (breakdown.clarity < 1.5) {
      suggestions.push('🔍 Improve clarity - Use a tripod and ensure sharp focus');
    }
    if (breakdown.background < 1.5) {
      suggestions.push('🎨 Simplify background - Use a plain, uncluttered backdrop');
    }
    if (breakdown.colorBalance < 1.5) {
      suggestions.push('🌈 Improve color balance - Adjust white balance for natural colors');
    }

    return suggestions;
  }

  /**
   * Compare two photos
   */
  static compareScores(
    photo1: PhotoQualityScore,
    photo2: PhotoQualityScore
  ): {
    winner: 'photo1' | 'photo2' | 'tie';
    scoreDifference: number;
    improvementAreas: string[];
  } {
    const difference = photo2.score - photo1.score;
    let winner: 'photo1' | 'photo2' | 'tie' = 'tie';

    if (difference > 0) winner = 'photo2';
    else if (difference < 0) winner = 'photo1';

    // Find areas where photo2 improved
    const improvementAreas: string[] = [];

    if (photo2.breakdown.lighting > photo1.breakdown.lighting) {
      improvementAreas.push('Lighting improved');
    }
    if (photo2.breakdown.composition > photo1.breakdown.composition) {
      improvementAreas.push('Composition improved');
    }
    if (photo2.breakdown.clarity > photo1.breakdown.clarity) {
      improvementAreas.push('Clarity improved');
    }
    if (photo2.breakdown.background > photo1.breakdown.background) {
      improvementAreas.push('Background improved');
    }
    if (photo2.breakdown.colorBalance > photo1.breakdown.colorBalance) {
      improvementAreas.push('Color balance improved');
    }

    return {
      winner,
      scoreDifference: Math.abs(difference),
      improvementAreas
    };
  }

  /**
   * Get badge color based on score
   */
  static getBadgeColor(score: number): string {
    if (score >= 8) return 'bg-green-500'; // Excellent
    if (score >= 6) return 'bg-blue-500'; // Good
    if (score >= 4) return 'bg-yellow-500'; // Fair
    return 'bg-red-500'; // Poor
  }

  /**
   * Get badge icon based on score
   */
  static getBadgeIcon(score: number): string {
    if (score >= 8) return '⭐'; // Excellent
    if (score >= 6) return '👍'; // Good
    if (score >= 4) return '👌'; // Fair
    return '⚠️'; // Poor
  }

  /**
   * Calculate gallery average score
   */
  static calculateGalleryAverageScore(photoScores: PhotoQualityScore[]): number {
    if (photoScores.length === 0) return 0;
    const total = photoScores.reduce((sum, photo) => sum + photo.score, 0);
    return Math.round((total / photoScores.length) * 10) / 10;
  }

  /**
   * Rank photos by quality
   */
  static rankPhotosByQuality(photoScores: PhotoQualityScore[]): PhotoQualityScore[] {
    return [...photoScores].sort((a, b) => b.score - a.score);
  }

  /**
   * Get quality insights for artist dashboard
   */
  static getGalleryInsights(photoScores: PhotoQualityScore[]): {
    averageScore: number;
    bestPhoto: PhotoQualityScore | null;
    weakestPhoto: PhotoQualityScore | null;
    improvementOpportunities: string[];
    percentileRanking: number;
  } {
    const averageScore = this.calculateGalleryAverageScore(photoScores);
    const ranked = this.rankPhotosByQuality(photoScores);

    const bestPhoto = ranked[0] || null;
    const weakestPhoto = ranked[ranked.length - 1] || null;

    // Find common improvement areas
    const improvementMap: Record<string, number> = {};
    photoScores.forEach((photo) => {
      const suggestions = this.getImprovementSuggestions(photo.breakdown);
      suggestions.forEach((suggestion) => {
        improvementMap[suggestion] = (improvementMap[suggestion] || 0) + 1;
      });
    });

    const improvementOpportunities = Object.entries(improvementMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([suggestion]) => suggestion);

    return {
      averageScore,
      bestPhoto,
      weakestPhoto,
      improvementOpportunities,
      percentileRanking: this.estimatePercentile(Math.round(averageScore))
    };
  }
}
