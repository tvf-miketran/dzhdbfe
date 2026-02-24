export enum Page {
  DASHBOARD = "dashboard",
  RESOURCES = "resources",
  PROJECTS = "projects",
  LOGTICKETS = "logtickets",
  TIMESHEETS = "timesheets",
  SETTINGS = "settings",
  FORMULACONFIG = "formulaconfig",
  PROFILE = "profile",
}

export interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isUp?: boolean;
  subtitle?: string;
  icon: string;
  colorClass: string;
  progress: number;
}

export interface Ticket {
  id: string;
  title: string;
  code: string;
  due: string;
  status: "In Progress" | "Urgent" | "Done";
  assignees: string[];
  type: "bug" | "code" | "check";
}
export interface TicketEntry {
  id: string;
  ticketId: string;
  projectName: string;
  type: string;
  role: string;
  status: "Open" | "Closed" | "InQA";
  timestamp: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  email: string;
  vnFullName: string;
  enFullName: string;
  authorizeRole: "ADMIN" | "MEMBER";
  status: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesFilters {
  search?: string | null;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: boolean | null;
}

export interface EmployeesResponse {
  data: {
    items: Employee[];
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
    filters: EmployeesFilters;
  };
  message: string;
  success: boolean;
}

export interface User {
  UUID: string;
  authorize_role: "ADMIN" | "MEMBER";
  description: string | null;
  email: string;
  employeeId: string;
  en_full_name: string;
  status: boolean;
  vn_full_name: string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface ProjectItem {
  id: string;
  projectId: string;
  name: string;
  bankId: string;
  bankName: string;
  pmName: string;
  projectLink: string;
  createdAt: string;
}

/** Response from GET /api/projects (full list, no pagination) */
export interface ProjectsAllResponse {
  data: ProjectItem[];
  message: string;
  success: boolean;
}

export interface ProjectsPaginatedFilters {
  bank_id: string;
  search: string;
  sort_by: string;
  sort_order: string;
}

export interface ProjectsPaginatedParams {
  page?: number;
  per_page?: number;
  bank_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

/** Response from GET /api/projects?page=...&per_page=...&... */
export interface ProjectsPaginatedResponse {
  data: {
    filters: ProjectsPaginatedFilters;
    has_next: boolean;
    has_prev: boolean;
    items: ProjectItem[];
    page: number;
    pages: number;
    per_page: number;
    total: number;
  };
  message: string;
  success: boolean;
}

// ─── Project detail with members ─────────────────────────────────────────────

export interface ProjectMemberDetail {
  /** Membership record ID */
  id: string;
  /** Actual employee UUID – matches Employee.id */
  userId: string;
  employeeId: string;
  enFullName: string;
  vnFullName: string;
  email: string;
  authorize_role: "ADMIN" | "MEMBER";
  status: boolean;
  allocationPercent: number;
  joinedAt: string;
}

export interface ProjectDetailWithMembers extends ProjectItem {
  memberCount: number;
  members: ProjectMemberDetail[];
}

/** Response from GET /api/projects/:id?include_members=true */
export interface ProjectDetailResponse {
  data: ProjectDetailWithMembers;
  message: string;
  success: boolean;
}

// ─── Add Project Members ──────────────────────────────────────────────────────

export interface AddProjectMemberItem {
  userId: string;
  allocationPercent: number;
}

/** Payload for POST /api/projects/:id/members */
export interface AddProjectMembersPayload {
  members: AddProjectMemberItem[];
}

export interface AddProjectMembersResponseItem {
  id: string;
  userId: string;
  employeeId: string;
  enFullName: string;
  vnFullName: string;
  email: string;
  allocationPercent: number;
  joinedAt: string;
}

/** Response from POST /api/projects/:id/members */
export interface AddProjectMembersResponse {
  data: {
    count: number;
    members: AddProjectMembersResponseItem[];
  };
  message: string;
  success: boolean;
}
