/**
 * Projects Query Hooks
 * React Query hooks for project-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  projectsService,
  ProjectMember,
  ProjectStats,
  banksService,
} from "../../services";
import { queryKeys } from "./queryKeys";
import type {
  ProjectsAllResponse,
  ProjectsPaginatedResponse,
  ProjectsPaginatedParams,
  ProjectDetailResponse,
  BanksResponse,
} from "../../types";

/**
 * Hook to fetch all banks for dropdown selection
 * GET /api/banks
 */
export const useBanks = (
  options?: Omit<UseQueryOptions<BanksResponse, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.banks.list(),
    queryFn: banksService.getBanks,
    staleTime: 30 * 60 * 1000, // 30 minutes – banks rarely change
    ...options,
  });
};

/**
 * Hook to fetch the full projects list (no pagination) – for filter dropdowns
 */
export const useAllProjects = (
  options?: Omit<
    UseQueryOptions<ProjectsAllResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.projects.listAll(),
    queryFn: projectsService.getAllProjects,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to fetch paginated projects list with optional filters – for the Projects page
 */
export const useProjectsPaginated = (
  params?: ProjectsPaginatedParams,
  options?: Omit<
    UseQueryOptions<ProjectsPaginatedResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.projects.listPaginated(
      params as Record<string, unknown> | undefined,
    ),
    queryFn: () => projectsService.getProjectsPaginated(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch a single project with its members list
 * GET /api/projects/:id?include_members=true
 */
export const useProjectWithMembers = (
  id: string,
  options?: Omit<
    UseQueryOptions<ProjectDetailResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.projects.detail(id), "withMembers"] as const,
    queryFn: () => projectsService.getProjectWithMembers(id),
    enabled: !!id && id !== "All",
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch project members
 */
export const useProjectMembers = (
  id: string,
  options?: Omit<
    UseQueryOptions<ProjectMember[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.projects.members(id),
    queryFn: () => projectsService.getProjectMembers(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook to fetch project statistics
 */
export const useProjectStats = (
  id: string,
  options?: Omit<UseQueryOptions<ProjectStats, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.projects.stats(id),
    queryFn: () => projectsService.getProjectStats(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};
