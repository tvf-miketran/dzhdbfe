/**
 * User Mutation Hooks
 * React Query hooks for user-related mutations with cache invalidation
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  userService,
  UserProfile,
  UpdateProfileData,
  ChangePasswordData,
  UserPreferences,
} from "../../services";
import { queryKeys } from "../queries";

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = (
  options?: Omit<
    UseMutationOptions<UserProfile, Error, UpdateProfileData>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (data) => {
      // Update cache with new profile data
      queryClient.setQueryData(queryKeys.user.profile(), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    ...options,
  });
};

/**
 * Hook for changing user password
 */
export const useChangePassword = (
  options?: Omit<
    UseMutationOptions<{ message: string }, Error, ChangePasswordData>,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: userService.changePassword,
    ...options,
  });
};

/**
 * Hook for updating user preferences
 */
export const useUpdatePreferences = (
  options?: Omit<
    UseMutationOptions<UserPreferences, Error, Partial<UserPreferences>>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updatePreferences,
    onSuccess: (data) => {
      // Update cache with new preferences
      queryClient.setQueryData(queryKeys.user.preferences(), data);
    },
    ...options,
  });
};

/**
 * Hook for creating a new employee
 */
export const useCreateEmployee = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof userService.createEmployee>>,
      Error,
      Parameters<typeof userService.createEmployee>[0]
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.createEmployee,
    onSuccess: () => {
      // Invalidate employees queries to refetch the list
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
    },
    ...options,
  });
};

/**
 * Hook for updating an existing employee
 */
export const useUpdateEmployee = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof userService.updateEmployee>>,
      Error,
      { id: string; data: Parameters<typeof userService.updateEmployee>[1] }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => userService.updateEmployee(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.detail(id),
      });
    },
    ...options,
  });
};

/**
 * Hook for deleting an employee
 */
export const useDeleteEmployee = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof userService.deleteEmployee>>,
      Error,
      string
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.details() });
    },
    ...options,
  });
};

/**
 * Hook for resetting employee password
 */
export const useResetEmployeePassword = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof userService.resetEmployeePassword>>,
      Error,
      string
    >,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: userService.resetEmployeePassword,
    ...options,
  });
};

/**
 * Hook for toggling employee status (active <-> inactive)
 */
export const useToggleEmployeeStatus = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof userService.toggleEmployeeStatus>>,
      Error,
      string
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.toggleEmployeeStatus,
    onSuccess: () => {
      // Invalidate paginated employees list
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      // Invalidate all project detail caches so the project-filtered view
      // (which uses useProjectWithMembers) also reflects the new status
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.details() });
    },
    ...options,
  });
};
