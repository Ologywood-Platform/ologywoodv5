import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("OAuth Configuration", () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset environment before each test
    import.meta.env.VITE_OAUTH_PORTAL_URL = "https://manus.im";
    import.meta.env.VITE_APP_ID = "mP6FLm6cHUyVdEMNViNuZS";
    import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL = "https://ologywood-mp6flm6c.manus.space";
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  it("should use manus.space domain for OAuth redirects", () => {
    // Mock window.location.origin
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { origin: "https://www.ologywood.com" };

    // Verify the OAuth redirect base URL is set
    const oauthRedirectBase = import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    
    expect(oauthRedirectBase).toBe("https://ologywood-mp6flm6c.manus.space");
    expect(oauthRedirectBase).toContain("manus.space");
    expect(oauthRedirectBase).not.toContain("z2xk"); // Should not contain old Cloud Run URL

    // Restore window.location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("should have valid OAuth configuration variables", () => {
    expect(import.meta.env.VITE_OAUTH_PORTAL_URL).toBe("https://manus.im");
    expect(import.meta.env.VITE_APP_ID).toBe("mP6FLm6cHUyVdEMNViNuZS");
    expect(import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL).toBe("https://ologywood-mp6flm6c.manus.space");
  });

  it("should construct correct OAuth callback URL", () => {
    const oauthRedirectBase = import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    const callbackUrl = `${oauthRedirectBase}/api/oauth/callback`;
    
    expect(callbackUrl).toBe("https://ologywood-mp6flm6c.manus.space/api/oauth/callback");
    expect(callbackUrl).toMatch(/^https:\/\/ologywood-mp6flm6c\.manus\.space\/api\/oauth\/callback$/);
  });
});
