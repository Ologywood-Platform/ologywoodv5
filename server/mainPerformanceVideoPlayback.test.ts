import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const artistProfileSource = readFileSync(
  resolve(process.cwd(), 'client/src/pages/ArtistProfile.tsx'),
  'utf8',
);
const portfolioPageSource = readFileSync(
  resolve(process.cwd(), 'client/src/pages/PortfolioVideo.tsx'),
  'utf8',
);
const portfolioManagerSource = readFileSync(
  resolve(process.cwd(), 'client/src/components/VideoPortfolioManager.tsx'),
  'utf8',
);

describe('main performance video playback isolation', () => {
  it('preloads the public main performance video and supports inline mobile playback', () => {
    const performanceSection = artistProfileSource.slice(
      artistProfileSource.indexOf('{/* Performance Video */}'),
      artistProfileSource.indexOf('{/* Video Portfolio */}'),
    );

    expect(performanceSection).toContain('preload="auto"');
    expect(performanceSection).toContain('playsInline');
    expect(performanceSection).toContain('performanceVideoUrl');
  });

  it('does not change short-form portfolio thumbnail generation or playback', () => {
    expect(portfolioManagerSource).toContain('createVideoThumbnail');
    expect(portfolioManagerSource).toContain('Math.min(Math.max(duration * 0.25, 1), 15)');
    expect(portfolioManagerSource).toContain("formData.append('thumbnail', thumbnail");
    expect(artistProfileSource).toContain('parsePortfolioVideoUrl(video.videoUrl)');
    expect(portfolioPageSource).toContain('poster={video.thumbnailUrl || undefined}');
    expect(portfolioPageSource).toContain('autoPlay');
  });
});
