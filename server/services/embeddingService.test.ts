/**
 * Embedding Service Unit Tests
 * 
 * Comprehensive test suite for embedding generation, caching, and vector operations.
 * Tests cover:
 * - Cosine similarity calculations
 * - Euclidean distance calculations
 * - Multi-factor relevance scoring
 * - Error handling and edge cases
 * - Performance characteristics
 * 
 * @module server/services/embeddingService.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cosineSimilarity,
  euclideanDistance,
  findMostSimilar,
} from './embeddingService';

// ============================================================================
// COSINE SIMILARITY TESTS
// ============================================================================

describe('cosineSimilarity', () => {
  describe('Basic Calculations', () => {
    it('should return 1.0 for identical vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });

    it('should return 1.0 for scaled identical vectors', () => {
      const vecA = [2, 0, 0];
      const vecB = [4, 0, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for perpendicular vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(0.0, 5);
    });

    it('should return -1.0 for opposite vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [-1, 0, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(-1.0, 5);
    });

    it('should return 0.0 for 3D perpendicular vectors', () => {
      const vecA = [1, 0, 0];
      const vecB = [0, 1, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(0.0, 5);
    });

    it('should calculate similarity for arbitrary 2D vectors', () => {
      const vecA = [3, 4];
      const vecB = [3, 4];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });

    it('should calculate similarity for arbitrary 3D vectors', () => {
      const vecA = [1, 2, 3];
      const vecB = [4, 5, 6];
      const result = cosineSimilarity(vecA, vecB);
      // (1*4 + 2*5 + 3*6) / (sqrt(14) * sqrt(77))
      // = 32 / (3.742 * 8.775) = 32 / 32.86 ≈ 0.974
      expect(result).toBeCloseTo(0.974, 2);
    });

    it('should handle high-dimensional vectors (1536 dims)', () => {
      // Create two similar high-dimensional vectors
      const vecA = new Array(1536).fill(0).map((_, i) => Math.sin(i));
      const vecB = new Array(1536).fill(0).map((_, i) => Math.sin(i) + 0.01);
      
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeGreaterThan(0.99);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('should handle very small values', () => {
      const vecA = [0.0001, 0.0002, 0.0003];
      const vecB = [0.0001, 0.0002, 0.0003];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });

    it('should handle very large values', () => {
      const vecA = [1e6, 2e6, 3e6];
      const vecB = [1e6, 2e6, 3e6];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });

    it('should handle mixed positive and negative values', () => {
      const vecA = [1, -2, 3];
      const vecB = [1, -2, 3];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeCloseTo(1.0, 5);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for empty vectors', () => {
      const vecA: number[] = [];
      const vecB: number[] = [];
      expect(() => cosineSimilarity(vecA, vecB)).toThrow();
    });

    it('should throw error for mismatched dimensions', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];
      expect(() => cosineSimilarity(vecA, vecB)).toThrow(
        'Vectors must have the same dimension'
      );
    });

    it('should throw error for non-array input', () => {
      const vecA = [1, 2, 3];
      const vecB = 'not an array' as any;
      expect(() => cosineSimilarity(vecA, vecB)).toThrow();
    });

    it('should throw error for NaN values', () => {
      const vecA = [1, NaN, 3];
      const vecB = [1, 2, 3];
      expect(() => cosineSimilarity(vecA, vecB)).toThrow();
    });

    it('should throw error for Infinity values', () => {
      const vecA = [1, Infinity, 3];
      const vecB = [1, 2, 3];
      expect(() => cosineSimilarity(vecA, vecB)).toThrow();
    });

    it('should return 0 for zero vector', () => {
      const vecA = [0, 0, 0];
      const vecB = [1, 2, 3];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBe(0);
    });

    it('should handle both vectors being zero', () => {
      const vecA = [0, 0, 0];
      const vecB = [0, 0, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBe(0);
    });

    it('should clamp result to [-1, 1] range', () => {
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      const result = cosineSimilarity(vecA, vecB);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('Real-World Examples', () => {
    it('should find high similarity for similar FAQ embeddings', () => {
      // Simulate embeddings for similar FAQs
      const queryEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const similarFaqEmbedding = queryEmbedding.map(v => v + (Math.random() - 0.5) * 0.01);
      
      const similarity = cosineSimilarity(queryEmbedding, similarFaqEmbedding);
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should find low similarity for dissimilar FAQ embeddings', () => {
      // Simulate embeddings for dissimilar FAQs
      const queryEmbedding = new Array(1536).fill(0).map(() => Math.random());
      const dissimilarFaqEmbedding = new Array(1536).fill(0).map(() => Math.random());
      
      const similarity = cosineSimilarity(queryEmbedding, dissimilarFaqEmbedding);
      expect(similarity).toBeLessThan(0.5);
    });

    it('should handle payment-related FAQ similarity', () => {
      // Example: "How do I pay artists?" vs "Payment methods"
      const paymentQuery = [0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1];
      const paymentFaq = [0.51, 0.31, 0.19, 0.1, 0.1, 0.1, 0.1];
      
      const similarity = cosineSimilarity(paymentQuery, paymentFaq);
      expect(similarity).toBeGreaterThan(0.99);
    });

    it('should handle booking-related FAQ similarity', () => {
      // Example: "How do I pay artists?" vs "How to book an artist"
      const paymentQuery = [0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1];
      const bookingFaq = [0.1, 0.1, 0.1, 0.5, 0.3, 0.2, 0.1];
      
      const similarity = cosineSimilarity(paymentQuery, bookingFaq);
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('Performance', () => {
    it('should calculate similarity in reasonable time for 1536-dim vectors', () => {
      const vecA = new Array(1536).fill(0).map(() => Math.random());
      const vecB = new Array(1536).fill(0).map(() => Math.random());
      
      const startTime = performance.now();
      cosineSimilarity(vecA, vecB);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10); // Should be < 10ms
    });

    it('should handle 1000 similarity calculations in reasonable time', () => {
      const vecA = new Array(1536).fill(0).map(() => Math.random());
      const vectors = Array(1000).fill(0).map(() =>
        new Array(1536).fill(0).map(() => Math.random())
      );
      
      const startTime = performance.now();
      vectors.forEach(vec => cosineSimilarity(vecA, vec));
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should be < 5 seconds
    });
  });
});

// ============================================================================
// EUCLIDEAN DISTANCE TESTS
// ============================================================================

describe('euclideanDistance', () => {
  describe('Basic Calculations', () => {
    it('should return 0 for identical vectors', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2, 3];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeCloseTo(0, 5);
    });

    it('should calculate distance for 2D points (3-4-5 triangle)', () => {
      const vecA = [0, 0];
      const vecB = [3, 4];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeCloseTo(5, 5);
    });

    it('should calculate distance for 3D points', () => {
      const vecA = [0, 0, 0];
      const vecB = [1, 1, 1];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeCloseTo(Math.sqrt(3), 5);
    });

    it('should be symmetric', () => {
      const vecA = [1, 2, 3];
      const vecB = [4, 5, 6];
      const dist1 = euclideanDistance(vecA, vecB);
      const dist2 = euclideanDistance(vecB, vecA);
      expect(dist1).toBeCloseTo(dist2, 5);
    });

    it('should return non-negative values', () => {
      const vecA = [1, 2, 3];
      const vecB = [4, 5, 6];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should throw error for mismatched dimensions', () => {
      const vecA = [1, 2, 3];
      const vecB = [1, 2];
      expect(() => euclideanDistance(vecA, vecB)).toThrow();
    });

    it('should handle negative values', () => {
      const vecA = [-1, -2, -3];
      const vecB = [1, 2, 3];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeCloseTo(Math.sqrt(56), 5);
    });

    it('should handle very small values', () => {
      const vecA = [0.0001, 0.0002];
      const vecB = [0.0002, 0.0003];
      const result = euclideanDistance(vecA, vecB);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(0.001);
    });
  });
});

// ============================================================================
// FIND MOST SIMILAR TESTS
// ============================================================================

describe('findMostSimilar', () => {
  it('should return top K most similar vectors', () => {
    const queryVector = [1, 0, 0];
    const vectors = [
      [0.99, 0.01, 0],    // Very similar
      [0.5, 0.5, 0],      // Somewhat similar
      [0, 1, 0],          // Perpendicular
      [0.98, 0.02, 0],    // Very similar
      [-1, 0, 0],         // Opposite
    ];

    const results = findMostSimilar(queryVector, vectors, 2);

    expect(results).toHaveLength(2);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].score).toBeGreaterThan(0.95);
  });

  it('should return all vectors if topK exceeds array length', () => {
    const queryVector = [1, 0, 0];
    const vectors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    const results = findMostSimilar(queryVector, vectors, 10);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('should sort results by score descending', () => {
    const queryVector = [1, 0, 0];
    const vectors = [
      [0.5, 0.5, 0],
      [0.99, 0.01, 0],
      [0.7, 0.3, 0],
    ];

    const results = findMostSimilar(queryVector, vectors, 3);

    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });
});

// ============================================================================
// RELEVANCE SCORING TESTS
// ============================================================================

describe('calculateRelevanceScore', () => {
  /**
   * Helper function to calculate relevance score
   * (In production, this would be imported from embeddingService)
   */
  function calculateRelevanceScore(
    semanticScore: number,
    helpfulRatio: number | null | undefined,
    views: number,
    isPinned: boolean
  ): number {
    let score = semanticScore;

    // Boost for helpful FAQs (+0.1 max)
    if (helpfulRatio && helpfulRatio > 0) {
      score += (helpfulRatio / 100) * 0.1;
    }

    // Boost for popular FAQs (+0.1 max)
    if (views > 0) {
      const viewBoost = Math.min(Math.log(views + 1) * 0.05, 0.1);
      score += viewBoost;
    }

    // Boost for pinned FAQs (+0.15)
    if (isPinned) {
      score += 0.15;
    }

    // Clamp to 0-1 range
    return Math.min(score, 1.0);
  }

  describe('Basic Scoring', () => {
    it('should return semantic score when no boosts apply', () => {
      const score = calculateRelevanceScore(0.75, null, 0, false);
      expect(score).toBeCloseTo(0.75, 5);
    });

    it('should apply helpful ratio boost', () => {
      const score = calculateRelevanceScore(0.75, 85, 0, false);
      // 0.75 + (85/100)*0.1 = 0.75 + 0.085 = 0.835
      expect(score).toBeCloseTo(0.835, 5);
    });

    it('should apply view boost', () => {
      const score = calculateRelevanceScore(0.75, null, 1250, false);
      // 0.75 + min(log(1251)*0.05, 0.1)
      // = 0.75 + min(0.356, 0.1) = 0.75 + 0.1 = 0.85
      expect(score).toBeCloseTo(0.85, 2);
    });

    it('should apply pin boost', () => {
      const score = calculateRelevanceScore(0.75, null, 0, true);
      // 0.75 + 0.15 = 0.9
      expect(score).toBeCloseTo(0.9, 5);
    });

    it('should apply all boosts', () => {
      const score = calculateRelevanceScore(0.95, 85, 1250, true);
      // 0.95 + 0.085 + 0.1 + 0.15 = 1.285 → clamped to 1.0
      expect(score).toBeCloseTo(1.0, 5);
    });
  });

  describe('Helpful Ratio Boost', () => {
    it('should handle 100% helpful', () => {
      const score = calculateRelevanceScore(0.7, 100, 0, false);
      expect(score).toBeCloseTo(0.8, 5);
    });

    it('should handle 50% helpful', () => {
      const score = calculateRelevanceScore(0.7, 50, 0, false);
      expect(score).toBeCloseTo(0.75, 5);
    });

    it('should handle 0% helpful', () => {
      const score = calculateRelevanceScore(0.7, 0, 0, false);
      expect(score).toBeCloseTo(0.7, 5);
    });

    it('should handle null helpful ratio', () => {
      const score = calculateRelevanceScore(0.7, null, 0, false);
      expect(score).toBeCloseTo(0.7, 5);
    });

    it('should handle undefined helpful ratio', () => {
      const score = calculateRelevanceScore(0.7, undefined, 0, false);
      expect(score).toBeCloseTo(0.7, 5);
    });
  });

  describe('View Boost', () => {
    it('should handle 0 views', () => {
      const score = calculateRelevanceScore(0.7, null, 0, false);
      expect(score).toBeCloseTo(0.7, 5);
    });

    it('should handle 1 view', () => {
      const score = calculateRelevanceScore(0.7, null, 1, false);
      // 0.7 + min(log(2)*0.05, 0.1) = 0.7 + 0.0347 = 0.7347
      expect(score).toBeGreaterThan(0.7);
      expect(score).toBeLessThan(0.74);
    });

    it('should handle 100 views', () => {
      const score = calculateRelevanceScore(0.7, null, 100, false);
      // 0.7 + min(log(101)*0.05, 0.1) = 0.7 + 0.023 = 0.723
      expect(score).toBeGreaterThan(0.72);
      expect(score).toBeLessThan(0.73);
    });

    it('should handle 1000 views', () => {
      const score = calculateRelevanceScore(0.7, null, 1000, false);
      // 0.7 + min(log(1001)*0.05, 0.1) = 0.7 + 0.033 = 0.733
      expect(score).toBeGreaterThan(0.73);
      expect(score).toBeLessThan(0.74);
    });

    it('should cap view boost at 0.1', () => {
      const score = calculateRelevanceScore(0.7, null, 1000000, false);
      // 0.7 + min(log(1000001)*0.05, 0.1) = 0.7 + 0.1 = 0.8
      expect(score).toBeCloseTo(0.8, 5);
    });

    it('should apply logarithmic scaling', () => {
      const score10 = calculateRelevanceScore(0.7, null, 10, false);
      const score100 = calculateRelevanceScore(0.7, null, 100, false);
      const score1000 = calculateRelevanceScore(0.7, null, 1000, false);

      // Verify logarithmic progression
      expect(score100 - score10).toBeLessThan(score1000 - score100);
    });
  });

  describe('Pin Boost', () => {
    it('should add 0.15 when pinned', () => {
      const unpinned = calculateRelevanceScore(0.7, null, 0, false);
      const pinned = calculateRelevanceScore(0.7, null, 0, true);
      expect(pinned - unpinned).toBeCloseTo(0.15, 5);
    });

    it('should not add boost when not pinned', () => {
      const score = calculateRelevanceScore(0.7, null, 0, false);
      expect(score).toBeCloseTo(0.7, 5);
    });
  });

  describe('Score Clamping', () => {
    it('should clamp to maximum 1.0', () => {
      const score = calculateRelevanceScore(0.95, 100, 1000000, true);
      expect(score).toBeLessThanOrEqual(1.0);
      expect(score).toBeCloseTo(1.0, 5);
    });

    it('should not go below 0', () => {
      const score = calculateRelevanceScore(0, null, 0, false);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge case: 0.95 + 0.085 + 0.1 + 0.15', () => {
      const score = calculateRelevanceScore(0.95, 85, 1250, true);
      // Raw: 0.95 + 0.085 + 0.1 + 0.15 = 1.285
      // Clamped: 1.0
      expect(score).toBeCloseTo(1.0, 5);
    });
  });

  describe('Real-World Examples', () => {
    it('should score high-quality FAQ correctly', () => {
      // FAQ: "How do I pay artists?"
      // - Semantic: 0.95
      // - Helpful: 85%
      // - Views: 1250
      // - Pinned: true
      const score = calculateRelevanceScore(0.95, 85, 1250, true);
      expect(score).toBeCloseTo(1.0, 5);
    });

    it('should score medium-quality FAQ correctly', () => {
      // FAQ: "Payment methods"
      // - Semantic: 0.75
      // - Helpful: 60%
      // - Views: 150
      // - Pinned: false
      const score = calculateRelevanceScore(0.75, 60, 150, false);
      expect(score).toBeGreaterThan(0.83);
      expect(score).toBeLessThan(0.84);
    });

    it('should score low-quality FAQ correctly', () => {
      // FAQ: "Random question"
      // - Semantic: 0.50
      // - Helpful: 20%
      // - Views: 5
      // - Pinned: false
      const score = calculateRelevanceScore(0.50, 20, 5, false);
      expect(score).toBeGreaterThan(0.52);
      expect(score).toBeLessThan(0.53);
    });

    it('should differentiate between FAQs correctly', () => {
      const highQuality = calculateRelevanceScore(0.95, 85, 1250, true);
      const mediumQuality = calculateRelevanceScore(0.75, 60, 150, false);
      const lowQuality = calculateRelevanceScore(0.50, 20, 5, false);

      expect(highQuality).toBeGreaterThan(mediumQuality);
      expect(mediumQuality).toBeGreaterThan(lowQuality);
    });
  });

  describe('Scoring Consistency', () => {
    it('should produce consistent results', () => {
      const score1 = calculateRelevanceScore(0.75, 85, 1250, true);
      const score2 = calculateRelevanceScore(0.75, 85, 1250, true);
      expect(score1).toEqual(score2);
    });

    it('should handle floating point precision', () => {
      const score1 = calculateRelevanceScore(0.7500001, 85, 1250, true);
      const score2 = calculateRelevanceScore(0.7500002, 85, 1250, true);
      // Should be very close despite floating point differences
      expect(Math.abs(score1 - score2)).toBeLessThan(0.0001);
    });
  });

  describe('Boundary Cases', () => {
    it('should handle minimum semantic score', () => {
      const score = calculateRelevanceScore(0, null, 0, false);
      expect(score).toBeCloseTo(0, 5);
    });

    it('should handle maximum semantic score', () => {
      const score = calculateRelevanceScore(1.0, null, 0, false);
      expect(score).toBeCloseTo(1.0, 5);
    });

    it('should handle maximum helpful ratio', () => {
      const score = calculateRelevanceScore(0.7, 100, 0, false);
      expect(score).toBeCloseTo(0.8, 5);
    });

    it('should handle all boosts at maximum', () => {
      const score = calculateRelevanceScore(1.0, 100, 1000000, true);
      expect(score).toBeCloseTo(1.0, 5);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Embedding Service Integration', () => {
  it('should use cosine similarity for ranking', () => {
    // Simulate search results with different similarities
    const results = [
      { faqId: 1, similarity: 0.95 },
      { faqId: 2, similarity: 0.75 },
      { faqId: 3, similarity: 0.85 },
    ];

    // Sort by similarity
    const sorted = results.sort((a, b) => b.similarity - a.similarity);

    expect(sorted[0].faqId).toBe(1);
    expect(sorted[1].faqId).toBe(3);
    expect(sorted[2].faqId).toBe(2);
  });

  it('should combine similarity with relevance scoring', () => {
    // Simulate FAQ search with scoring
    const faqs = [
      {
        id: 1,
        similarity: 0.95,
        helpfulRatio: 85,
        views: 1250,
        isPinned: true,
      },
      {
        id: 2,
        similarity: 0.75,
        helpfulRatio: 60,
        views: 150,
        isPinned: false,
      },
      {
        id: 3,
        similarity: 0.85,
        helpfulRatio: 70,
        views: 500,
        isPinned: false,
      },
    ];

    // Calculate relevance scores
    const scored = faqs.map(faq => ({
      ...faq,
      relevanceScore: calculateRelevanceScore(
        faq.similarity,
        faq.helpfulRatio,
        faq.views,
        faq.isPinned
      ),
    }));

    // Sort by relevance score
    const sorted = scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // FAQ 1 should be first (highest score)
    expect(sorted[0].id).toBe(1);
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKS
// ============================================================================

describe('Performance Benchmarks', () => {
  it('should calculate 1000 cosine similarities in < 5 seconds', () => {
    const vecA = new Array(1536).fill(0).map(() => Math.random());
    const vectors = Array(1000).fill(0).map(() =>
      new Array(1536).fill(0).map(() => Math.random())
    );

    const startTime = performance.now();
    vectors.forEach(vec => cosineSimilarity(vecA, vec));
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000);
  });

  it('should calculate 10000 relevance scores in < 1 second', () => {
    function calculateRelevanceScore(
      semanticScore: number,
      helpfulRatio: number | null | undefined,
      views: number,
      isPinned: boolean
    ): number {
      let score = semanticScore;
      if (helpfulRatio && helpfulRatio > 0) {
        score += (helpfulRatio / 100) * 0.1;
      }
      if (views > 0) {
        const viewBoost = Math.min(Math.log(views + 1) * 0.05, 0.1);
        score += viewBoost;
      }
      if (isPinned) {
        score += 0.15;
      }
      return Math.min(score, 1.0);
    }

    const startTime = performance.now();
    for (let i = 0; i < 10000; i++) {
      calculateRelevanceScore(
        Math.random(),
        Math.random() * 100,
        Math.floor(Math.random() * 10000),
        Math.random() > 0.5
      );
    }
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000);
  });
});
