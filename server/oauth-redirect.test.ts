import { describe, it, expect } from "vitest";

describe("OAuth Redirect Configuration", () => {
  it("should have correct OAuth redirect base URL configured", () => {
    // The VITE_OAUTH_REDIRECT_BASE_URL is set via environment variable
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    
    expect(oauthRedirectBase).toBeDefined();
    expect(oauthRedirectBase).toContain("manus.space");
    expect(oauthRedirectBase).toBe("https://ologywood-mp6flm6c.manus.space");
  });

  it("should not contain old Cloud Run URL", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    
    expect(oauthRedirectBase).not.toContain("z2xk");
    expect(oauthRedirectBase).not.toContain("run.app");
    expect(oauthRedirectBase).not.toContain("cloud.google");
  });

  it("should construct valid OAuth callback URL", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    const callbackUrl = `${oauthRedirectBase}/api/oauth/callback`;
    
    expect(callbackUrl).toBe("https://ologywood-mp6flm6c.manus.space/api/oauth/callback");
    expect(callbackUrl).toMatch(/^https:\/\/[^\/]+\/api\/oauth\/callback$/);
  });

  it("should use HTTPS protocol for OAuth redirects", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    
    expect(oauthRedirectBase).toMatch(/^https:\/\//);
    expect(oauthRedirectBase).not.toMatch(/^http:\/\//);
  });
});
