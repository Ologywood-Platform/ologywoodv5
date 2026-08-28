import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  portfolioVideoDescription,
  portfolioVideoPath,
  portfolioVideoUrl,
} from '../shared/portfolioVideoShare';

const projectFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('portfolio video share URLs', () => {
  it('builds a clean collision-safe path and absolute URL', () => {
    expect(portfolioVideoPath('Video Test!', 2)).toBe('/portfolio-video/video-test-2');
    expect(portfolioVideoUrl('https://www.ologywood.com/', 'Video Test!', 2))
      .toBe('https://www.ologywood.com/portfolio-video/video-test-2');
  });

  it('builds creator and category-specific preview copy', () => {
    expect(portfolioVideoDescription('Video test', 'Adonis', 'behind_the_scenes'))
      .toBe('Watch “Video test,” a Behind The Scenes video from Adonis on OlogyWood.');
  });
});

describe('portfolio video social preview integration', () => {
  const middleware = projectFile('server/middleware/ogTags.ts');
  const imageProxy = projectFile('server/middleware/ogImageProxy.ts');
  const router = projectFile('server/routers.ts');
  const app = projectFile('client/src/App.tsx');
  const page = projectFile('client/src/pages/PortfolioVideo.tsx');
  const profile = projectFile('client/src/pages/ArtistProfile.tsx');
  const shareButton = projectFile('client/src/components/ShareVideoButton.tsx');
  const onboarding = projectFile('client/src/components/OnboardingTour.tsx');

  it('serves active-only crawler metadata with the persisted thumbnail proxy', () => {
    expect(middleware).toContain('portfolioVideoMatch');
    expect(middleware).toContain("eq(videoPortfolio.status, 'active')");
    expect(middleware).toContain("getOgImageUrl(video.thumbnailUrl, 'portfolio-video'");
    expect(middleware).toContain("type: 'video.other'");
    expect(middleware).toContain('Thumbnail for ${video.title} by ${video.artistName}');
  });

  it('converts active video thumbnails to 1200x630 JPEG and keeps a branded fallback', () => {
    expect(imageProxy).toContain("router.get('/portfolio-video/:id'");
    expect(imageProxy).toContain("eq(videoPortfolio.status, 'active')");
    expect(imageProxy).toContain('fetchAndConvertToJpeg(video.thumbnailUrl)');
    expect(imageProxy).toContain("imageUrl.startsWith('/')");
    expect(imageProxy).toContain('portfolio-video-${videoId}-${video.thumbnailUrl}');
    expect(imageProxy).toContain('serveFallbackImage(res, cacheKey)');
    expect(imageProxy).toContain('.resize(1200, 630');
  });

  it('exposes only active single-video records to the public page', () => {
    expect(router).toContain('getPortfolioVideo: publicProcedure');
    expect(router).toContain("WHERE vp.id = ? AND vp.status = ?");
    expect(router).toContain("[input.videoId, 'active']");
    expect(app).toContain('<Route path="/portfolio-video/:slug" component={PortfolioVideo} />');
    expect(page).toContain('trpc.artist.getPortfolioVideo.useQuery');
  });

  it('uses video-specific links for profile, social, email, text, and device sharing', () => {
    expect(profile).toContain('portfolioVideoUrl(window.location.origin, activeVideo.title, activeVideo.id)');
    expect(profile).not.toContain('?clip=${encodeURIComponent(activeVideo.title)}');
    expect(shareButton).toContain('portfolioVideoUrl(window.location.origin, videoTitle, videoId)');
    expect(shareButton).toContain("case 'email'");
    expect(shareButton).toContain("case 'text'");
    expect(shareButton).toContain('navigator.share');
  });

  it('keeps clean public video pages free from creator onboarding overlays', () => {
    expect(onboarding).toContain("window.location.pathname.startsWith('/portfolio-video/')");
    expect(onboarding).toContain('if (isPublicPortfolioVideo || !isActive');
  });
});
