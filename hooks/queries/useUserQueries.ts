/**
 * User Query Hooks
 * React Query hooks for user-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  userService,
  UserProfile,
  UserPreferences,
  EmployeeProjectsListResponse,
  EmployeeProjectsMeResponse,
} from "../../services";
import { queryKeys } from "./queryKeys";
import type { EmployeesResponse } from "../../types/index";

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
 * Hook to fetch a single employee by ID
 */
export const useEmployee = (
  id: string,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof userService.getEmployee>>, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => userService.getEmployee(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
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

/**
 * Hook to fetch all members and their project assignments (admin only)
 */
export const useMembersProjects = (
  options?: Omit<
    UseQueryOptions<EmployeeProjectsListResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.employees.membersProjects(),
    queryFn: userService.getMembersProjects,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook to fetch current member's project assignments
 */
export const useMeProjects = (
  options?: Omit<
    UseQueryOptions<EmployeeProjectsMeResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.employees.meProjects(),
    queryFn: userService.getMeProjects,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
