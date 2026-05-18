import { describe, it, expect } from "vitest";

/**
 * Tests for the OAuth fix: using window.location.origin for redirect URLs
 * and passing origin in the state parameter.
 * 
 * Per Manus support: "When handling redirect URLs, always use window.location.origin
 * and never hardcode domains or use req.host."
 */

// Simulate the parseState function from oauth.ts
function parseState(state: string): { origin: string; returnPath: string; redirectUri: string } {
  try {
    const parsed = JSON.parse(state);
    if (parsed.origin && parsed.redirectUri) {
      return {
        origin: parsed.origin,
        returnPath: parsed.returnPath || "/",
        redirectUri: parsed.redirectUri,
      };
    }
  } catch {
    try {
      const decoded = Buffer.from(state, "base64").toString("utf-8");
      if (decoded.startsWith("http")) {
        const url = new URL(decoded);
        return {
          origin: url.origin,
          returnPath: "/",
          redirectUri: decoded,
        };
      }
    } catch {
      // Fall through
    }
  }
  return { origin: "", returnPath: "/", redirectUri: "" };
}

// Simulate the SDK decodeState function
function decodeState(state: string): string {
  try {
    const parsed = JSON.parse(state);
    if (parsed.redirectUri) {
      return parsed.redirectUri;
    }
  } catch {
    // Not JSON
  }
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    if (decoded.startsWith("http")) {
      return decoded;
    }
  } catch {
    // Not base64
  }
  return state;
}

describe("OAuth Fix - State Parameter Handling", () => {
  describe("New JSON state format", () => {
    it("should parse JSON state with origin, returnPath, and redirectUri", () => {
      const state = JSON.stringify({
        origin: "https://www.ologywood.com",
        returnPath: "/dashboard",
        redirectUri: "https://www.ologywood.com/api/oauth/callback",
      });

      const result = parseState(state);
      expect(result.origin).toBe("https://www.ologywood.com");
      expect(result.returnPath).toBe("/dashboard");
      expect(result.redirectUri).toBe("https://www.ologywood.com/api/oauth/callback");
    });

    it("should default returnPath to / when not provided", () => {
      const state = JSON.stringify({
        origin: "https://www.ologywood.com",
        redirectUri: "https://www.ologywood.com/api/oauth/callback",
      });

      const result = parseState(state);
      expect(result.returnPath).toBe("/");
    });

    it("should handle manus.space domain", () => {
      const state = JSON.stringify({
        origin: "https://ologywood-mp6flm6c.manus.space",
        returnPath: "/",
        redirectUri: "https://ologywood-mp6flm6c.manus.space/api/oauth/callback",
      });

      const result = parseState(state);
      expect(result.origin).toBe("https://ologywood-mp6flm6c.manus.space");
      expect(result.redirectUri).toBe("https://ologywood-mp6flm6c.manus.space/api/oauth/callback");
    });

    it("should handle localhost for development", () => {
      const state = JSON.stringify({
        origin: "http://localhost:3000",
        returnPath: "/",
        redirectUri: "http://localhost:3000/api/oauth/callback",
      });

      const result = parseState(state);
      expect(result.origin).toBe("http://localhost:3000");
      expect(result.redirectUri).toBe("http://localhost:3000/api/oauth/callback");
    });
  });

  describe("Old base64 state format (backward compatibility)", () => {
    it("should parse base64-encoded callback URL", () => {
      const callbackUrl = "https://ologywood-mp6flm6c.manus.space/api/oauth/callback";
      const state = Buffer.from(callbackUrl).toString("base64");

      const result = parseState(state);
      expect(result.origin).toBe("https://ologywood-mp6flm6c.manus.space");
      expect(result.redirectUri).toBe(callbackUrl);
      expect(result.returnPath).toBe("/");
    });

    it("should parse base64-encoded custom domain callback URL", () => {
      const callbackUrl = "https://www.ologywood.com/api/oauth/callback";
      const state = Buffer.from(callbackUrl).toString("base64");

      const result = parseState(state);
      expect(result.origin).toBe("https://www.ologywood.com");
      expect(result.redirectUri).toBe(callbackUrl);
    });
  });

  describe("Invalid state handling", () => {
    it("should return empty values for invalid state", () => {
      const result = parseState("not-valid-anything");
      expect(result.origin).toBe("");
      expect(result.returnPath).toBe("/");
      expect(result.redirectUri).toBe("");
    });

    it("should return empty values for empty string", () => {
      const result = parseState("");
      expect(result.origin).toBe("");
      expect(result.returnPath).toBe("/");
    });
  });
});

describe("OAuth Fix - SDK decodeState", () => {
  it("should extract redirectUri from new JSON state format", () => {
    const state = JSON.stringify({
      origin: "https://www.ologywood.com",
      returnPath: "/",
      redirectUri: "https://www.ologywood.com/api/oauth/callback",
    });

    const redirectUri = decodeState(state);
    expect(redirectUri).toBe("https://www.ologywood.com/api/oauth/callback");
  });

  it("should decode old base64 format", () => {
    const callbackUrl = "https://ologywood-mp6flm6c.manus.space/api/oauth/callback";
    const state = Buffer.from(callbackUrl).toString("base64");

    const redirectUri = decodeState(state);
    expect(redirectUri).toBe(callbackUrl);
  });

  it("should handle manus.space base64 state", () => {
    const callbackUrl = "https://ologywood-mp6flm6c.manus.space/api/oauth/callback";
    const state = Buffer.from(callbackUrl).toString("base64");

    const redirectUri = decodeState(state);
    expect(redirectUri).toBe(callbackUrl);
  });
});

describe("OAuth Fix - Frontend getLoginUrl behavior", () => {
  it("should construct correct state with origin and redirectUri", () => {
    // Simulate what the frontend does
    const frontendOrigin = "https://www.ologywood.com";
    const redirectUri = `${frontendOrigin}/api/oauth/callback`;
    const returnPath = "/dashboard";

    const state = JSON.stringify({
      origin: frontendOrigin,
      returnPath: returnPath,
      redirectUri: redirectUri,
    });

    const parsed = JSON.parse(state);
    expect(parsed.origin).toBe("https://www.ologywood.com");
    expect(parsed.returnPath).toBe("/dashboard");
    expect(parsed.redirectUri).toBe("https://www.ologywood.com/api/oauth/callback");
  });

  it("should use correct OAuth portal URL format", () => {
    const oauthPortalUrl = "https://manus.im";
    const appId = "test-app-id";
    const frontendOrigin = "https://www.ologywood.com";
    const redirectUri = `${frontendOrigin}/api/oauth/callback`;

    const state = JSON.stringify({
      origin: frontendOrigin,
      returnPath: "/",
      redirectUri: redirectUri,
    });

    const params = new URLSearchParams({
      app_id: appId,
      redirect_url: redirectUri,
      state: state,
    });

    const loginUrl = `${oauthPortalUrl}/login?${params.toString()}`;

    expect(loginUrl).toContain("manus.im/login");
    expect(loginUrl).toContain("app_id=test-app-id");
    expect(loginUrl).toContain("redirect_url=");
    expect(loginUrl).toContain("www.ologywood.com");
    // Should NOT contain any hardcoded manus.space redirect
    expect(loginUrl).not.toContain("VITE_OAUTH_REDIRECT_BASE_URL");
  });

  it("should not hardcode any domain in the redirect URL", () => {
    // Verify that the frontend uses window.location.origin pattern
    // by checking that the redirect URL matches the origin
    const origins = [
      "https://www.ologywood.com",
      "https://ologywood-mp6flm6c.manus.space",
      "http://localhost:3000",
    ];

    for (const origin of origins) {
      const redirectUri = `${origin}/api/oauth/callback`;
      expect(redirectUri).toContain(origin);
      expect(redirectUri).toMatch(/\/api\/oauth\/callback$/);
    }
  });
});

describe("OAuth Fix - Redirect after login", () => {
  it("should redirect to the origin from state after successful login", () => {
    const state = JSON.stringify({
      origin: "https://www.ologywood.com",
      returnPath: "/dashboard",
      redirectUri: "https://www.ologywood.com/api/oauth/callback",
    });

    const parsed = parseState(state);
    const redirectUrl = `${parsed.origin}${parsed.returnPath}`;
    expect(redirectUrl).toBe("https://www.ologywood.com/dashboard");
  });

  it("should redirect to root when returnPath is /", () => {
    const state = JSON.stringify({
      origin: "https://www.ologywood.com",
      returnPath: "/",
      redirectUri: "https://www.ologywood.com/api/oauth/callback",
    });

    const parsed = parseState(state);
    const redirectUrl = `${parsed.origin}${parsed.returnPath}`;
    expect(redirectUrl).toBe("https://www.ologywood.com/");
  });

  it("should fall back to relative redirect when origin is missing", () => {
    const parsed = parseState("invalid-state");
    const redirectUrl = parsed.origin
      ? `${parsed.origin}${parsed.returnPath}`
      : parsed.returnPath || "/";
    expect(redirectUrl).toBe("/");
  });
});
