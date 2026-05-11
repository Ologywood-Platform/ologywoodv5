import { describe, it, expect } from "vitest";

describe("OAuth Configuration for Custom Domain", () => {
  it("should have VITE_OAUTH_REDIRECT_BASE_URL pointing to manus.space", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL;
    expect(oauthRedirectBase).toBeDefined();
    expect(oauthRedirectBase).toContain("manus.space");
    expect(oauthRedirectBase).toBe("https://ologywood-mp6flm6c.manus.space");
  });

  it("should construct correct OAuth callback URL from env", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL!;
    const callbackUrl = `${oauthRedirectBase}/api/oauth/callback`;
    expect(callbackUrl).toBe("https://ologywood-mp6flm6c.manus.space/api/oauth/callback");
  });

  it("should generate correct base64 state parameter for OAuth", () => {
    const oauthRedirectBase = process.env.VITE_OAUTH_REDIRECT_BASE_URL!;
    const callbackUrl = `${oauthRedirectBase}/api/oauth/callback`;
    const state = Buffer.from(callbackUrl).toString("base64");
    
    // Verify the state decodes back to the correct callback URL
    expect(Buffer.from(state, "base64").toString()).toBe(
      "https://ologywood-mp6flm6c.manus.space/api/oauth/callback"
    );
  });

  it("should have all required OAuth env vars", () => {
    expect(process.env.VITE_APP_ID).toBeDefined();
    expect(process.env.VITE_APP_ID).not.toBe("");
    expect(process.env.VITE_OAUTH_REDIRECT_BASE_URL).toBeDefined();
    expect(process.env.VITE_OAUTH_REDIRECT_BASE_URL).not.toBe("");
  });
});
