/**
 * Logworks Query Hooks
 * React Query hooks for fetching logworks data
 */

import { useQuery } from "@tanstack/react-query";
import { logworksService, LogworksFilters } from "../../services";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch admin logworks with optional filters
 */
export const useAdminLogworks = (filters?: LogworksFilters) => {
  return useQuery({
    queryKey: queryKeys.logworks.adminAll(filters),
    queryFn: () => logworksService.getAdminLogworks(filters),
    enabled: !!filters?.year, // Only fetch when year is provided
    staleTime: 0,
    gcTime: 0,
  });
};

/**
 * Hook to fetch the current user's own logworks (MEMBER role)
 */
export const useUserLogworks = (filters?: LogworksFilters) => {
  return useQuery({
    queryKey: [...queryKeys.logworks.all, "userOwn", { params: filters }],
    queryFn: () => logworksService.getUserLogworks(filters),
    enabled: !!filters?.year,
    staleTime: 0,
    gcTime: 0,
  });
};
