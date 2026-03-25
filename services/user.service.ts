/**
 * User Service
 * Handles all user and profile-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type { BaseApiResponse, EmployeesResponse } from "../types/index";

export interface UserProfile {
  id: string;
  email: string;
  enFullName: string;
  vnFullName: string;
  employeeId: string;
  authorizeRole: "ADMIN" | "MEMBER";
  description?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  name?: string;
  role?: string;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  joinedAt?: string;
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
   * Get current user profile from /employees/me endpoint
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await axiosInstance.get<UserProfile>(
      ENDPOINTS.EMPLOYEES.ME,
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
    employeeId?: string | null;
    password: string;
    description?: string;
    authorizeRole?: "MEMBER" | "ADMIN";
    status?: boolean;
  }): Promise<
    BaseApiResponse<{
      id: string;
      employeeId: string;
      email: string;
      vnFullName: string;
      enFullName: string;
      authorizeRole: "ADMIN" | "MEMBER";
      status: boolean;
      description?: string;
      createdAt: string;
    }>
  > => {
    const response = await axiosInstance.post(ENDPOINTS.EMPLOYEES.CREATE, data);
    return response.data;
  },

  /**
   * Get a single employee by ID
   */
  getEmployee: async (
    id: string,
  ): Promise<
    BaseApiResponse<{
      authorizeRole: "ADMIN" | "MEMBER";
      createdAt: string;
      description?: string;
      email: string;
      employeeId: string;
      enFullName: string;
      id: string;
      status: boolean;
      updatedAt: string;
      vnFullName: string;
    }>
  > => {
    const response = await axiosInstance.get(ENDPOINTS.EMPLOYEES.GET(id));
    return response.data;
  },

  /**
   * Update an existing employee
   */
  updateEmployee: async (
    id: string,
    data: {
      vnFullName?: string;
      enFullName?: string;
      email?: string;
      employeeId?: string;
      description?: string;
      authorizeRole?: "MEMBER" | "ADMIN";
      status?: boolean;
    },
  ): Promise<
    BaseApiResponse<{
      authorizeRole: "ADMIN" | "MEMBER";
      description?: string;
      email: string;
      employeeId: string;
      enFullName: string;
      id: string;
      status: boolean;
      updatedAt: string;
      vnFullName: string;
    }>
  > => {
    const response = await axiosInstance.put(
      ENDPOINTS.EMPLOYEES.UPDATE(id),
      data,
    );
    return response.data;
  },

  /**
   * Delete an employee
   * DELETE /api/employees/:id
   */
  deleteEmployee: async (
    id: string,
    data: { confirm: boolean; reason?: string },
  ): Promise<BaseApiResponse<null>> => {
    const response = await axiosInstance.delete(ENDPOINTS.EMPLOYEES.DELETE(id), {
      data,
    });
    return response.data;
  },

  /**
   * Reset employee password (resets to employee's email)
   */
  resetEmployeePassword: async (
    employeeId: string,
  ): Promise<BaseApiResponse<null>> => {
    const response = await axiosInstance.post(
      ENDPOINTS.EMPLOYEES.RESET_PASSWORD,
      { employeeId },
    );
    return response.data;
  },

  /**
   * Toggle employee status (active <-> inactive)
   */
  toggleEmployeeStatus: async (
    id: string,
  ): Promise<
    BaseApiResponse<{
      authorizeRole: "ADMIN" | "MEMBER";
      description?: string;
      email: string;
      employeeId: string;
      enFullName: string;
      id: string;
      status: boolean;
      updatedAt: string;
      vnFullName: string;
    }>
  > => {
    const response = await axiosInstance.patch(
      ENDPOINTS.EMPLOYEES.TOGGLE_STATUS(id),
    );
    return response.data;
  },
};
