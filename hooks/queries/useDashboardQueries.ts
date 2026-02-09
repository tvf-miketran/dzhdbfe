/**
 * Dashboard Query Hooks
 * React Query hooks for dashboard-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  dashboardService,
  DashboardMetrics,
  DashboardOverview,
  DashboardStats,
} from "../../services";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch dashboard metrics
 */
export const useDashboardMetrics = (
  options?: Omit<
    UseQueryOptions<DashboardMetrics, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(),
    queryFn: dashboardService.getMetrics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch dashboard overview
 */
export const useDashboardOverview = (
  options?: Omit<
    UseQueryOptions<DashboardOverview, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: dashboardService.getOverview,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook to fetch dashboard statistics
 */
export const useDashboardStats = (
  options?: Omit<
    UseQueryOptions<DashboardStats, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: dashboardService.getStats,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};
