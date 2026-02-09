/**
 * Auth Mutation Hooks
 * React Query hooks for authentication mutations
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  authService,
  LoginCredentials,
  LoginResponse,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
} from "../../services";
import { setAuthToken, removeAuthToken } from "../../helpers/axios";
import { queryKeys } from "../queries";
import toast from "react-hot-toast";

/**
 * Hook for user login
 */
export const useLogin = (
  options?: Omit<
    UseMutationOptions<LoginResponse, Error, LoginCredentials>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Store access token
      setAuthToken(data.access_token);
      localStorage.setItem("isAuthenticated", "true");

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    ...options,
  });
};

/**
 * Hook for user logout
 */
export const useLogout = (
  options?: Omit<UseMutationOptions<void, Error, void>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Remove tokens
      removeAuthToken();
      localStorage.removeItem("isAuthenticated");

      // Clear all cached data
      queryClient.clear();
    },
    ...options,
  });
};

/**
 * Hook for user registration
 */
export const useRegister = (
  options?: Omit<
    UseMutationOptions<LoginResponse, Error, RegisterData>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      // Store access token
      setAuthToken(data.access_token);
      localStorage.setItem("isAuthenticated", "true");

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    ...options,
  });
};

/**
 * Hook for forgot password
 */
export const useForgotPassword = (
  options?: Omit<
    UseMutationOptions<{ message: string }, Error, ForgotPasswordData>,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: authService.forgotPassword,
    ...options,
  });
};

/**
 * Hook for reset password
 */
export const useResetPassword = (
  options?: Omit<
    UseMutationOptions<{ msg: string }, Error, ResetPasswordData>,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: authService.resetPassword,
    ...options,
  });
};
