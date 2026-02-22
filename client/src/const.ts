export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Safe URL constructor helper
function safeUrl(value?: string): URL | null {
  try {
    if (!value || value === "undefined") {
      return null;
    }
    return new URL(value);
  } catch (error) {
    console.error("Invalid URL:", value, error);
    return null;
  }
}

// Generate login URL at runtime so redirect URI reflects the current origin.
// CRITICAL: Do NOT use req.headers.origin - it can be empty or incorrect
// Use BASE_URL which is automatically set by Manus to the correct deployment domain
export const getLoginUrl = () => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "";
    
    // FIXED: Ensure baseUrl always has a valid scheme
    // BASE_URL may be empty in some environments, so we need proper fallback
    let baseUrl = import.meta.env.BASE_URL;
    
    // If BASE_URL is empty or missing scheme, use window.location.origin
    if (!baseUrl || !baseUrl.match(/^https?:\/\/|^manus:\/\//)) {
      baseUrl = window.location.origin;
    }
    
    // Final validation: ensure baseUrl has a scheme
    if (!baseUrl.match(/^https?:\/\/|^manus:\/\//)) {
      console.error("Invalid baseUrl:", baseUrl);
      return "";
    }
    
    const redirectUri = `${baseUrl}/api/oauth/callback`;
    const state = btoa(redirectUri);

    if (!oauthPortalUrl || oauthPortalUrl === "undefined" || !appId || appId === "undefined") {
      console.warn("Missing OAuth configuration. VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set.");
      return "";
    }

    const url = safeUrl(`${oauthPortalUrl}/app-auth`);
    if (!url) {
      console.error("Failed to construct OAuth URL");
      return "";
    }

    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("Error generating login URL:", error);
    return "";
  }
};
