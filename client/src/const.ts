export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL using window.location.origin for redirect URLs.
//
// IMPORTANT (from Manus Support):
// When handling redirect URLs, always use window.location.origin and never
// hardcode domains or use req.host. The frontend and backend are deployed on
// separate servers, so the server cannot reliably determine the frontend's
// origin. The frontend must always pass it explicitly via the state parameter.
//
// The state parameter is a JSON string containing:
//   - origin: window.location.origin (e.g. "https://www.ologywood.com")
//   - returnPath: the path to redirect to after login (e.g. "/dashboard")
//   - redirectUri: the full callback URL for the OAuth server
//
// The backend extracts the origin from state to redirect correctly after auth.
export const getLoginUrl = (returnPath?: string) => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "";

    if (!oauthPortalUrl || oauthPortalUrl === "undefined" || !appId || appId === "undefined") {
      console.warn("Missing OAuth configuration. VITE_OAUTH_PORTAL_URL or VITE_APP_ID not set.");
      return "";
    }

    // Always use window.location.origin — never hardcode domains
    const frontendOrigin = window.location.origin;
    const redirectUri = `${frontendOrigin}/api/oauth/callback`;

    // Encode origin and return path in state so the backend knows
    // which domain the user came from and where to redirect after login
    const state = JSON.stringify({
      origin: frontendOrigin,
      returnPath: returnPath || "/",
      redirectUri: redirectUri,
    });

    const params = new URLSearchParams({
      app_id: appId,
      redirect_url: redirectUri,
      state: state,
    });

    return `${oauthPortalUrl}/login?${params.toString()}`;
  } catch (error) {
    console.error("Error generating login URL:", error);
    return "";
  }
};
