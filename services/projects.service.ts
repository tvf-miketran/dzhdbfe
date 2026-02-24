/**
 * Projects Service
 * Handles all project-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type {
  ProjectsAllResponse,
  ProjectsPaginatedResponse,
  ProjectsPaginatedParams,
  ProjectDetailResponse,
  AddProjectMembersPayload,
  AddProjectMembersResponse,
} from "../types";

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
   * Get all projects (full list, no pagination) – used for dropdowns/filters
   */
  getAllProjects: async (): Promise<ProjectsAllResponse> => {
    const response = await axiosInstance.get<ProjectsAllResponse>(
      ENDPOINTS.PROJECTS.LIST,
    );
    return response.data;
  },

  /**
   * Get paginated projects list with optional filters – used for the Projects page
   */
  getProjectsPaginated: async (
    params?: ProjectsPaginatedParams,
  ): Promise<ProjectsPaginatedResponse> => {
    const response = await axiosInstance.get<ProjectsPaginatedResponse>(
      ENDPOINTS.PROJECTS.LIST,
      { params },
    );
    return response.data;
  },

  /**
   * Get project detail with members – used for project-based employee filtering
   * GET /api/projects/:id?include_members=true
   */
  getProjectWithMembers: async (id: string): Promise<ProjectDetailResponse> => {
    const response = await axiosInstance.get<ProjectDetailResponse>(
      ENDPOINTS.PROJECTS.GET(id),
      { params: { include_members: true } },
    );
    return response.data;
  },

  /**
   * Add members to a project
   * POST /api/projects/:id/members
   */
  addProjectMembers: async (
    id: string,
    payload: AddProjectMembersPayload,
  ): Promise<AddProjectMembersResponse> => {
    const response = await axiosInstance.post<AddProjectMembersResponse>(
      ENDPOINTS.PROJECTS.MEMBERS(id),
      payload,
    );
    return response.data;
  },

  /**
   * Get all projects (legacy – kept for backward-compat)
   */
  getProjects: async (): Promise<ProjectsAllResponse> => {
    const response = await axiosInstance.get<ProjectsAllResponse>(
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
