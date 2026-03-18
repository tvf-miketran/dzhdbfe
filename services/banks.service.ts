/**
 * Banks Service
 * Handles all bank-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type { BanksResponse, CreateBankPayload, CreateBankResponse } from "../types/index";

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

  /**
   * Create a new bank
   * POST /api/banks
   */
  createBank: async (payload: CreateBankPayload): Promise<CreateBankResponse> => {
    const response = await axiosInstance.post<CreateBankResponse>(
      ENDPOINTS.BANKS.CREATE,
      payload,
    );
    return response.data;
  },
};
