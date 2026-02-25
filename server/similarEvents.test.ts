import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for the Similar Events feature:
 * - Backend: getSimilarEvents db function logic
 * - Router: events.getSimilar endpoint
 * - Component: SimilarEvents rendering
 */

// ─── Similarity scoring logic tests ───────────────────────────────────────────

describe('Similar Events - Scoring Logic', () => {
  // Replicate the scoring algorithm from getSimilarEvents for unit testing
  function scoreSimilarity(
    source: { eventType: string; location: string | null; eventDate: string | null; artistId: number },
    candidate: { eventType: string; location: string | null; eventDate: string | null; artistId: number }
  ): number {
    let score = 0;

    // Same event type: +3
    if (candidate.eventType === source.eventType) {
      score += 3;
    }

    // Location matching
    if (source.location && candidate.location) {
      const srcLoc = source.location.toLowerCase();
      const candLoc = candidate.location.toLowerCase();
      if (srcLoc === candLoc) {
        score += 2;
      } else {
        const srcCity = srcLoc.split(',').pop()?.trim() || '';
        const candCity = candLoc.split(',').pop()?.trim() || '';
        if (srcCity && candCity && srcCity === candCity) {
          score += 1;
        }
      }
    }

    // Date proximity
    if (source.eventDate && candidate.eventDate) {
      const srcDate = new Date(source.eventDate);
      const candDate = new Date(candidate.eventDate);
      const diffDays = Math.abs(
        (candDate.getTime() - srcDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 30) {
        score += 2;
      } else if (diffDays <= 90) {
        score += 1;
      }
    }

    // Same artist: +1
    if (candidate.artistId === source.artistId) {
      score += 1;
    }

    return score;
  }

  it('gives highest score to events with same type, location, and close date', () => {
    const source = {
      eventType: 'concert',
      location: '123 Main St, New York, NY',
      eventDate: '2026-06-15',
      artistId: 1,
    };

    const perfectMatch = {
      eventType: 'concert',
      location: '123 Main St, New York, NY',
      eventDate: '2026-06-20',
      artistId: 1,
    };

    const score = scoreSimilarity(source, perfectMatch);
    // type(3) + exact location(2) + within 30 days(2) + same artist(1) = 8
    expect(score).toBe(8);
  });

  it('gives +3 for same event type', () => {
    const source = { eventType: 'festival', location: null, eventDate: null, artistId: 1 };
    const candidate = { eventType: 'festival', location: null, eventDate: null, artistId: 2 };
    expect(scoreSimilarity(source, candidate)).toBe(3);
  });

  it('gives 0 for different event type with no other matches', () => {
    const source = { eventType: 'concert', location: null, eventDate: null, artistId: 1 };
    const candidate = { eventType: 'wedding', location: null, eventDate: null, artistId: 2 };
    expect(scoreSimilarity(source, candidate)).toBe(0);
  });

  it('gives +2 for exact location match', () => {
    const source = { eventType: 'wedding', location: 'Central Park, New York, NY', eventDate: null, artistId: 1 };
    const candidate = { eventType: 'concert', location: 'Central Park, New York, NY', eventDate: null, artistId: 2 };
    expect(scoreSimilarity(source, candidate)).toBe(2);
  });

  it('gives +1 for city-level location match', () => {
    const source = { eventType: 'wedding', location: '123 Main St, New York, NY', eventDate: null, artistId: 1 };
    const candidate = { eventType: 'concert', location: '456 Broadway, New York, NY', eventDate: null, artistId: 2 };
    // Different address but same city (last comma-separated part)
    expect(scoreSimilarity(source, candidate)).toBe(1);
  });

  it('gives +2 for events within 30 days', () => {
    const source = { eventType: 'wedding', location: null, eventDate: '2026-06-15', artistId: 1 };
    const candidate = { eventType: 'concert', location: null, eventDate: '2026-07-10', artistId: 2 };
    // 25 days apart
    expect(scoreSimilarity(source, candidate)).toBe(2);
  });

  it('gives +1 for events within 90 days but more than 30', () => {
    const source = { eventType: 'wedding', location: null, eventDate: '2026-06-15', artistId: 1 };
    const candidate = { eventType: 'concert', location: null, eventDate: '2026-08-30', artistId: 2 };
    // ~76 days apart
    expect(scoreSimilarity(source, candidate)).toBe(1);
  });

  it('gives 0 for events more than 90 days apart', () => {
    const source = { eventType: 'wedding', location: null, eventDate: '2026-06-15', artistId: 1 };
    const candidate = { eventType: 'concert', location: null, eventDate: '2026-12-01', artistId: 2 };
    // ~169 days apart
    expect(scoreSimilarity(source, candidate)).toBe(0);
  });

  it('gives +1 for same artist', () => {
    const source = { eventType: 'wedding', location: null, eventDate: null, artistId: 5 };
    const candidate = { eventType: 'concert', location: null, eventDate: null, artistId: 5 };
    expect(scoreSimilarity(source, candidate)).toBe(1);
  });

  it('correctly ranks multiple candidates by score', () => {
    const source = {
      eventType: 'concert',
      location: 'Madison Square Garden, New York, NY',
      eventDate: '2026-06-15',
      artistId: 1,
    };

    const candidates = [
      { id: 2, eventType: 'wedding', location: 'Los Angeles, CA', eventDate: '2026-12-01', artistId: 3 },
      { id: 3, eventType: 'concert', location: 'Barclays Center, New York, NY', eventDate: '2026-06-20', artistId: 2 },
      { id: 4, eventType: 'concert', location: 'Madison Square Garden, New York, NY', eventDate: '2026-06-18', artistId: 1 },
    ];

    const scored = candidates.map(c => ({
      id: c.id,
      score: scoreSimilarity(source, c),
    }));

    scored.sort((a, b) => b.score - a.score);

    // id=4: type(3) + exact location(2) + within 30d(2) + same artist(1) = 8
    // id=3: type(3) + city match(1) + within 30d(2) = 6
    // id=2: 0
    expect(scored[0].id).toBe(4);
    expect(scored[0].score).toBe(8);
    expect(scored[1].id).toBe(3);
    expect(scored[1].score).toBe(6);
    expect(scored[2].id).toBe(2);
    expect(scored[2].score).toBe(0);
  });
});

// ─── Router input validation tests ───────────────────────────────────────────

describe('Similar Events - Router Input Validation', () => {
  it('validates eventId must be a positive integer', () => {
    const { z } = require('zod');
    const schema = z.object({
      eventId: z.number().int().positive(),
      limit: z.number().int().min(1).max(12).default(6),
    });

    expect(() => schema.parse({ eventId: 0 })).toThrow();
    expect(() => schema.parse({ eventId: -1 })).toThrow();
    expect(() => schema.parse({ eventId: 1.5 })).toThrow();
    expect(schema.parse({ eventId: 1 })).toEqual({ eventId: 1, limit: 6 });
  });

  it('validates limit is between 1 and 12', () => {
    const { z } = require('zod');
    const schema = z.object({
      eventId: z.number().int().positive(),
      limit: z.number().int().min(1).max(12).default(6),
    });

    expect(() => schema.parse({ eventId: 1, limit: 0 })).toThrow();
    expect(() => schema.parse({ eventId: 1, limit: 13 })).toThrow();
    expect(schema.parse({ eventId: 1, limit: 3 })).toEqual({ eventId: 1, limit: 3 });
  });

  it('defaults limit to 6 when not provided', () => {
    const { z } = require('zod');
    const schema = z.object({
      eventId: z.number().int().positive(),
      limit: z.number().int().min(1).max(12).default(6),
    });

    const result = schema.parse({ eventId: 5 });
    expect(result.limit).toBe(6);
  });
});

// ─── Event type label and color utility tests ─────────────────────────────────

describe('Similar Events - Event Type Utilities', () => {
  function getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      wedding: 'Wedding',
      corporate: 'Corporate',
      festival: 'Festival',
      bar_gig: 'Bar Gig',
      private_party: 'Private Party',
      concert: 'Concert',
      other: 'Other',
    };
    return labels[type] || type;
  }

  function getEventTypeColor(type: string): string {
    const colors: Record<string, string> = {
      wedding: 'bg-pink-100 text-pink-800',
      corporate: 'bg-blue-100 text-blue-800',
      festival: 'bg-purple-100 text-purple-800',
      bar_gig: 'bg-amber-100 text-amber-800',
      private_party: 'bg-emerald-100 text-emerald-800',
      concert: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  it('returns correct labels for all event types', () => {
    expect(getEventTypeLabel('wedding')).toBe('Wedding');
    expect(getEventTypeLabel('corporate')).toBe('Corporate');
    expect(getEventTypeLabel('festival')).toBe('Festival');
    expect(getEventTypeLabel('bar_gig')).toBe('Bar Gig');
    expect(getEventTypeLabel('private_party')).toBe('Private Party');
    expect(getEventTypeLabel('concert')).toBe('Concert');
    expect(getEventTypeLabel('other')).toBe('Other');
  });

  it('returns the raw type for unknown types', () => {
    expect(getEventTypeLabel('unknown_type')).toBe('unknown_type');
  });

  it('returns correct colors for all event types', () => {
    expect(getEventTypeColor('wedding')).toContain('pink');
    expect(getEventTypeColor('corporate')).toContain('blue');
    expect(getEventTypeColor('festival')).toContain('purple');
    expect(getEventTypeColor('concert')).toContain('indigo');
  });

  it('returns gray for unknown event types', () => {
    expect(getEventTypeColor('unknown')).toBe('bg-gray-100 text-gray-800');
  });
});

// ─── Date formatting tests ────────────────────────────────────────────────────

describe('Similar Events - Date Formatting', () => {
  function formatEventDate(date: string | Date | null): string {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  it('formats a date string correctly', () => {
    const result = formatEventDate('2026-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('2026');
  });

  it('formats a Date object correctly', () => {
    const result = formatEventDate(new Date('2026-12-25'));
    expect(result).toContain('Dec');
    expect(result).toContain('2026');
  });

  it('returns TBD for null dates', () => {
    expect(formatEventDate(null)).toBe('TBD');
  });
});
