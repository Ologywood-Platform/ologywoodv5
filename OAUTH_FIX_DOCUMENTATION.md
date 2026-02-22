# OAuth Redirect URL Fix - Manus Support Issue

**Date:** February 20, 2026  
**Status:** Issue Identified - Awaiting Manus Fix  
**Issue Type:** Manus OAuth Server Bug

---

## Problem Summary

Manus's OAuth server is attempting to obtain the redirect host from request headers (`req.headers.origin` or `req.headers.host`), which can result in:

1. **Empty or Incorrect URLs** - `req.headers.origin` may be empty or incorrect
2. **Missing Protocol/Port** - `req.headers.host` may lack the protocol (http vs https) or port number
3. **Redirect Failures** - OAuth callback fails because the redirect URI doesn't match registered URIs

**Reference:** See Manus Support message with code snippet showing the issue in `server/_core/oauth.ts:113-129`

---

## Current Implementation (Ologywood)

Our implementation is **already correct** and follows OAuth best practices:

### Frontend OAuth Configuration (`client/src/const.ts`)

```typescript
export const getLoginUrl = () => {
  try {
    const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID || "";
    
    // ✅ Using explicit environment-based redirect URL (NOT header-based)
    const oauthRedirectBase = import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || "https://ologywood-mp6flm6c.manus.space";
    const redirectUri = `${oauthRedirectBase}/api/oauth/callback`;
    const state = btoa(redirectUri);

    // ✅ Passing explicit redirectUri to OAuth server
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    
    return url.toString();
  } catch (error) {
    console.error("Error generating login URL:", error);
    return "";
  }
};
```

### Key Points

1. **Explicit Redirect URI** - We pass the full redirect URI explicitly in the OAuth request
2. **Environment-Based** - Uses `VITE_OAUTH_REDIRECT_BASE_URL` environment variable
3. **State Parameter** - Also encodes the redirect URI in the state parameter for verification
4. **No Header Dependency** - Does NOT rely on `req.headers.origin` or `req.headers.host`

---

## What Manus Needs to Fix

The Manus OAuth server should:

1. **Use the explicit `redirectUri` parameter** passed in the OAuth request
2. **NOT attempt to extract the host from request headers**
3. **Validate the redirect URI** against registered URIs in the OAuth configuration
4. **Decode the state parameter** if it contains the redirect URI for verification

### Recommended Manus Fix

Instead of:
```typescript
// ❌ WRONG - Extracting from headers
const appUrl = req.headers.origin || `https://${req.headers.host}`;
```

Use:
```typescript
// ✅ CORRECT - Using explicit parameter
const appUrl = redirectUri; // Already provided in request
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth server URL | `https://manus.im` |
| `VITE_APP_ID` | Application ID from Manus | `ologywood` |
| `VITE_OAUTH_REDIRECT_BASE_URL` | Base URL for OAuth callback | `https://ologywood-mp6flm6c.manus.space` |
| `OAUTH_SERVER_URL` | Backend OAuth server URL | `https://api.manus.im` |
| `BASE_URL` | Application base URL | `https://ologywood-mp6flm6c.manus.space` |

### Manus Hosting Configuration

These variables are automatically injected by Manus hosting:
- `VITE_OAUTH_PORTAL_URL` - Set to Manus OAuth portal
- `VITE_APP_ID` - Set to project ID
- `VITE_OAUTH_REDIRECT_BASE_URL` - Set to project's manus.space domain
- `OAUTH_SERVER_URL` - Set to Manus OAuth API
- `BASE_URL` - Set to project's deployed URL

---

## Verification Steps

### 1. Check OAuth Configuration

```bash
# Verify environment variables are set
echo $VITE_OAUTH_REDIRECT_BASE_URL
echo $VITE_OAUTH_PORTAL_URL
echo $VITE_APP_ID
```

### 2. Test OAuth Flow

1. Navigate to login page
2. Click "Sign In" button
3. Verify redirect to Manus OAuth portal
4. Complete OAuth authentication
5. Verify callback to `/api/oauth/callback`
6. Verify user session is created

### 3. Check Browser Console

Look for OAuth configuration logs:
```
[OAuth] Initialized with baseURL: https://api.manus.im
```

### 4. Check Network Tab

Verify OAuth callback URL matches:
```
https://ologywood-mp6flm6c.manus.space/api/oauth/callback
```

---

## Workarounds (If Manus Fix is Delayed)

### Option 1: Use Explicit BASE_URL

Update `const.ts` to use `BASE_URL` environment variable:

```typescript
const oauthRedirectBase = import.meta.env.BASE_URL || import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL;
```

### Option 2: Hardcode Manus Domain

For development/testing:

```typescript
const oauthRedirectBase = "https://ologywood-mp6flm6c.manus.space";
```

### Option 3: Use Window Location

As a last resort (not recommended for production):

```typescript
// Only use if environment variables are not available
const oauthRedirectBase = window.location.origin;
```

---

## Testing Checklist

- [ ] OAuth login works on development server
- [ ] OAuth login works on staging environment
- [ ] OAuth login works on production
- [ ] Redirect URI matches registered URI in Manus OAuth config
- [ ] Session token is created after OAuth callback
- [ ] User data is synced correctly
- [ ] Role-based routing works after login
- [ ] Email verification works
- [ ] Logout works correctly

---

## Related Files

- `client/src/const.ts` - OAuth configuration
- `server/_core/oauth.ts` - OAuth callback handler
- `server/_core/sdk.ts` - OAuth SDK
- `server/_core/env.ts` - Environment configuration
- `server/auth.logout.test.ts` - OAuth tests

---

## Next Steps

1. **Await Manus Fix** - Manus team needs to update their OAuth server code
2. **Monitor Logs** - Watch for OAuth errors in production
3. **Test Thoroughly** - Verify OAuth flow after Manus fix is deployed
4. **Document Results** - Update this document with resolution

---

## Contact

**Manus Support:** https://help.manus.im  
**Issue:** OAuth redirect URL construction using request headers instead of explicit parameters

---

**Document Created:** February 20, 2026  
**Last Updated:** February 20, 2026
