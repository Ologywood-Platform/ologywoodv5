import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";

import "./index.css";

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

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = '/';
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
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
