/**
 * Banks Service
 * Handles all bank-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type { BanksResponse } from "../types";

export const banksService = {
  /**
   * Get all available banks
   * GET /api/banks
   */
  getBanks: async (): Promise<BanksResponse> => {
    const response = await axiosInstance.get<BanksResponse>(
      ENDPOINTS.BANKS.LIST,
    );
    return response.data;
  },
};
