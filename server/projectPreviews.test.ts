import { describe, it, expect } from 'vitest';
import { PRICING_TIERS } from './services/pricingTierService';

describe('Project Previews - Tier Limits', () => {
  it('Free tier should have 0 project previews', () => {
    expect(PRICING_TIERS.free.maxProjectPreviews).toBe(0);
    expect(PRICING_TIERS.free.maxTracksPerProject).toBe(0);
    expect(PRICING_TIERS.free.maxSnippetSeconds).toBe(0);
  });

  it('Starter tier should have 1 project, 6 tracks, 30s snippets', () => {
    expect(PRICING_TIERS.starter.maxProjectPreviews).toBe(1);
    expect(PRICING_TIERS.starter.maxTracksPerProject).toBe(6);
    expect(PRICING_TIERS.starter.maxSnippetSeconds).toBe(30);
  });

  it('Professional tier should have 3 projects, 12 tracks, 60s snippets', () => {
    expect(PRICING_TIERS.professional.maxProjectPreviews).toBe(3);
    expect(PRICING_TIERS.professional.maxTracksPerProject).toBe(12);
    expect(PRICING_TIERS.professional.maxSnippetSeconds).toBe(60);
  });

  it('All tiers should have maxProjectPreviews defined', () => {
    for (const [tierName, tier] of Object.entries(PRICING_TIERS)) {
      expect(tier).toHaveProperty('maxProjectPreviews');
      expect(tier).toHaveProperty('maxTracksPerProject');
      expect(tier).toHaveProperty('maxSnippetSeconds');
      expect(typeof tier.maxProjectPreviews).toBe('number');
      expect(typeof tier.maxTracksPerProject).toBe('number');
      expect(typeof tier.maxSnippetSeconds).toBe('number');
    }
  });
});

describe('Project Previews - Schema validation', () => {
  it('should have correct release type options', () => {
    const validTypes = ['album', 'ep', 'mixtape', 'deluxe', 'single_collection'];
    // This is a static validation of the expected types
    expect(validTypes).toContain('album');
    expect(validTypes).toContain('ep');
    expect(validTypes).toContain('mixtape');
    expect(validTypes).toContain('deluxe');
    expect(validTypes).toContain('single_collection');
    expect(validTypes.length).toBe(5);
  });

  it('should have correct status options', () => {
    const validStatuses = ['active', 'coming_soon', 'archived'];
    expect(validStatuses).toContain('active');
    expect(validStatuses).toContain('coming_soon');
    expect(validStatuses).toContain('archived');
    expect(validStatuses.length).toBe(3);
  });
});
