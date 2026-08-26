import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('OG Meta Tags Middleware (ogTags.ts)', () => {
  const middlewarePath = path.join(__dirname, '..', 'middleware', 'ogTags.ts');
  const middlewareSrc = fs.readFileSync(middlewarePath, 'utf-8');

  describe('Homepage Social Preview', () => {
    const expectedTitle = 'Build Your Brand. Grow Your Fans. Create More Opportunities.';
    const expectedDescription = 'Creators own their audience. Creators choose where their content lives.';
    const expectedImage = 'ologywood-social-preview-2026_af1c0d6d.png';
    const clientIndexPath = path.join(__dirname, '..', '..', 'client', 'index.html');
    const clientIndexSrc = fs.readFileSync(clientIndexPath, 'utf-8');

    it('serves the current hero title and creator-commerce message to crawlers', () => {
      expect(middlewareSrc).toContain(`const HOME_TITLE = '${expectedTitle}'`);
      expect(middlewareSrc).toContain(expectedDescription);
    });

    it('uses the same cache-busted 1200x630 preview image for crawlers and browsers', () => {
      expect(middlewareSrc).toContain(expectedImage);
      expect(clientIndexSrc).toContain(expectedImage);
      expect(clientIndexSrc).toContain('og:image:width" content="1200');
      expect(clientIndexSrc).toContain('og:image:height" content="630');
    });

    it('includes secure image, alt text, Twitter URL, and canonical metadata', () => {
      expect(middlewareSrc).toContain('og:image:secure_url');
      expect(middlewareSrc).toContain('og:image:alt');
      expect(middlewareSrc).toContain('twitter:image:alt');
      expect(middlewareSrc).toContain('twitter:url');
      expect(middlewareSrc).toContain('rel="canonical"');
    });
  });

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
      expect(middlewareSrc).toContain('iMessageLinkPreview');
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

    it('should detect Reddit bot', () => {
      expect(middlewareSrc).toContain('redditbot');
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

    it('should use OG image proxy for artist profile photos', () => {
      expect(middlewareSrc).toContain('getOgImageUrl');
      expect(middlewareSrc).toContain('/api/og-image/');
    });

    it('should set og:type to profile for artist pages', () => {
      expect(middlewareSrc).toContain("'profile'");
    });

    it('should inject twitter card meta tags', () => {
      expect(middlewareSrc).toContain('twitter:title');
      expect(middlewareSrc).toContain('twitter:description');
      expect(middlewareSrc).toContain('twitter:image');
      expect(middlewareSrc).toContain('twitter:card');
      expect(middlewareSrc).toContain('summary_large_image');
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

    it('should resolve clean artist slugs and provide entity-specific image alt text', () => {
      expect(middlewareSrc).toContain('const artistMatch = pathname.match');
      expect(middlewareSrc).toContain('Support both /artist/11 and /artist/adonis');
      expect(middlewareSrc).toContain('artist profile on OlogyWood');
    });
  });

  describe('Venue Profile OG Tags', () => {
    it('should match /venue/:id or /venues/:id route pattern', () => {
      expect(middlewareSrc).toContain("/^\\/venues?\\/(\\d+)$/");
    });

    it('should inject venue-specific meta tags', () => {
      expect(middlewareSrc).toContain('organizationName');
      expect(middlewareSrc).toContain('venueType');
    });

    it('should use OG image proxy for venue profile photos', () => {
      expect(middlewareSrc).toContain("'venue'");
      expect(middlewareSrc).toContain('getOgImageUrl');
    });

    it('should resolve clean venue slugs and provide entity-specific image alt text', () => {
      expect(middlewareSrc).toContain('const venueMatch = pathname.match');
      expect(middlewareSrc).toContain('Support both /venue/1 and /venue/ologist');
      expect(middlewareSrc).toContain('venue profile on OlogyWood');
    });
  });

  describe('Merch Product OG Tags', () => {
    const appPath = path.join(__dirname, '..', '..', 'client', 'src', 'App.tsx');
    const appSrc = fs.readFileSync(appPath, 'utf-8');
    const slugifyPath = path.join(__dirname, '..', '..', 'client', 'src', 'lib', 'slugify.ts');
    const slugifySrc = fs.readFileSync(slugifyPath, 'utf-8');

    it('should match clean product-title-and-id merch URLs', () => {
      expect(middlewareSrc).toContain('merchMatch');
      expect(middlewareSrc).toContain('/merch/${cleanSlug}-${item.id}');
      expect(slugifySrc).toContain('export function merchUrl');
    });

    it('should expose the standalone merch item route before the merch management route', () => {
      const detailIndex = appSrc.indexOf('<Route path="/merch/:slug"');
      const managementIndex = appSrc.indexOf('<Route path="/merch"');
      expect(detailIndex).toBeGreaterThan(-1);
      expect(managementIndex).toBeGreaterThan(-1);
      expect(detailIndex).toBeLessThan(managementIndex);
    });

    it('should set product type, creator attribution, and product-specific image alt text', () => {
      expect(middlewareSrc).toContain("type: 'product'");
      expect(middlewareSrc).toContain('sellerName');
      expect(middlewareSrc).toContain('from ${sellerName}');
    });

    it('should include standard USD product price metadata for native priced items', () => {
      expect(middlewareSrc).toContain('product:price:amount');
      expect(middlewareSrc).toContain('product:price:currency');
      expect(middlewareSrc).toContain('priceInCents / 100');
    });

    it('should use a merch image proxy and keep inactive items private', () => {
      expect(middlewareSrc).toContain("getOgImageUrl(firstImage, 'merch'");
      expect(middlewareSrc).toContain('eq(merchItems.isActive, true)');
    });
  });

  describe('Event OG Tags', () => {
    it('should match /events/:id route pattern', () => {
      expect(middlewareSrc).toContain("/^\\/events\\/(\\d+)$/");
    });

    it('should inject event-specific meta tags', () => {
      expect(middlewareSrc).toContain('eventTitle');
    });

    it('should set og:type to event for event pages', () => {
      expect(middlewareSrc).toContain("'event'");
    });
  });

  describe('OG Image Proxy Integration', () => {
    it('should use /api/og-image proxy URL instead of raw image URLs', () => {
      expect(middlewareSrc).toContain('/api/og-image/');
      expect(middlewareSrc).toContain('getOgImageUrl');
    });

    it('should set og:image:type to image/jpeg when using proxy', () => {
      expect(middlewareSrc).toContain('image/jpeg');
    });

    it('should fall back to DEFAULT_OG_IMAGE when no profile photo exists', () => {
      expect(middlewareSrc).toContain('if (!profilePhotoUrl)');
      expect(middlewareSrc).toContain('DEFAULT_OG_IMAGE');
    });
  });

  describe('Server Integration', () => {
    const coreIndexPath = path.join(__dirname, '..', '_core', 'index.ts');
    const coreIndexSrc = fs.readFileSync(coreIndexPath, 'utf-8');

    it('should import ogTagMiddleware in server/_core/index.ts', () => {
      expect(coreIndexSrc).toContain('ogTagMiddleware');
    });

    it('should import ogImageProxyRouter in server/_core/index.ts', () => {
      expect(coreIndexSrc).toContain('ogImageProxyRouter');
    });

    it('should mount OG image proxy at /api/og-image BEFORE Vite/static setup', () => {
      const proxyIndex = coreIndexSrc.indexOf("app.use('/api/og-image'");
      const viteIndex = coreIndexSrc.indexOf('await setupVite');
      expect(proxyIndex).toBeGreaterThan(-1);
      expect(viteIndex).toBeGreaterThan(-1);
      expect(proxyIndex).toBeLessThan(viteIndex);
    });

    it('should mount OG tag middleware before Vite/static setup', () => {
      const ogIndex = coreIndexSrc.indexOf('app.use(ogTagMiddleware');
      const viteIndex = coreIndexSrc.indexOf('await setupVite');
      expect(ogIndex).toBeGreaterThan(-1);
      expect(viteIndex).toBeGreaterThan(-1);
      expect(ogIndex).toBeLessThan(viteIndex);
    });

    it('should pass through to SPA for regular browsers (non-crawlers)', () => {
      expect(middlewareSrc).toContain('isSocialBot');
      expect(middlewareSrc).toContain('return next()');
    });
  });
});

describe('OG Image Proxy (ogImageProxy.ts)', () => {
  const proxyPath = path.join(__dirname, '..', 'middleware', 'ogImageProxy.ts');
  const proxySrc = fs.readFileSync(proxyPath, 'utf-8');

  it('should have artist endpoint', () => {
    expect(proxySrc).toContain("'/artist/:id'");
  });

  it('should have venue endpoint', () => {
    expect(proxySrc).toContain("'/venue/:id'");
  });

  it('should have an active-only merch endpoint', () => {
    expect(proxySrc).toContain("'/merch/:id'");
    expect(proxySrc).toContain('item?.isActive');
    expect(proxySrc).toContain('item.imageUrls[0]');
  });

  it('should convert images to JPEG using sharp', () => {
    expect(proxySrc).toContain('sharp');
    expect(proxySrc).toContain('.jpeg(');
    expect(proxySrc).toContain('image/jpeg');
  });

  it('should resize images to 1200x630 for OG standard', () => {
    expect(proxySrc).toContain('1200');
    expect(proxySrc).toContain('630');
  });

  it('should have image caching', () => {
    expect(proxySrc).toContain('imageCache');
    expect(proxySrc).toContain('getCachedImage');
    expect(proxySrc).toContain('setCachedImage');
  });

  it('should have fallback image handling', () => {
    expect(proxySrc).toContain('serveFallbackImage');
    expect(proxySrc).toContain('DEFAULT_OG_IMAGE');
  });

  it('should have timeout protection for image fetching', () => {
    expect(proxySrc).toContain('AbortController');
    expect(proxySrc).toContain('timeout');
  });

  it('should validate content type is an image', () => {
    expect(proxySrc).toContain("content-type");
    expect(proxySrc).toContain("image/");
  });

  it('should accept supported CloudFront images served as generic binary content', () => {
    expect(proxySrc).toContain('application/octet-stream');
    expect(proxySrc).toContain('hasSupportedImageExtension');
  });

  it('should enforce a source image size limit before and after download', () => {
    expect(proxySrc).toContain('MAX_SOURCE_IMAGE_BYTES');
    expect(proxySrc).toContain('content-length');
    expect(proxySrc).toContain('buffer.length > MAX_SOURCE_IMAGE_BYTES');
  });

  it('should use database to look up profile photos', () => {
    expect(proxySrc).toContain('getDb');
    expect(proxySrc).toContain('artistProfiles');
    expect(proxySrc).toContain('venueProfiles');
  });
});
