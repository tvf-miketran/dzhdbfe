/**
 * Auth Query Hooks
 * React Query hooks for authentication-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { authService } from "../../services";
import { queryKeys } from "./queryKeys";

/**
 * Hook to verify authentication token
 */
export const useVerifyAuth = (
  options?: Omit<
    UseQueryOptions<{ valid: boolean }, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.auth.verify(),
    queryFn: authService.verifyToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
