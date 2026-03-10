/**
 * Centralized API Endpoints Configuration
 * All API endpoints are defined here for easy maintenance and updates
 */

// Base URL - can be overridden by environment variables
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.example.com";

// API versions
export const API_VERSION = {
  V1: "/api",
  V2: "/api/v2",
} as const;

/**
 * Centralized API Endpoints Object
 * Organized by domain/feature area
 */
export const ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY: "/auth/verify",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // User & Profile endpoints
  USER: {
    PROFILE: "/users/profile",
    UPDATE_PROFILE: "/users/profile",
    CHANGE_PASSWORD: "/users/change-password",
    PREFERENCES: "/users/preferences",
  },

  // Employees endpoints
  EMPLOYEES: {
    ME: "/employees/me",
    LIST: "employees",
    GET: (id: string) => `employees/${id}`,
    CREATE: "employees",
    UPDATE: (id: string) => `employees/${id}`,
    DELETE: (id: string) => `employees/${id}`,
    TOGGLE_STATUS: (id: string) => `employees/${id}/toggle-status`,
    RESET_PASSWORD: "employees/reset-password",
  },

  // Dashboard & Metrics endpoints
  DASHBOARD: {
    METRICS: "/dashboard/metrics",
    OVERVIEW: "/dashboard/overview",
    STATS: "/dashboard/stats",
  },

  // Resources endpoints
  RESOURCES: {
    LIST: "/resources",
    GET: (id: string) => `/resources/${id}`,
    CREATE: "/resources",
    UPDATE: (id: string) => `/resources/${id}`,
    DELETE: (id: string) => `/resources/${id}`,
    SEARCH: "/resources/search",
  },

  // Projects endpoints
  PROJECTS: {
    LIST: "/projects",
    GET: (id: string) => `/projects/${id}`,
    CREATE: "/projects",
    UPDATE: (id: string) => `/projects/${id}`,
    DELETE: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
    STATS: (id: string) => `/projects/${id}/stats`,
  },

  // Banks endpoints
  BANKS: {
    LIST: "/banks",
    CREATE: "/banks",
  },

  // Roles endpoints
  ROLES: {
    LIST: "/roles",
  },

  // Tickets endpoints
  TICKETS: {
    LIST: "/tickets",
    MY: "/tickets/my",
    SEARCH: "/tickets/search",
    BULK: "/tickets/bulk",
    BULK_UPDATE: (id: string) => `/tickets/${id}`,
    TYPES: "/ticket-types",
    STATUSES: "/ticket-statuses",
    WEEKS: "/tickets/weeks",
    GET: (id: string) => `/tickets/${id}`,
    CREATE: "/tickets",
    UPDATE: (id: string) => `/tickets/${id}`,
    DELETE: (id: string) => `/tickets/${id}`,
    ASSIGN: (id: string) => `/tickets/${id}/assign`,
    CLOSE: (id: string) => `/tickets/${id}/close`,
    ENTRIES: "/tickets/entries",
  },

  // Timesheets & Logwork endpoints
  TIMESHEETS: {
    LIST: "/timesheets",
    GET: (id: string) => `/timesheets/${id}`,
    CREATE: "/timesheets",
    UPDATE: (id: string) => `/timesheets/${id}`,
    DELETE: (id: string) => `/timesheets/${id}`,
    SUBMIT: (id: string) => `/timesheets/${id}/submit`,
    APPROVE: (id: string) => `/timesheets/${id}/approve`,
  },

  // Performance endpoints
  PERFORMANCE: {
    METRICS: "/performance/metrics",
    REPORTS: "/performance/reports",
    INDIVIDUAL: (userId: string) => `/performance/users/${userId}`,
    TEAM: (teamId: string) => `/performance/teams/${teamId}`,
  },

  // Formula Configuration endpoints
  FORMULA: {
    LIST: "/formulas",
    GET: (id: string) => `/formulas/${id}`,
    CREATE: "/formulas",
    UPDATE: (id: string) => `/formulas/${id}`,
    DELETE: (id: string) => `/formulas/${id}`,
    VALIDATE: "/formulas/validate",
  },

  // Logworks endpoints
  LOGWORKS: {
    ADMIN_ALL: "/logworks/admin/all",
    USER_OWN: "/logworks",
    UPSERT: "/logworks",
  },

  // Settings endpoints
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
    NOTIFICATIONS: "/settings/notifications",
    INTEGRATIONS: "/settings/integrations",
  },
} as const;

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (
  endpoint: string,
  version: string = API_VERSION.V1,
): string => {
  return `${API_BASE_URL}${version}${endpoint}`;
};

/**
 * API Error Codes for consistent error handling
 */
export const API_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Request timeout configurations (in milliseconds)
 */
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  UPLOAD: 120000, // 2 minutes
  DOWNLOAD: 60000, // 1 minute
} as const;
