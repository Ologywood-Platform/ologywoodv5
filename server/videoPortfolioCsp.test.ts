import { describe, expect, it, vi } from 'vitest';
import {
  ALLOWED_FRAME_SOURCES,
  securityHeadersConfig,
  securityHeadersMiddleware,
} from './middleware/securityHeaders';

describe('Video Portfolio Content Security Policy', () => {
  it('allows only the supported video embed and checkout frame origins', () => {
    expect(ALLOWED_FRAME_SOURCES).toEqual([
      "'self'",
      'https://js.stripe.com',
      'https://hooks.stripe.com',
      'https://www.youtube.com',
      'https://www.youtube-nocookie.com',
      'https://player.vimeo.com',
    ]);
    expect(securityHeadersConfig.contentSecurityPolicy.directives.frameSrc)
      .toEqual(ALLOWED_FRAME_SOURCES);
    expect(ALLOWED_FRAME_SOURCES).not.toContain('*');
    expect(ALLOWED_FRAME_SOURCES.every(source => !source.startsWith('http:'))).toBe(true);
  });

  it('emits the video providers in frame-src without weakening frame-ancestors', () => {
    const headers = new Map<string, string>();
    const response = {
      setHeader: vi.fn((name: string, value: string) => headers.set(name, value)),
      removeHeader: vi.fn(),
    } as any;
    const next = vi.fn();

    securityHeadersMiddleware({} as any, response, next);

    const csp = headers.get('Content-Security-Policy') ?? '';
    expect(csp).toContain("frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com;");
    expect(csp).toContain("frame-ancestors 'self' https://*.manus.computer https://*.manus.space https://*.manus.im;");
    expect(csp).not.toContain('frame-src *');
    expect(csp).not.toContain('frame-ancestors https://www.youtube.com');
    expect(next).toHaveBeenCalledOnce();
  });
});
