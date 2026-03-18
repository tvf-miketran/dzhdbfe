/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import { User } from "../types/index";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    access_token: string;
    token_type: string;
    user: User;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  oldPassword: string;
  newPassword: string;
}

/**
 * Auth Service - Raw async API calls
 */
export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },

  /**
   * Refresh authentication token
   */
  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await axiosInstance.post(ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    });
    return response.data;
  },

  /**
   * Verify authentication token
   */
  verifyToken: async (): Promise<{ valid: boolean }> => {
    const response = await axiosInstance.get(ENDPOINTS.AUTH.VERIFY);
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data,
    );
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (
    data: ForgotPasswordData,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      data,
    );
    return response.data;
  },

  /**
   * Reset password with old and new password
   */
  resetPassword: async (data: ResetPasswordData): Promise<{ msg: string }> => {
    const response = await axiosInstance.post(
      ENDPOINTS.AUTH.RESET_PASSWORD,
      data,
    );
    return response.data;
  },
};
