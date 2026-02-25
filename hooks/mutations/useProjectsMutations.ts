/**
 * Projects Mutation Hooks
 * React Query hooks for project-related mutations with cache invalidation
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { projectsService, Project, UpdateProjectData } from "../../services";
import type {
  AddProjectMembersPayload,
  AddProjectMembersResponse,
  CreateProjectPayload,
  CreateProjectResponse,
  UpdateProjectPayload,
  UpdateProjectResponse,
} from "../../types";
import { queryKeys } from "../queries";

/**
 * Hook for creating a new project
 * POST /api/projects
 */
export const useCreateProject = (
  options?: Omit<
    UseMutationOptions<CreateProjectResponse, Error, CreateProjectPayload>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectsService.createNewProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.listAll(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for updating a project
 */
export const useUpdateProject = (
  options?: Omit<
    UseMutationOptions<Project, Error, { id: string; data: UpdateProjectData }>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => projectsService.updateProject(id, data),
    onSuccess: (data, variables) => {
      // Update project in cache
      queryClient.setQueryData(queryKeys.projects.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for deleting a project
 */
export const useDeleteProject = (
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectsService.deleteProject,
    onSuccess: (_, projectId) => {
      // Remove project from cache
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for adding members to a project
 * POST /api/projects/:id/members
 */
export const useAddProjectMembers = (
  options?: Omit<
    UseMutationOptions<
      AddProjectMembersResponse,
      Error,
      { projectId: string; payload: AddProjectMembersPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      projectsService.addProjectMembers(projectId, payload),
    onSuccess: () => {
      // Invalidate all project detail caches so withMembers queries refresh
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.details() });
    },
    ...options,
  });
};

/**
 * Hook for updating a project with the new API payload shape
 * PUT /api/projects/:id
 */
export const useUpdateNewProject = (
  options?: Omit<
    UseMutationOptions<
      UpdateProjectResponse,
      Error,
      { id: string; payload: UpdateProjectPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) =>
      projectsService.updateNewProject(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.listAll() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Optimistic update example for project status
 */
export const useUpdateProjectStatus = (
  options?: Omit<
    UseMutationOptions<
      Project,
      Error,
      { id: string; status: "active" | "on-hold" | "completed" },
      { previousProject?: Project }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { id: string; status: "active" | "on-hold" | "completed" },
    { previousProject?: Project }
  >({
    mutationFn: ({ id, status }) =>
      projectsService.updateProject(id, { status }),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.projects.detail(id),
      });

      // Snapshot previous value
      const previousProject = queryClient.getQueryData<Project>(
        queryKeys.projects.detail(id),
      );

      // Optimistically update cache
      if (previousProject) {
        queryClient.setQueryData(queryKeys.projects.detail(id), {
          ...previousProject,
          status,
        });
      }

      return { previousProject };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProject) {
        queryClient.setQueryData(
          queryKeys.projects.detail(variables.id),
          context.previousProject,
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
    ...options,
  });
};
