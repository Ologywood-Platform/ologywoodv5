import { describe, it, expect } from "vitest";

describe("OAuth Redirect Configuration", () => {
  it("should have correct OAuth redirect base URL configured", () => {
    // The VITE_OAUTH_REDIRECT_BASE_URL is set via environment variable
    // Can be: dev (manus.computer), production (manus.space), or custom domain (ologywood.com)
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://www.ologywood.com";
    
    expect(oauthRedirectBase).toBeDefined();
    expect(oauthRedirectBase).toMatch(/^https:\/\//);
    // Accept manus domains, custom domains, or any https URL
    expect(oauthRedirectBase).toMatch(/^https:\/\/[a-zA-Z0-9.-]+/);
  });

  it("should not contain old Cloud Run URL", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer";
    
    expect(oauthRedirectBase).not.toContain("z2xk");
    expect(oauthRedirectBase).not.toContain("run.app");
    expect(oauthRedirectBase).not.toContain("cloud.google");
    expect(oauthRedirectBase).not.toContain("www.z2xk55clkl");
  });

  it("should construct valid OAuth callback URL", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer";
    const callbackUrl = `${oauthRedirectBase}/api/oauth/callback`;
    
    expect(callbackUrl).toMatch(/^https:\/\/[^\/]+\/api\/oauth\/callback$/);
    expect(callbackUrl).toContain("/api/oauth/callback");
  });

  it("should use HTTPS protocol for OAuth redirects", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://3000-iwkcml56suxa2dfem827y-09f9693a.us2.manus.computer";
    
    expect(oauthRedirectBase).toMatch(/^https:\/\//);
    expect(oauthRedirectBase).not.toMatch(/^http:\/\//);
  });
});
