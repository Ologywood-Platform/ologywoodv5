import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('OG Meta Injection Middleware', () => {
  const middlewarePath = path.join(__dirname, '..', 'middleware', 'ogMetaInjection.ts');
  const middlewareSrc = fs.readFileSync(middlewarePath, 'utf-8');

  describe('Crawler Detection', () => {
    it('should detect Facebook crawler', () => {
      expect(middlewareSrc).toContain('facebookexternalhit');
      expect(middlewareSrc).toContain('Facebot');
    });

    it('should detect Twitter crawler', () => {
      expect(middlewareSrc).toContain('Twitterbot');
    });

    it('should detect WhatsApp crawler', () => {
      expect(middlewareSrc).toContain('WhatsApp');
    });

    it('should detect LinkedIn crawler', () => {
      expect(middlewareSrc).toContain('LinkedInBot');
    });

    it('should detect iMessage link preview', () => {
      expect(middlewareSrc).toContain('Applebot');
    });

    it('should detect Discord crawler', () => {
      expect(middlewareSrc).toContain('Discordbot');
    });

    it('should detect Slack crawler', () => {
      expect(middlewareSrc).toContain('Slackbot');
    });

    it('should detect Telegram crawler', () => {
      expect(middlewareSrc).toContain('TelegramBot');
    });
  });

  describe('Artist Profile OG Tags', () => {
    it('should match /artist/:id route pattern', () => {
      expect(middlewareSrc).toContain("/^\\/artist\\/(\\d+)$/");
    });

    it('should inject og:title with artist name', () => {
      expect(middlewareSrc).toContain('artistName');
      expect(middlewareSrc).toContain('og:title');
    });

    it('should inject og:description with genre, location, and bio', () => {
      expect(middlewareSrc).toContain('genre');
      expect(middlewareSrc).toContain('location');
      expect(middlewareSrc).toContain('bio');
      expect(middlewareSrc).toContain('og:description');
    });

    it('should inject og:image with artist profile photo', () => {
      expect(middlewareSrc).toContain('profilePhotoUrl');
      expect(middlewareSrc).toContain('og:image');
    });

    it('should set og:type to profile for artist pages', () => {
      expect(middlewareSrc).toContain('"profile"');
    });

    it('should inject twitter card meta tags', () => {
      expect(middlewareSrc).toContain('twitter:title');
      expect(middlewareSrc).toContain('twitter:description');
      expect(middlewareSrc).toContain('twitter:image');
      expect(middlewareSrc).toContain('twitter:url');
    });

    it('should use www.ologywood.com as the base URL', () => {
      expect(middlewareSrc).toContain('https://www.ologywood.com');
    });

    it('should have a fallback OG image', () => {
      expect(middlewareSrc).toContain('DEFAULT_OG_IMAGE');
    });

    it('should escape HTML entities to prevent XSS', () => {
      expect(middlewareSrc).toContain('escapeHtml');
      expect(middlewareSrc).toContain('&amp;');
      expect(middlewareSrc).toContain('&quot;');
      expect(middlewareSrc).toContain('&lt;');
      expect(middlewareSrc).toContain('&gt;');
    });
  });

  describe('Venue Profile OG Tags', () => {
    it('should match /venue/:id route pattern', () => {
      expect(middlewareSrc).toContain("/^\\/venue\\/(\\d+)$/");
    });

    it('should inject venue-specific meta tags', () => {
      expect(middlewareSrc).toContain('venueName');
      expect(middlewareSrc).toContain('venueType');
    });
  });

  describe('Event OG Tags', () => {
    it('should match /events/:id route pattern', () => {
      expect(middlewareSrc).toContain("/^\\/events\\/(\\d+)$/");
    });

    it('should inject event-specific meta tags', () => {
      expect(middlewareSrc).toContain('eventTitle');
      expect(middlewareSrc).toContain('flyerImageUrl');
    });

    it('should set og:type to event for event pages', () => {
      expect(middlewareSrc).toContain('"event"');
    });
  });

  describe('Server Integration', () => {
    const indexTsPath = path.join(__dirname, '..', 'index.ts');
    const indexTsSrc = fs.readFileSync(indexTsPath, 'utf-8');

    it('should import OG meta injection middleware in server/index.ts', () => {
      expect(indexTsSrc).toContain('ogMetaInjectionMiddleware');
      expect(indexTsSrc).toContain('venueOgMetaInjectionMiddleware');
      expect(indexTsSrc).toContain('eventOgMetaInjectionMiddleware');
    });

    it('should mount OG middleware before SPA fallback', () => {
      const ogIndex = indexTsSrc.indexOf('ogMetaInjectionMiddleware(publicPath)');
      const spaIndex = indexTsSrc.indexOf("Serve index.html for all other routes");
      expect(ogIndex).toBeGreaterThan(-1);
      expect(spaIndex).toBeGreaterThan(-1);
      expect(ogIndex).toBeLessThan(spaIndex);
    });

    it('should pass through to SPA for regular browsers (non-crawlers)', () => {
      expect(middlewareSrc).toContain('isCrawler');
      expect(middlewareSrc).toContain('return next()');
    });
  });
});
