import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Tests for Open Graph meta tags across all public pages.
 * Verifies that each page imports and calls setMetaTags with the correct pageMetaTags preset.
 */

const CLIENT_PAGES_DIR = path.join(__dirname, '..', 'client', 'src', 'pages');
const UTILS_DIR = path.join(__dirname, '..', 'client', 'src', 'utils');

describe('Open Graph Meta Tags - seoMeta Utility', () => {
  const seoMetaSrc = fs.readFileSync(path.join(UTILS_DIR, 'seoMeta.ts'), 'utf-8');

  it('should export setMetaTags function', () => {
    expect(seoMetaSrc).toContain('export function setMetaTags');
  });

  it('should export pageMetaTags object', () => {
    expect(seoMetaSrc).toContain('export const pageMetaTags');
  });

  it('should define DEFAULT_OG_IMAGE with the correct CDN URL', () => {
    expect(seoMetaSrc).toContain('const DEFAULT_OG_IMAGE');
    expect(seoMetaSrc).toContain('files.manuscdn.com');
  });

  it('should define BASE_URL as www.ologywood.com', () => {
    expect(seoMetaSrc).toContain("const BASE_URL = 'https://www.ologywood.com'");
  });

  it('should define SITE_NAME as Ologywood', () => {
    expect(seoMetaSrc).toContain("const SITE_NAME = 'Ologywood'");
  });

  describe('pageMetaTags presets', () => {
    const requiredPresets = ['home', 'browse', 'events', 'pricing', 'howItWorks', 'faq', 'help', 'contact', 'venues'];

    requiredPresets.forEach(preset => {
      it(`should define ${preset} preset`, () => {
        expect(seoMetaSrc).toContain(`${preset}:`);
      });
    });

    it('should define artistProfile as a function accepting artistName, artistId, and artistImage', () => {
      expect(seoMetaSrc).toContain('artistProfile:');
      expect(seoMetaSrc).toMatch(/artistProfile:\s*\(artistName.*artistId.*artistImage/);
    });

    it('should define venueProfile as a function accepting venueName, venueId, and venueImage', () => {
      expect(seoMetaSrc).toContain('venueProfile:');
      expect(seoMetaSrc).toMatch(/venueProfile:\s*\(venueName.*venueId.*venueImage/);
    });

    it('should define eventDetail as a function accepting eventTitle, eventId, eventImage, and eventDescription', () => {
      expect(seoMetaSrc).toContain('eventDetail:');
      expect(seoMetaSrc).toMatch(/eventDetail:\s*\(eventTitle.*eventId.*eventImage.*eventDescription/);
    });
  });

  describe('setMetaTags function', () => {
    it('should update og:title', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:title'");
    });

    it('should update og:description', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:description'");
    });

    it('should update og:image with fallback to DEFAULT_OG_IMAGE', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:image'");
      expect(seoMetaSrc).toContain('DEFAULT_OG_IMAGE');
    });

    it('should update og:url', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:url'");
    });

    it('should update og:type', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:type'");
    });

    it('should update og:site_name', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:site_name'");
    });

    it('should update og:image:width and og:image:height', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('og:image:width'");
      expect(seoMetaSrc).toContain("updateMetaTag('og:image:height'");
    });

    it('should update twitter:card', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('twitter:card'");
    });

    it('should update twitter:title', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('twitter:title'");
    });

    it('should update twitter:description', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('twitter:description'");
    });

    it('should update twitter:image', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('twitter:image'");
    });

    it('should update twitter:url', () => {
      expect(seoMetaSrc).toContain("updateMetaTag('twitter:url'");
    });

    it('should update canonical URL', () => {
      expect(seoMetaSrc).toContain('updateCanonicalTag');
    });

    it('should update document.title', () => {
      expect(seoMetaSrc).toContain('document.title = config.title');
    });
  });

  describe('Each preset should include ogUrl with correct path', () => {
    it('home ogUrl should be BASE_URL', () => {
      expect(seoMetaSrc).toMatch(/home:[\s\S]*?ogUrl:\s*BASE_URL/);
    });

    it('browse ogUrl should include /browse', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/browse`");
    });

    it('events ogUrl should include /events', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/events`");
    });

    it('pricing ogUrl should include /pricing', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/pricing`");
    });

    it('howItWorks ogUrl should include /how-it-works', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/how-it-works`");
    });

    it('faq ogUrl should include /faq', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/faq`");
    });

    it('help ogUrl should include /help', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/help`");
    });

    it('contact ogUrl should include /contact', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/contact`");
    });

    it('venues ogUrl should include /venues', () => {
      expect(seoMetaSrc).toContain("ogUrl: `${BASE_URL}/venues`");
    });
  });
});

describe('Open Graph Meta Tags - Page Integration', () => {
  const pagesWithOG: Array<{ name: string; file: string; preset: string }> = [
    { name: 'Home', file: 'Home.tsx', preset: 'pageMetaTags.home' },
    { name: 'Browse', file: 'Browse.tsx', preset: 'pageMetaTags.browse' },
    { name: 'EventDiscovery', file: 'EventDiscovery.tsx', preset: 'pageMetaTags.events' },
    { name: 'EventDetail', file: 'EventDetail.tsx', preset: 'pageMetaTags.eventDetail' },
    { name: 'ArtistProfile', file: 'ArtistProfile.tsx', preset: 'pageMetaTags.artistProfile' },
    { name: 'VenueProfile', file: 'VenueProfile.tsx', preset: 'pageMetaTags.venueProfile' },
    { name: 'VenueBrowse', file: 'VenueBrowse.tsx', preset: 'pageMetaTags.venues' },
    { name: 'Pricing', file: 'Pricing.tsx', preset: 'pageMetaTags.pricing' },
    { name: 'HowItWorks', file: 'HowItWorks.tsx', preset: 'pageMetaTags.howItWorks' },
    { name: 'FAQ', file: 'FAQ.tsx', preset: 'pageMetaTags.faq' },
    { name: 'Help', file: 'Help.tsx', preset: 'pageMetaTags.help' },
    { name: 'Contact', file: 'Contact.tsx', preset: 'pageMetaTags.contact' },
  ];

  pagesWithOG.forEach(({ name, file, preset }) => {
    describe(`${name} page`, () => {
      const filePath = path.join(CLIENT_PAGES_DIR, file);
      const exists = fs.existsSync(filePath);

      it(`should exist at ${file}`, () => {
        expect(exists).toBe(true);
      });

      if (exists) {
        const src = fs.readFileSync(filePath, 'utf-8');

        it('should import setMetaTags from seoMeta', () => {
          expect(src).toContain('setMetaTags');
          expect(src).toContain('seoMeta');
        });

        it('should import pageMetaTags from seoMeta', () => {
          expect(src).toContain('pageMetaTags');
        });

        it(`should call setMetaTags with ${preset}`, () => {
          expect(src).toContain('setMetaTags(');
          expect(src).toContain(preset);
        });

        it('should call setMetaTags inside useEffect', () => {
          expect(src).toContain('useEffect');
          // Check that setMetaTags appears after a useEffect
          const useEffectIdx = src.indexOf('useEffect');
          const setMetaIdx = src.indexOf('setMetaTags(', useEffectIdx);
          expect(setMetaIdx).toBeGreaterThan(useEffectIdx);
        });
      }
    });
  });
});

describe('Open Graph Meta Tags - index.html static fallbacks', () => {
  const indexPath = path.join(__dirname, '..', 'client', 'index.html');
  const indexSrc = fs.readFileSync(indexPath, 'utf-8');

  it('should have og:type meta tag', () => {
    expect(indexSrc).toContain('property="og:type"');
  });

  it('should have og:title meta tag', () => {
    expect(indexSrc).toContain('property="og:title"');
  });

  it('should have og:description meta tag', () => {
    expect(indexSrc).toContain('property="og:description"');
  });

  it('should have og:image meta tag', () => {
    expect(indexSrc).toContain('property="og:image"');
  });

  it('should have og:url meta tag', () => {
    expect(indexSrc).toContain('property="og:url"');
  });

  it('should have og:site_name meta tag', () => {
    expect(indexSrc).toContain('property="og:site_name"');
  });

  it('should have twitter:card meta tag', () => {
    expect(indexSrc).toContain('name="twitter:card"');
  });

  it('should have twitter:title meta tag', () => {
    expect(indexSrc).toContain('name="twitter:title"');
  });

  it('should have twitter:description meta tag', () => {
    expect(indexSrc).toContain('name="twitter:description"');
  });

  it('should have twitter:image meta tag', () => {
    expect(indexSrc).toContain('name="twitter:image"');
  });

  it('should use the correct OG image CDN URL', () => {
    expect(indexSrc).toContain('files.manuscdn.com');
  });

  it('should reference www.ologywood.com in og:url', () => {
    expect(indexSrc).toContain('https://www.ologywood.com');
  });
});
