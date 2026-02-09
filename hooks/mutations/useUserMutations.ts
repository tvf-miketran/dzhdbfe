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
