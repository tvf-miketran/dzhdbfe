/**
 * Dashboard Service
 * Handles all dashboard and metrics-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import { MetricCardProps } from "../types/index";

export interface DashboardMetrics {
  totalProjects: number;
  activeTickets: number;
  totalRevenue: number;
  teamSize: number;
  projectsChange: number;
  ticketsChange: number;
  revenueChange: number;
  teamChange: number;
}

export interface DashboardOverview {
  metrics: MetricCardProps[];
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineItem[];
}

export interface ActivityItem {
  id: string;
  type: "ticket" | "project" | "user";
  action: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface DeadlineItem {
  id: string;
  title: string;
  type: "ticket" | "project" | "milestone";
  dueDate: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: string;
}

export interface DashboardStats {
  projectStats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  ticketStats: {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
  };
  teamStats: {
    total: number;
    available: number;
    busy: number;
    onLeave: number;
  };
  performanceStats: {
    avgCompletionTime: number;
    onTimeDelivery: number;
    clientSatisfaction: number;
  };
}

/**
 * Dashboard Service - Raw async API calls
 */
export const dashboardService = {
  /**
   * Get dashboard metrics
   */
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await axiosInstance.get<DashboardMetrics>(
      ENDPOINTS.DASHBOARD.METRICS,
    );
    return response.data;
  },

  /**
   * Get dashboard overview (comprehensive data)
   */
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await axiosInstance.get<DashboardOverview>(
      ENDPOINTS.DASHBOARD.OVERVIEW,
    );
    return response.data;
  },

  /**
   * Get detailed dashboard statistics
   */
  getStats: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>(
      ENDPOINTS.DASHBOARD.STATS,
    );
    return response.data;
  },
};
