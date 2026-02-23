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

// Generate login URL using window.location.origin encoded in state
export const getLoginUrl = (returnPath?: string) => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "";
    
    // Encode origin + returnPath in state so backend can redirect to correct domain
    const redirectPath = returnPath || "/";
    const stateData = `${window.location.origin}${redirectPath}`;
    const state = btoa(stateData);

    if (!oauthPortalUrl || oauthPortalUrl === "undefined" || !appId || appId === "undefined") {
      console.warn("Missing OAuth configuration. VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set.");
      return "";
    }

    const url = safeUrl(`${oauthPortalUrl}/app-auth`);
    if (!url) {
      console.error("Failed to construct OAuth URL");
      return "";
    }

    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    
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
