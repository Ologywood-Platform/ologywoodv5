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

// Cache for OAuth config to avoid repeated API calls
let cachedOAuthConfig: any = null;
let configPromise: Promise<any> | null = null;

// Fetch OAuth config from server
async function fetchOAuthConfig() {
  if (cachedOAuthConfig) {
    return cachedOAuthConfig;
  }
  
  if (configPromise) {
    return configPromise;
  }
  
  configPromise = (async () => {
    try {
      const response = await fetch('/api/trpc/auth.getOAuthConfig');
      if (!response.ok) {
        throw new Error('Failed to fetch OAuth config');
      }
      const data = await response.json();
      cachedOAuthConfig = data.result?.data || {};
      return cachedOAuthConfig;
    } catch (error) {
      console.error("Error fetching OAuth config:", error);
      return {};
    }
  })();
  
  return configPromise;
}

// Generate login URL at runtime using OAuth config from server
export const getLoginUrl = async () => {
  try {
    const config = await fetchOAuthConfig();
    
    const oauthPortalUrl = config.oauthPortalUrl || import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = config.appId || import.meta.env.VITE_APP_ID || "";
    const oauthRedirectBase = config.oauthRedirectBase || import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || window.location.origin;
    
    const redirectUri = `${oauthRedirectBase}/api/oauth/callback`;
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
