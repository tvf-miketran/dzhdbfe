/**
 * User Query Hooks
 * React Query hooks for user-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { userService, UserProfile, UserPreferences } from "../../services";
import { queryKeys } from "./queryKeys";
import type { EmployeesResponse } from "../../types";

/**
 * Hook to fetch user profile
 */
export const useUserProfile = (
  options?: Omit<UseQueryOptions<UserProfile, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: userService.getProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to fetch user preferences
 */
export const useUserPreferences = (
  options?: Omit<
    UseQueryOptions<UserPreferences, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.user.preferences(),
    queryFn: userService.getPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to fetch employees list with pagination and filters
 */
export const useEmployees = (
  params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: boolean;
  },
  options?: Omit<
    UseQueryOptions<EmployeesResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => userService.getEmployees(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
