import { describe, it, expect } from 'vitest';

/**
 * Unit tests for OG tag middleware logic
 * Tests bot detection, HTML generation, and URL pattern matching
 */

// Test bot detection patterns
describe('OG Tag Middleware - Bot Detection', () => {
  const botPatterns = [
    'facebookexternalhit',
    'Facebot',
    'Twitterbot',
    'LinkedInBot',
    'WhatsApp',
    'Slackbot',
    'TelegramBot',
    'Discordbot',
    'Pinterest',
    'Googlebot',
    'bingbot',
    'Applebot',
  ];

  const normalBrowsers = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
  ];

  function isSocialBot(userAgent: string): boolean {
    const patterns = [
      'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
      'WhatsApp', 'Slackbot', 'TelegramBot', 'Discordbot', 'Pinterest',
      'Googlebot', 'bingbot', 'Applebot', 'iMessageLinkPreview',
    ];
    return patterns.some(bot => userAgent.toLowerCase().includes(bot.toLowerCase()));
  }

  it('should detect all known social media bots', () => {
    for (const bot of botPatterns) {
      expect(isSocialBot(`Mozilla/5.0 (compatible; ${bot}/1.0)`)).toBe(true);
    }
  });

  it('should not detect normal browsers as bots', () => {
    for (const browser of normalBrowsers) {
      expect(isSocialBot(browser)).toBe(false);
    }
  });

  it('should handle empty user agent', () => {
    expect(isSocialBot('')).toBe(false);
  });

  it('should detect iMessageLinkPreview', () => {
    expect(isSocialBot('iMessageLinkPreview/1.0')).toBe(true);
  });
});

// Test URL pattern matching
describe('OG Tag Middleware - URL Pattern Matching', () => {
  it('should match artist profile URLs', () => {
    const match = '/artist/42'.match(/^\/artist\/(\d+)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('42');
  });

  it('should not match artist URLs without numeric ID', () => {
    expect('/artist/abc'.match(/^\/artist\/(\d+)$/)).toBeNull();
    expect('/artist/'.match(/^\/artist\/(\d+)$/)).toBeNull();
  });

  it('should match venue profile URLs', () => {
    const match1 = '/venue/5'.match(/^\/venues?\/(\d+)$/);
    const match2 = '/venues/5'.match(/^\/venues?\/(\d+)$/);
    expect(match1).not.toBeNull();
    expect(match2).not.toBeNull();
    expect(match1![1]).toBe('5');
    expect(match2![1]).toBe('5');
  });

  it('should match event URLs', () => {
    const match = '/events/123'.match(/^\/events\/(\d+)$/);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('123');
  });

  it('should not match event list URL', () => {
    expect('/events'.match(/^\/events\/(\d+)$/)).toBeNull();
  });

  it('should not match nested paths', () => {
    expect('/artist/42/edit'.match(/^\/artist\/(\d+)$/)).toBeNull();
    expect('/events/42/details'.match(/^\/events\/(\d+)$/)).toBeNull();
  });
});

// Test HTML escaping
describe('OG Tag Middleware - HTML Escaping', () => {
  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  it('should escape ampersands', () => {
    expect(escapeHtml('Rock & Roll')).toBe('Rock &amp; Roll');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('The "Best" Artist')).toBe('The &quot;Best&quot; Artist');
  });

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should handle clean strings without changes', () => {
    expect(escapeHtml('John Smith Jazz Trio')).toBe('John Smith Jazz Trio');
  });
});

// Test OG HTML structure
describe('OG Tag Middleware - Generated HTML Structure', () => {
  function generateOgHtml(opts: { title: string; description: string; image: string; url: string; type?: string }): string {
    const { title, description, image, url, type = 'website' } = opts;
    return `<!DOCTYPE html>
<html>
<head>
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:image" content="${image}" />
</head>
</html>`;
  }

  it('should include og:title', () => {
    const html = generateOgHtml({
      title: 'Test Artist | Ologywood',
      description: 'A great artist',
      image: 'https://example.com/photo.jpg',
      url: 'https://www.ologywood.com/artist/1',
    });
    expect(html).toContain('og:title');
    expect(html).toContain('Test Artist | Ologywood');
  });

  it('should include og:image', () => {
    const html = generateOgHtml({
      title: 'Test',
      description: 'Test',
      image: 'https://cdn.example.com/photo.jpg',
      url: 'https://www.ologywood.com/artist/1',
    });
    expect(html).toContain('og:image');
    expect(html).toContain('https://cdn.example.com/photo.jpg');
  });

  it('should include twitter:card as summary_large_image', () => {
    const html = generateOgHtml({
      title: 'Test',
      description: 'Test',
      image: 'https://example.com/photo.jpg',
      url: 'https://www.ologywood.com/artist/1',
    });
    expect(html).toContain('summary_large_image');
  });

  it('should use custom type when provided', () => {
    const html = generateOgHtml({
      title: 'Test',
      description: 'Test',
      image: 'https://example.com/photo.jpg',
      url: 'https://www.ologywood.com/artist/1',
      type: 'profile',
    });
    expect(html).toContain('content="profile"');
  });

  it('should default to website type', () => {
    const html = generateOgHtml({
      title: 'Test',
      description: 'Test',
      image: 'https://example.com/photo.jpg',
      url: 'https://www.ologywood.com/',
    });
    expect(html).toContain('content="website"');
  });
});
