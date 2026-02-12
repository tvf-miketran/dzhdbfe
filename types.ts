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
