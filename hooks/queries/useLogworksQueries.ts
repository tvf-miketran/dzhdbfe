/**
 * Logworks Query Hooks
 * React Query hooks for fetching logworks data
 */

import { useQuery } from "@tanstack/react-query";
import { logworksService, LogworksFilters } from "../../services";
import { queryKeys } from "./queryKeys";

/** Serialize a number[] to a comma-separated string for month query param */
const serializeMonths = (months?: number[]): string | undefined => {
  if (!months || months.length === 0) return undefined;
  return months.join(",");
};

/**
 * Hook to fetch admin logworks with optional filters (multi-month support)
 * @param months - array of month numbers (1-12)
 */
export const useAdminLogworks = (
  filters?: Omit<LogworksFilters, "month"> & { months?: number[] },
) => {
  const params: LogworksFilters = {
    ...filters,
    month: serializeMonths(filters?.months),
  };

  return useQuery({
    queryKey: queryKeys.logworks.adminAll(params),
    queryFn: () => logworksService.getAdminLogworks(params),
    enabled: !!filters?.year, // Only fetch when year is provided
    staleTime: 0,
    gcTime: 0,
  });
};

/**
 * Hook to fetch the current user's own logworks (MEMBER role)
 * @param months - array of month numbers (1-12)
 */
export const useUserLogworks = (
  filters?: Omit<LogworksFilters, "month"> & { months?: number[] },
) => {
  const params: LogworksFilters = {
    ...filters,
    month: serializeMonths(filters?.months),
  };

  return useQuery({
    queryKey: [...queryKeys.logworks.all, "userOwn", { params }],
    queryFn: () => logworksService.getUserLogworks(params),
    enabled: !!filters?.year,
    staleTime: 0,
    gcTime: 0,
  });
};
