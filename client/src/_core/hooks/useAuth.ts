import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = '/' } =
    options ?? {};
  const utils = trpc.useUtils();

  const meQuery = (trpc.auth.me as any).useQuery(undefined, {
    retry: 2, // Retry twice on failure (important for mobile network blips)
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false, // Don't refetch on tab switch — causes full page reload feel
    refetchInterval: 180_000, // Refetch every 3 minutes (was 2min — less aggressive for mobile)
    staleTime: 120_000, // Data stays fresh for 2 minutes
    // Don't treat network errors as auth failures
    networkMode: 'online',
  });

  const logoutMutation = (trpc.auth.logout as any).useMutation({
    onSuccess: () => {
      (utils.auth.me as any).setData?.(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      (utils.auth.me as any).setData?.(undefined, null);
      (utils.auth.me as any).invalidate?.();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(meQuery.data)
    );
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
    logoutMutation.isPending,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || logoutMutation.isPending) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    
    // Don't redirect if the query is in error state (could be network issue)
    // Only redirect if we got a definitive "not authenticated" response (data is null/undefined)
    if (meQuery.isError) return;

    window.location.href = redirectPath
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    logoutMutation.isPending,
    meQuery.isLoading,
    meQuery.isError,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
