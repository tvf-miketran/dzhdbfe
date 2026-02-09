/**
 * Projects Service
 * Handles all project-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "on-hold" | "completed";
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number;
  teamSize: number;
  manager: {
    id: string;
    name: string;
  };
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status: "active" | "on-hold" | "completed";
  startDate: string;
  endDate?: string;
  budget?: number;
  managerId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: "active" | "on-hold" | "completed";
  endDate?: string;
  budget?: number;
}

export interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalHours: number;
  budget: {
    allocated: number;
    spent: number;
  };
}

/**
 * Projects Service - Raw async API calls
 */
export const projectsService = {
  /**
   * Get all projects
   */
  getProjects: async (): Promise<Project[]> => {
    const response = await axiosInstance.get<Project[]>(
      ENDPOINTS.PROJECTS.LIST,
    );
    return response.data;
  },

  /**
   * Get single project by ID
   */
  getProject: async (id: string): Promise<Project> => {
    const response = await axiosInstance.get<Project>(
      ENDPOINTS.PROJECTS.GET(id),
    );
    return response.data;
  },

  /**
   * Create new project
   */
  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await axiosInstance.post<Project>(
      ENDPOINTS.PROJECTS.CREATE,
      data,
    );
    return response.data;
  },

  /**
   * Update existing project
   */
  updateProject: async (
    id: string,
    data: UpdateProjectData,
  ): Promise<Project> => {
    const response = await axiosInstance.put<Project>(
      ENDPOINTS.PROJECTS.UPDATE(id),
      data,
    );
    return response.data;
  },

  /**
   * Delete project
   */
  deleteProject: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(ENDPOINTS.PROJECTS.DELETE(id));
    return response.data;
  },

  /**
   * Get project members
   */
  getProjectMembers: async (id: string): Promise<ProjectMember[]> => {
    const response = await axiosInstance.get<ProjectMember[]>(
      ENDPOINTS.PROJECTS.MEMBERS(id),
    );
    return response.data;
  },

  /**
   * Get project statistics
   */
  getProjectStats: async (id: string): Promise<ProjectStats> => {
    const response = await axiosInstance.get<ProjectStats>(
      ENDPOINTS.PROJECTS.STATS(id),
    );
    return response.data;
  },
};
