# Adonis Profile Redirect Bug

## Root Cause Found

In `client/src/main.tsx` (lines 24-31):

```js
const redirectToLoginIfUnauthorized = (error: unknown) => {
  const isUnauthorized = error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED";
  if (!isUnauthorized) return;
  window.location.href = '/';
};
```

This global error handler catches ANY 401/UNAUTHORIZED tRPC error and redirects to `/`.

On the ArtistProfile page, some queries require authentication (like `bookingTemplate.getMyTemplates` which is enabled for venues). If ANY query on the page returns 401, the global handler redirects to home.

The `bookingTemplate.getMyTemplates` query (line 152) is gated by `enabled: user?.role === 'venue'`, but there might be another query that fires without auth check.

Also, the `getProfile` query for artist id=11 might be triggering a different code path than id=3.

## Fix
The global redirect should NOT apply to public pages like artist profiles. It should only redirect on protected routes.
