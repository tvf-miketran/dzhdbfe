/**
 * User Service
 * Handles all user and profile-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type { EmployeesResponse } from "../types";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  joinedAt: string;
  bio?: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "auto";
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

/**
 * User Service - Raw async API calls
 */
export const userService = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get<UserProfile>(
      ENDPOINTS.USER.PROFILE,
    );
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await axiosInstance.put<UserProfile>(
      ENDPOINTS.USER.UPDATE_PROFILE,
      data,
    );
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (
    data: ChangePasswordData,
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post(
      ENDPOINTS.USER.CHANGE_PASSWORD,
      data,
    );
    return response.data;
  },

  /**
   * Get user preferences
   */
  getPreferences: async (): Promise<UserPreferences> => {
    const response = await axiosInstance.get<UserPreferences>(
      ENDPOINTS.USER.PREFERENCES,
    );
    return response.data;
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (
    data: Partial<UserPreferences>,
  ): Promise<UserPreferences> => {
    const response = await axiosInstance.put<UserPreferences>(
      ENDPOINTS.USER.PREFERENCES,
      data,
    );
    return response.data;
  },

  /**
   * Get employees list with pagination and filters
   */
  getEmployees: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: boolean;
  }): Promise<EmployeesResponse> => {
    const response = await axiosInstance.get<EmployeesResponse>(
      ENDPOINTS.EMPLOYEES.LIST,
      { params },
    );
    return response.data;
  },

  /**
   * Create a new employee
   */
  createEmployee: async (data: {
    vnFullName: string;
    enFullName: string;
    email: string;
    employeeId: string;
    password: string;
    description?: string;
    authorizeRole?: "MEMBER" | "ADMIN";
    status?: boolean;
  }): Promise<{
    data: {
      id: string;
      employeeId: string;
      email: string;
      vnFullName: string;
      enFullName: string;
      authorizeRole: "ADMIN" | "MEMBER";
      status: boolean;
      description?: string;
      createdAt: string;
    };
    message: string;
    success: boolean;
  }> => {
    const response = await axiosInstance.post(ENDPOINTS.EMPLOYEES.CREATE, data);
    return response.data;
  },
};
