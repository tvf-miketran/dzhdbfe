/**
 * Projects Query Hooks
 * React Query hooks for project-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  projectsService,
  Project,
  ProjectMember,
  ProjectStats,
} from "../../services";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch projects list
 */
export const useProjects = (
  options?: Omit<UseQueryOptions<Project[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: projectsService.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch single project
 */
export const useProject = (
  id: string,
  options?: Omit<UseQueryOptions<Project, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => projectsService.getProject(id),
    enabled: !!id,
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
