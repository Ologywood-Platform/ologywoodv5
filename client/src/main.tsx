import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { exchangeSessionTokenFromHash } from "./lib/sessionTokenExchange";

import "./index.css";

// Android OAuth fallback: check for session token in URL hash before app renders.
// If found, exchange it for a cookie and reload. This handles the case where
// the Spotify app opens the callback in a new browser context on Android.
exchangeSessionTokenFromHash();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // Data stays fresh for 60 seconds — prevents refetch on tab switch
      refetchOnWindowFocus: false, // Don't refetch all queries when user switches back to tab
      refetchOnReconnect: true, // Do refetch when network reconnects
      retry: 1, // Only retry once on failure
    },
  },
});

// Public routes where 401 errors should be silently ignored (not redirected)
const PUBLIC_ROUTE_PATTERNS = [
  /^\/artist\//,
  /^\/venue\//,
  /^\/browse/,
  /^\/events/,
  /^\/blog/,
  /^\/pricing/,
  /^\/how-it-works/,
  /^\/faq/,
  /^\/contact/,
  /^\/terms/,
  /^\/privacy/,
  /^\/cookie/,
  /^\/dmca/,
  /^\/event\//,
  /^\/release\//,
  /^\/$/, // home page
];

const isPublicRoute = () => {
  const path = window.location.pathname;
  return PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(path));
};

// Track consecutive auth failures to distinguish network blips from real session expiry
let consecutiveAuthFailures = 0;
const MAX_AUTH_FAILURES_BEFORE_REDIRECT = 3;

const redirectToLoginIfUnauthorized = (error: unknown, queryKey?: unknown[]) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Don't redirect on public pages — just silently ignore the 401
  if (isPublicRoute()) return;

  // Check if this is a background auth.me polling query
  // These should NOT immediately redirect — mobile networks are unreliable
  const isAuthMeQuery = Array.isArray(queryKey) && 
    queryKey.some(k => typeof k === 'string' && k.includes('auth.me'));
  
  if (isAuthMeQuery) {
    consecutiveAuthFailures++;
    // Only redirect after multiple consecutive failures (not a single network blip)
    if (consecutiveAuthFailures < MAX_AUTH_FAILURES_BEFORE_REDIRECT) {
      console.warn(`[Auth] auth.me failed (${consecutiveAuthFailures}/${MAX_AUTH_FAILURES_BEFORE_REDIRECT}), waiting before redirect...`);
      return;
    }
    console.warn(`[Auth] auth.me failed ${consecutiveAuthFailures} times consecutively, session likely expired`);
  }

  // Reset counter and redirect
  consecutiveAuthFailures = 0;
  window.location.href = '/';
};

// Reset the failure counter whenever auth.me succeeds
const resetAuthFailureCounter = (queryKey?: unknown[]) => {
  const isAuthMeQuery = Array.isArray(queryKey) && 
    queryKey.some(k => typeof k === 'string' && k.includes('auth.me'));
  if (isAuthMeQuery) {
    consecutiveAuthFailures = 0;
  }
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "success") {
    // Reset auth failure counter on successful auth.me
    resetAuthFailureCounter(event.query.queryKey);
  }
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error, event.query.queryKey);
    if (error instanceof TRPCClientError) {
      // Suppress known non-critical errors
      if (error.message.includes("Contract not found")) return;
      if (error.message.includes("Server temporarily unavailable")) return;
      if (error.message.includes("is not valid JSON")) {
        // HTML response from SPA fallback — silently ignore, query will auto-retry
        return;
      }
    }
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // Mutations are user-initiated — redirect immediately on 401
    redirectToLoginIfUnauthorized(error);
    if (error instanceof TRPCClientError) {
      if (error.message.includes("Server temporarily unavailable")) return;
      if (error.message.includes("is not valid JSON")) return;
    }
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        }).then((response) => {
          // Guard against HTML responses (SPA fallback during server restart or network issues)
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html') && !contentType.includes('application/json')) {
            return new Response(
              JSON.stringify({
                error: {
                  json: {
                    message: 'Server temporarily unavailable',
                    code: -32603,
                    data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: response.status },
                  },
                },
              }),
              {
                status: 503,
                headers: { 'content-type': 'application/json' },
              }
            );
          }
          return response;
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

// Register Service Worker for offline caching & PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
