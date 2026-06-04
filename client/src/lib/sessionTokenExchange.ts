/**
 * Session Token Exchange - Android OAuth Fallback
 * 
 * On Android, the Spotify app may intercept the OAuth flow and open the callback
 * in a new browser context (Custom Tab or new tab). This causes SameSite=Lax cookies
 * to not be stored properly. As a fallback, the OAuth callback passes the session token
 * in the URL hash fragment (#__session_token=...).
 * 
 * This module detects the token in the hash, exchanges it for a proper httpOnly cookie
 * via a same-origin POST request, then cleans up the URL.
 */

const SESSION_TOKEN_KEY = '__session_token';

/**
 * Check if there's a session token in the URL hash and exchange it for a cookie.
 * Should be called once on app initialization.
 * Returns true if a token was found and exchanged successfully.
 */
export async function exchangeSessionTokenFromHash(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const hash = window.location.hash;
  if (!hash || !hash.includes(SESSION_TOKEN_KEY)) return false;

  // Parse the hash fragment
  const hashParams = new URLSearchParams(hash.substring(1));
  const token = hashParams.get(SESSION_TOKEN_KEY);

  if (!token) return false;

  // Clean the token from the URL immediately (security: don't leave JWT in address bar)
  hashParams.delete(SESSION_TOKEN_KEY);
  const remainingHash = hashParams.toString();
  const cleanUrl = window.location.pathname + window.location.search + (remainingHash ? `#${remainingHash}` : '');
  window.history.replaceState(null, '', cleanUrl);

  try {
    // Exchange the token for a proper httpOnly cookie via same-origin fetch
    const response = await fetch('/api/auth/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      console.log('[SessionExchange] Token exchanged successfully, reloading...');
      // Reload to pick up the new session cookie
      window.location.reload();
      return true;
    } else {
      console.warn('[SessionExchange] Token exchange failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('[SessionExchange] Token exchange error:', error);
    return false;
  }
}
