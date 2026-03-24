/**
 * Query Provider Configuration
 * Configures and provides the TanStack Query client for the application
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Create a client instance with production-ready defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: queries will refetch on window focus
      refetchOnWindowFocus: true,

      // Default: queries will refetch on reconnect
      refetchOnReconnect: true,

      // Default: queries will not refetch on mount if data is fresh
      refetchOnMount: true,

      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Consider data stale after 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Network mode: fail if offline
      networkMode: "online",
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      retryDelay: 1000,

      // Network mode: fail if offline
      networkMode: "online",

      // Mutation error handling
      onError: (error) => {
        console.error("Mutation error:", error);
        // You can add global error handling here (e.g., toast notifications)
      },
    },
  },
});

/**
 * Query Provider Props
 */
interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query Provider Component
 * Wraps the application with QueryClientProvider and adds dev tools in development
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/**
 * Export the query client for use in non-component code
 */
export { queryClient };

/**
 * Utility function to prefetch data
 * Useful for prefetching data on route transitions or user interactions
 */
export const prefetchQuery = async <TData,>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  staleTime?: number,
) => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime,
  });
};

/**
 * Utility function to invalidate queries
 * Useful for invalidating queries from outside components
 */
export const invalidateQueries = (queryKey: readonly unknown[]) => {
  return queryClient.invalidateQueries({ queryKey });
};

/**
 * Utility function to reset all queries
 * Useful for handling logout or major state resets
 */
export const resetQueries = () => {
  return queryClient.clear();
};
