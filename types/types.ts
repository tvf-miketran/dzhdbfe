export enum Page {
  DASHBOARD = "dashboard",
  ODASHBOARD = "odashboard",
  RESOURCES = "resources",
  PROJECTS = "projects",
  LOGTICKETS = "logtickets",
  OTICKET = "oticket",
  TIMESHEETS = "timesheets",
  FORMULACONFIG = "formulaconfig",
  PROFILE = "profile",
}

export interface BaseApiResponse<TData = unknown> {
  data: TData;
  message: string;
  success: boolean;
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
  projectId?: string;
  type: string;
  ticketTypeId?: string;
  roles: string[];
  roleUuids?: string[];
  status: string;
  ticketStatusId?: string;
  timestamp: string;
  week?: number;
  weekLabel?: string;
  month?: number;
  length?: number;
}

export interface EmployeeProject {
  projectId: string;
  projectName: string | null;
  projectKey?: string | null;
  roleId: string | null;
  roleName: string | null;
  allocationPercent: number;
  joinedAt: string;
}

export interface Employee {
  id: string;
  email: string;
  vnFullName: string;
  enFullName: string;
  authorizeRole: "ADMIN" | "MEMBER" | "MANAGER";
  status: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  projects?: EmployeeProject[];
  employeeId?: string;
}

export interface EmployeesFilters {
  search?: string | null;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: boolean | null;
}

export interface EmployeesResponse
  extends BaseApiResponse<{
    items: Employee[];
    page: number;
    pages: number;
    per_page: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
    filters: EmployeesFilters;
  }> {}

export interface User {
  UUID: string;
  authorize_role: "ADMIN" | "MEMBER" | "MANAGER";
  description: string | null;
  email: string;
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
export interface ProjectsAllResponse extends BaseApiResponse<ProjectItem[]> {}

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
export interface ProjectsPaginatedResponse
  extends BaseApiResponse<{
    filters: ProjectsPaginatedFilters;
    has_next: boolean;
    has_prev: boolean;
    items: ProjectItem[];
    page: number;
    pages: number;
    per_page: number;
    total: number;
  }> {}

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
  authorize_role: "ADMIN" | "MEMBER" | "MANAGER";
  status: boolean;
  allocationPercent: number;
  joinedAt: string;
  roleId?: string | null;
  roleName?: string | null;
}

export interface ProjectDetailWithMembers extends ProjectItem {
  memberCount: number;
  members: ProjectMemberDetail[];
  /** ISO datetime string as returned by the API, e.g. "2026-02-19T00:00:00+07:00" */
  startDate?: string;
  /** ISO datetime string as returned by the API, e.g. "2026-03-05T00:00:00+07:00" */
  endDate?: string;
}

/** Response from GET /api/projects/:id?include_members=true */
export interface ProjectDetailResponse
  extends BaseApiResponse<ProjectDetailWithMembers> {}

// ─── Add Project Members ──────────────────────────────────────────────────────

export interface AddProjectMemberItem {
  userId: string;
  allocationPercent: number;
  role_id: string;
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
export interface AddProjectMembersResponse
  extends BaseApiResponse<{
    count: number;
    members: AddProjectMembersResponseItem[];
  }> {}

export interface ProjectRoleOption {
  id: string;
  name: string;
  roleUuid?: string;
}

// ─── Banks ────────────────────────────────────────────────────────────────────

export interface BankItem {
  id: string;
  name: string;
  createdAt: string;
}

/** Payload for POST /api/banks */
export interface CreateBankPayload {
  name: string;
}

/** Response from POST /api/banks */
export interface CreateBankResponse extends BaseApiResponse<BankItem> {}

/** Response from GET /api/banks */
export interface BanksResponse extends BaseApiResponse<BankItem[]> {}

// ─── Create Project ───────────────────────────────────────────────────────────

/** Payload for POST /api/projects */
export interface CreateProjectPayload {
  name: string;
  pmName: string;
  projectId: string;
  bankId?: string;
  projectLink?: string;
  /** DDMMYYYY format */
  startDate?: string;
  /** DDMMYYYY format */
  endDate?: string;
}

/** Response from POST /api/projects */
export interface CreateProjectResponse
  extends BaseApiResponse<
    ProjectItem & {
      pmName: string;
      projectId: string;
      projectLink?: string;
      startDate?: string;
      endDate?: string;
    }
  > {}

// ─── Update Project ───────────────────────────────────────────────────────────

/** Payload for PUT /api/projects/:id */
export interface UpdateProjectPayload {
  name?: string;
  pmName?: string;
  projectId?: string;
  bankId?: string;
  projectLink?: string;
  /** DDMMYYYY format */
  startDate?: string;
  /** DDMMYYYY format */
  endDate?: string;
}

/** Response from PUT /api/projects/:id */
export interface UpdateProjectResponse
  extends BaseApiResponse<
    ProjectItem & {
      pmName?: string;
      projectId?: string;
      projectLink?: string;
      startDate?: string;
      endDate?: string;
    }
  > {}
