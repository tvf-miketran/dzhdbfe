/**
 * Logworks Service
 * Handles all logwork-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type { BaseApiResponse } from "../types/index";

export interface Logwork {
  id: string;
  employeeId: string;
  engName: string;
  logHours: number;
  month: string;
  year: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogworksResponse extends BaseApiResponse<Logwork[]> {}

export interface LogworksFilters {
  /** Single month number as string, e.g. "3" */
  month?: string;
  year?: number;
  sortBy?: "asc" | "desc";
  quarter?: string;
  userName?: string;
}

export interface LogworkUpsertItem {
  /** Employee UUID (from employees API) */
  userId: string;
  year?: number;
  month: string;
  logHour: string;
}

export interface SaveLogworksPayload {
  logworks: LogworkUpsertItem[];
}

export interface SaveLogworksResponse extends BaseApiResponse<Logwork[]> {}

/**
 * Logworks Service - Raw async API calls
 */
export const logworksService = {
  /**
   * Get all logworks for admin with optional filters
   * GET /api/logworks/admin/all
   */
  getAdminLogworks: async (
    filters?: LogworksFilters,
  ): Promise<LogworksResponse> => {
    const response = await axiosInstance.get<LogworksResponse>(
      ENDPOINTS.LOGWORKS.ADMIN_ALL,
      {
        params: filters,
      },
    );
    return response.data;
  },

  /**
   * Get logworks for the currently logged-in user
   * GET /api/logworks
   */
  getUserLogworks: async (
    filters?: Omit<LogworksFilters, "userName">,
  ): Promise<LogworksResponse> => {
    const response = await axiosInstance.get<LogworksResponse>(
      ENDPOINTS.LOGWORKS.USER_OWN,
      {
        params: filters,
      },
    );
    return response.data;
  },

  /**
   * Create or update logwork records (upsert)
   * POST /api/logworks
   */
  saveLogworks: async (
    payload: SaveLogworksPayload,
  ): Promise<SaveLogworksResponse> => {
    const response = await axiosInstance.post<SaveLogworksResponse>(
      ENDPOINTS.LOGWORKS.UPSERT,
      payload,
    );
    return response.data;
  },
};
