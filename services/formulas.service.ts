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

export interface ClosedTicketRoleDetail {
  completed: number;
  completion: number;
  efficiency: number;
  role: string;
  total_assigned_ticket: number;
  total_logged_hours: number;
}

export interface ClosedTicketProjectOverview {
  project_id: string;
  project_name: string;
  resource_allocated: number;
  roles: ClosedTicketRoleDetail[];
}

export interface ClosedTicketStatusItem {
  count: number;
  name: string;
  status: string;
}

export interface ClosedByRoleChart {
  ba: number;
  developers: number;
  eqa: number;
  iqa: number;
  months: number[];
}

export interface TotalTrendItem {
  month: number;
  total_closed: number;
}

export interface TotalTrendChart {
  data: TotalTrendItem[];
  months: number[];
}

export interface StatusOverviewChart {
  items: ClosedTicketStatusItem[];
  total_tickets: number;
  total_tickets_closed: number;
  total_tickets_inqa: number;
  total_tickets_open: number;
}

export interface KpiClosedTicketsData {
  closed_by_role_chart: ClosedByRoleChart;
  month: number;
  project_overview_table: ClosedTicketProjectOverview[];
  status_overview_chart: StatusOverviewChart;
  total_trend_chart: TotalTrendChart;
}

export interface KpiClosedTicketsParams {
  month: number;
  project?: string;
}

export const formulasService = {
  getKpiClosedTickets: async (
    params: KpiClosedTicketsParams,
  ): Promise<{ data: KpiClosedTicketsData; message: string; success: boolean }> => {
    const response = await axiosInstance.get(ENDPOINTS.FORMULA.KPI_CLOSED_TICKETS, {
      params,
    });
    return response.data;
  },

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
