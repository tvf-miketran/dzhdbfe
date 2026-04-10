/**
 * Query Keys Factory
 * Centralized query key management for React Query
 * Provides type-safe, hierarchical query keys for cache management
 */

export const queryKeys = {
  // Auth keys
  auth: {
    all: ["auth"] as const,
    verify: () => [...queryKeys.auth.all, "verify"] as const,
  },

  // User keys
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    preferences: () => [...queryKeys.user.all, "preferences"] as const,
    employees: (params?: Record<string, unknown> | undefined) =>
      [...queryKeys.user.all, "employees", { params }] as const,
  },

  // Employees keys
  employees: {
    all: ["employees"] as const,
    lists: () => [...queryKeys.employees.all, "list"] as const,
    list: (params?: Record<string, unknown> | undefined) =>
      [...queryKeys.employees.lists(), { params }] as const,
    details: () => [...queryKeys.employees.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    meProjects: () => [...queryKeys.employees.all, "meProjects"] as const,
    membersProjects: () =>
      [...queryKeys.employees.all, "membersProjects"] as const,
  },

  // Dashboard keys
  dashboard: {
    all: ["dashboard"] as const,
    metrics: () => [...queryKeys.dashboard.all, "metrics"] as const,
    overview: () => [...queryKeys.dashboard.all, "overview"] as const,
    stats: () => [...queryKeys.dashboard.all, "stats"] as const,
  },

  // Tickets keys
  tickets: {
    all: ["tickets"] as const,
    lists: () => [...queryKeys.tickets.all, "list"] as const,
    list: (filters?: Record<string, unknown> | undefined) =>
      [...queryKeys.tickets.lists(), { filters }] as const,
    details: () => [...queryKeys.tickets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
    entries: () => [...queryKeys.tickets.all, "entries"] as const,
  },

  // Banks keys
  banks: {
    all: ["banks"] as const,
    list: () => [...queryKeys.banks.all, "list"] as const,
  },

  // Projects keys
  projects: {
    all: ["projects"] as const,
    lists: () => [...queryKeys.projects.all, "list"] as const,
    list: () => [...queryKeys.projects.lists()] as const,
    listAll: () => [...queryKeys.projects.all, "listAll"] as const,
    listPaginated: (params?: Record<string, unknown> | undefined) =>
      [...queryKeys.projects.all, "listPaginated", { params }] as const,
    details: () => [...queryKeys.projects.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    members: (id: string) =>
      [...queryKeys.projects.detail(id), "members"] as const,
    stats: (id: string) => [...queryKeys.projects.detail(id), "stats"] as const,
  },

  // Resources keys
  resources: {
    all: ["resources"] as const,
    lists: () => [...queryKeys.resources.all, "list"] as const,
    list: () => [...queryKeys.resources.lists()] as const,
    details: () => [...queryKeys.resources.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.resources.details(), id] as const,
  },

  // Performance keys
  performance: {
    all: ["performance"] as const,
    metrics: () => [...queryKeys.performance.all, "metrics"] as const,
    reports: () => [...queryKeys.performance.all, "reports"] as const,
    individual: (userId: string) =>
      [...queryKeys.performance.all, "individual", userId] as const,
    team: (teamId: string) =>
      [...queryKeys.performance.all, "team", teamId] as const,
  },

  // Timesheets keys
  timesheets: {
    all: ["timesheets"] as const,
    lists: () => [...queryKeys.timesheets.all, "list"] as const,
    list: () => [...queryKeys.timesheets.lists()] as const,
    details: () => [...queryKeys.timesheets.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.timesheets.details(), id] as const,
  },

  // Logworks keys
  logworks: {
    all: ["logworks"] as const,
    adminAll: (filters?: object | undefined) =>
      [...queryKeys.logworks.all, "adminAll", { filters }] as const,
  },

  // Formula keys
  formula: {
    all: ["formula"] as const,
    lists: () => [...queryKeys.formula.all, "list"] as const,
    list: () => [...queryKeys.formula.lists()] as const,
    details: () => [...queryKeys.formula.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.formula.details(), id] as const,
  },

  // Exports keys
  exports: {
    all: ["exports"] as const,
    tables: () => [...queryKeys.exports.all, "tables"] as const,
  },

  // Settings keys
  settings: {
    all: ["settings"] as const,
    general: () => [...queryKeys.settings.all, "general"] as const,
    notifications: () => [...queryKeys.settings.all, "notifications"] as const,
    integrations: () => [...queryKeys.settings.all, "integrations"] as const,
  },
} as const;
