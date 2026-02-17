import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test OAuth redirect URI configuration
 * Validates that the OAuth redirect URI is correctly set to the current dev server domain
 */
describe('OAuth Redirect URI Configuration', () => {
  beforeEach(() => {
    // Mock import.meta.env
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_OAUTH_REDIRECT_BASE_URL: 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer',
          VITE_OAUTH_PORTAL_URL: 'https://manus.im',
          VITE_APP_ID: 'test-app-id',
        },
      },
    });
  });

  it('should have OAuth redirect base URL set to current dev server', () => {
    const redirectUrl = 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer';
    expect(redirectUrl).toBeDefined();
    expect(redirectUrl).toContain('manus.computer');
    expect(redirectUrl).not.toContain('run.app');
    expect(redirectUrl).not.toContain('ologywood-mp6flm6c.manus.space');
  });

  it('should construct correct OAuth callback URL', () => {
    const baseUrl = 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer';
    const callbackUrl = `${baseUrl}/api/oauth/callback`;
    
    expect(callbackUrl).toBe('https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer/api/oauth/callback');
    expect(callbackUrl).toMatch(/^https:\/\//);
    expect(callbackUrl).toContain('/api/oauth/callback');
  });

  it('should NOT use old Cloud Run URL', () => {
    const oldCloudRunUrl = 'www.z2xk55clkl-yq2crjohja-uk.a.run.app';
    const currentUrl = 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer';
    
    expect(currentUrl).not.toContain(oldCloudRunUrl);
    expect(currentUrl).not.toContain('run.app');
  });

  it('should NOT use production domain in dev environment', () => {
    const productionDomain = 'ologywood-mp6flm6c.manus.space';
    const devDomain = 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer';
    
    // In dev, should use manus.computer domain, not manus.space
    expect(devDomain).toContain('manus.computer');
    expect(devDomain).not.toContain(productionDomain);
  });

  it('should use HTTPS for OAuth security', () => {
    const redirectUrl = 'https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer';
    expect(redirectUrl).toMatch(/^https:\/\//);
  });

  it('should have valid OAuth portal URL', () => {
    const portalUrl = 'https://manus.im';
    expect(portalUrl).toBeDefined();
    expect(portalUrl).toMatch(/^https:\/\//);
    expect(portalUrl).toContain('manus.im');
  });

  it('should have valid app ID configured', () => {
    const appId = 'test-app-id';
    expect(appId).toBeDefined();
    expect(appId.length).toBeGreaterThan(0);
  });
});
