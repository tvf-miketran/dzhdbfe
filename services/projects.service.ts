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
  ProjectRoleOption,
  AddProjectMembersPayload,
  AddProjectMembersResponse,
  CreateProjectPayload,
  CreateProjectResponse,
  UpdateProjectPayload,
  UpdateProjectResponse,
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
   * Get available project roles
   * GET /api/roles
   */
  getRoles: async (): Promise<ProjectRoleOption[]> => {
    const response = await axiosInstance.get(ENDPOINTS.ROLES.LIST);
    const payload = response.data;

    const normalizeRole = (item: any): ProjectRoleOption | null => {
      if (!item) return null;
      if (typeof item === "string") {
        return { id: item, name: item };
      }

      const roleId =
        item.id ?? item.role_id ?? item.roleId ?? item.value ?? item.code;
      const roleName =
        item.name ?? item.roleName ?? item.role ?? item.label ?? item.code;
      const roleUuid = item.roleUuid ?? item.role_uuid ?? item.uuid;

      if (!roleId || !roleName) return null;
      return {
        id: String(roleId),
        name: String(roleName),
        roleUuid: roleUuid ? String(roleUuid) : undefined,
      };
    };

    if (Array.isArray(payload)) {
      return payload
        .map(normalizeRole)
        .filter((item): item is ProjectRoleOption => Boolean(item));
    }

    const data = payload?.data;
    if (Array.isArray(data)) {
      return data
        .map(normalizeRole)
        .filter((item): item is ProjectRoleOption => Boolean(item));
    }

    return [];
  },

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
    // Validate payload has members with role_id
    const hasInvalidMembers = (payload.members || []).some(
      (m) => !m.role_id || m.role_id === undefined || m.role_id === null,
    );
    if (hasInvalidMembers) {
      console.warn("[ProjectsService] WARNING: Some members missing role_id!");
      (payload.members || []).forEach((m, idx) => {
        console.warn(`  Member ${idx}: userId=${m.userId}, role_id=${m.role_id}`);
      });
    }

    const response = await axiosInstance.post<AddProjectMembersResponse>(
      ENDPOINTS.PROJECTS.MEMBERS(id),
      payload,
    );
    return response.data;
  },

  /**
   * Create a new project
   * POST /api/projects
   */
  createNewProject: async (
    payload: CreateProjectPayload,
  ): Promise<CreateProjectResponse> => {
    const response = await axiosInstance.post<CreateProjectResponse>(
      ENDPOINTS.PROJECTS.CREATE,
      payload,
    );
    return response.data;
  },

  /**
   * Update an existing project (new API shape)
   * PUT /api/projects/:id
   */
  updateNewProject: async (
    id: string,
    payload: UpdateProjectPayload,
  ): Promise<UpdateProjectResponse> => {
    const response = await axiosInstance.put<UpdateProjectResponse>(
      ENDPOINTS.PROJECTS.UPDATE(id),
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

  /**
   * Remove a member from a project
   * DELETE /api/projects/:projectId/members
   * Body: { members: [{ userId: string }] }
   */
  removeMember: async (projectId: string, userId: string): Promise<{ message: string; success: boolean }> => {
    const response = await axiosInstance.delete(
      ENDPOINTS.PROJECTS.MEMBERS(projectId),
      { data: { members: [{ userId }] } },
    );
    return response.data;
  },
};
