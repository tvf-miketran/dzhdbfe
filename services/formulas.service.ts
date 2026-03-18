/**
 * Formulas Service
 * Handles formula-related API calls used by dashboards.
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";

export interface FormulaCalculateUserParams {
  month: string;
  latest?: boolean;
}

export interface FormulaCalculateParams {
  month: string;
}

export const formulasService = {
  getFormulaByUser: async (
    userId: string,
    params: FormulaCalculateUserParams,
  ): Promise<unknown> => {
    const response = await axiosInstance.get(
      ENDPOINTS.FORMULA.CALCULATE_USER(userId),
      {
        params,
      },
    );
    return response.data;
  },

  getFormulaODC: async (params: FormulaCalculateParams): Promise<unknown> => {
    const response = await axiosInstance.get(ENDPOINTS.FORMULA.CALCULATE, {
      params,
    });
    return response.data;
  },
};
