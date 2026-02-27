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
import { setAuthToken, removeAuthToken, ApiError } from "../../helpers/axios";
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
      console.log("[useLogin] Login response:", data);

      // Validate response structure
      if (!data?.user?.access_token) {
        console.error(
          "[useLogin] Invalid response structure - missing access_token",
        );
        toast.error("Login failed: Invalid response from server");
        return;
      }

      // Store access token and user information
      console.log(
        "[useLogin] Storing token:",
        data.user.access_token.substring(0, 20) + "...",
      );
      setAuthToken(data.user.access_token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(data.user.user));

      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    },
    onError: (error: ApiError) => {
      // Show error toast with message from API response
      toast.error(error.message || "Login failed. Please check your credentials.");
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
      // Store access token and user information
      setAuthToken(data.user.access_token);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("user", JSON.stringify(data.user.user));

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
