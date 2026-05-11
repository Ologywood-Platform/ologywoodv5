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
// 
// IMPORTANT: The Manus OAuth system validates redirect URIs against an allowed list.
// The `state` parameter is base64-decoded by the OAuth server to get the redirect URI.
// If no state is set, the OAuth server infers the redirect from the request origin.
//
// For custom domains (e.g. www.ologywood.com), we MUST explicitly set the state
// parameter to point to the registered manus.space domain callback URL.
// The OAuth callback sets the cookie on manus.space, and the user stays on that domain.
// 
// To enable OAuth directly on www.ologywood.com, submit a support request to Manus
// to register the custom domain as an allowed OAuth redirect URI.
export const getLoginUrl = (returnPath?: string) => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "";
    const oauthRedirectBase = import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || "";

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
    url.searchParams.set("type", "signIn");

    // Determine the callback base URL
    // If we have a registered OAuth redirect base (manus.space), use it
    // Otherwise fall back to the current origin
    const callbackBase = oauthRedirectBase || window.location.origin;
    const callbackUrl = `${callbackBase}/api/oauth/callback`;

    // Set the state parameter with the base64-encoded callback URL
    // This tells the Manus OAuth server where to redirect after authentication
    url.searchParams.set("state", btoa(callbackUrl));

    // Set error redirect to the callback base domain
    url.searchParams.set("errorRedirect", `${callbackBase}/?oauth_error=true`);

    return url.toString();
  } catch (error) {
    console.error("Error generating login URL:", error);
    return "";
  }
};
