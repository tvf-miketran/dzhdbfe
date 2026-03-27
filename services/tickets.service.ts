/**
 * Tickets Service
 * Handles all ticket-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import { BaseApiResponse, Ticket, TicketEntry } from "../types/index";

export interface CreateTicketData {
  title: string;
  code: string;
  projectId: string;
  type: "bug" | "code" | "check";
  status: "In Progress" | "Urgent" | "Done";
  due: string;
  assignees?: string[];
}

export interface UpdateTicketData {
  title?: string;
  status?: "In Progress" | "Urgent" | "Done";
  due?: string;
  assignees?: string[];
}

export interface TicketFilters {
  status?: string;
  type?: string;
  projectId?: string;
  assigneeId?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
  perPage?: number;
  week?: number[];
  month?: number | string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  ticketTypeId?: string;
  ticketStatusId?: string;
}

export interface TicketTypeOption {
  id: string;
  name: string;
  code?: string;
}

export interface TicketStatusOption {
  id: string;
  name: string;
  code?: string;
}

export interface WeekOption {
  id: string;
  name: string;
  code?: string;
}

export interface TicketsListData {
  filters: {
    employee_id?: string[];
    month?: number[];
    project_id?: string[];
    search?: string;
    sort_by?: string;
    sort_order?: string;
    ticket_status_id?: string | null;
    ticket_type_id?: string | null;
    week?: number[];
  };
  has_next: boolean;
  has_prev: boolean;
  items: Ticket[];
  page: number;
  pages: number;
  per_page: number;
  total: number;
}

export interface TicketsListResponse
  extends BaseApiResponse<TicketsListData> {}

export interface CreateTicketEntryData {
  ticketId: string;
  projectName: string;
  type: string;
  role: string;
  status: "Open" | "Closed" | "InQA";
}

export interface BulkCreateTicketItem {
  ticketId: string;
  ticketLink: string;
  projectId: string;
  roleIds: string[];
  employeeId: string;
  ticketTypeId: string;
  ticketStatusId: string;
  week: string;
  month: string;
}

export interface BulkCreateTicketsPayload {
  tickets: BulkCreateTicketItem[];
}

export interface BulkDeleteTicketsPayload {
  ids: string[];
}

export interface BulkTicketItem {
  id: string;
  ticketId: string;
  ticketLink: string;
  projectId: string;
  projectName: string;
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  employeeEngName: string;
  roleIds: string[];
  roleNames: string[];
  roleUuids: string[];
  ticketTypeId: string;
  ticketTypeName: string;
  ticketStatusId: string;
  ticketStatusName: string;
  week: number;
  month: number;
  createdAt: string;
  updatedAt: string;
}

export interface BulkCreateTicketsResponse
  extends BaseApiResponse<{
    created: BulkTicketItem[];
    existing: Array<{
      ticketId: string;
      ticket: BulkTicketItem;
    }>;
    total_created: number;
    total_existing: number;
  }> {}

export interface BulkDeleteTicketsResponse
  extends BaseApiResponse<{
    deleted?: number;
    ids?: string[];
  }> {}

/**
 * Tickets Service - Raw async API calls
 */
export const ticketsService = {
  /**
   * Get all tickets with optional filters
   */
  getTickets: async (filters?: TicketFilters): Promise<TicketsListResponse> => {
    const params = {
      page: filters?.page ?? 1,
      per_page: filters?.perPage ?? filters?.limit ?? 50,
      project_id: filters?.projectId ?? "",
      employee_id: filters?.employeeId ?? filters?.assigneeId ?? "",
      ticket_type_id: filters?.ticketTypeId ?? "",
      ticket_status_id: filters?.ticketStatusId ?? "",
      week: (filters?.week && filters.week.length > 0
        ? filters.week
        : [1, 2, 3, 4, 5, 6]
      ).join(","),
      month:
        filters?.month === undefined || filters?.month === null
          ? ""
          : String(filters.month),
      search: filters?.search ?? "",
      sort_by: filters?.sortBy ?? "",
      sort_order: filters?.sortOrder ?? "",
    };

    const response = await axiosInstance.get<TicketsListResponse>(
      ENDPOINTS.TICKETS.LIST,
      {
        params,
      },
    );
    return response.data;
  },

  /**
   * Get my own tickets (employee's tickets) with optional filters
   */
  getTicketsForMe: async (filters?: TicketFilters): Promise<TicketsListResponse> => {
    const params = {
      page: filters?.page ?? 1,
      per_page: filters?.perPage ?? filters?.limit ?? 50,
      project_id: filters?.projectId ?? "",
      employee_id: filters?.employeeId ?? filters?.assigneeId ?? "",
      ticket_type_id: filters?.ticketTypeId ?? "",
      ticket_status_id: filters?.ticketStatusId ?? "",
      week: (filters?.week && filters.week.length > 0
        ? filters.week
        : []
      ).join(","),
      month:
        filters?.month === undefined || filters?.month === null
          ? ""
          : String(filters.month),
      search: filters?.search ?? "",
      sort_by: filters?.sortBy ?? "",
      sort_order: filters?.sortOrder ?? "",
    };

    const response = await axiosInstance.get<TicketsListResponse>(
      ENDPOINTS.TICKETS.MY,
      {
        params,
      },
    );
    return response.data;
  },

  /**
   * Get single ticket by ID
   */
  getTicket: async (id: string): Promise<Ticket> => {
    const response = await axiosInstance.get<Ticket>(ENDPOINTS.TICKETS.GET(id));
    return response.data;
  },

  /**
   * Create new ticket
   */
  createTicket: async (data: CreateTicketData): Promise<Ticket> => {
    const response = await axiosInstance.post<Ticket>(
      ENDPOINTS.TICKETS.CREATE,
      data,
    );
    return response.data;
  },

  /**
   * Update existing ticket
   */
  updateTicket: async (id: string, data: UpdateTicketData): Promise<Ticket> => {
    const response = await axiosInstance.put<Ticket>(
      ENDPOINTS.TICKETS.UPDATE(id),
      data,
    );
    return response.data;
  },

  /**
   * Delete ticket
   */
  deleteTicket: async (id: string): Promise<void> => {
    const response = await axiosInstance.delete(ENDPOINTS.TICKETS.DELETE(id));
    return response.data;
  },

  /**
   * Assign ticket to users
   */
  assignTicket: async (id: string, assignees: string[]): Promise<Ticket> => {
    const response = await axiosInstance.post<Ticket>(
      ENDPOINTS.TICKETS.ASSIGN(id),
      { assignees },
    );
    return response.data;
  },

  /**
   * Close ticket
   */
  closeTicket: async (id: string): Promise<Ticket> => {
    const response = await axiosInstance.post<Ticket>(
      ENDPOINTS.TICKETS.CLOSE(id),
    );
    return response.data;
  },

  /**
   * Get ticket entries
   */
  getTicketEntries: async (): Promise<TicketEntry[]> => {
    const response = await axiosInstance.get<TicketEntry[]>(
      ENDPOINTS.TICKETS.ENTRIES,
    );
    return response.data;
  },

  /**
   * Get ticket types for dropdown selection
   */
  getTicketTypes: async (): Promise<TicketTypeOption[]> => {
    const response = await axiosInstance.get(ENDPOINTS.TICKETS.TYPES);
    const payload = response.data as
      | TicketTypeOption[]
      | { data?: TicketTypeOption[] | { items?: TicketTypeOption[] } };

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.data?.items)) {
      return payload.data.items;
    }

    return [];
  },

  /**
   * Get ticket statuses for dropdown selection
   */
  getTicketStatuses: async (): Promise<TicketStatusOption[]> => {
    const response = await axiosInstance.get(ENDPOINTS.TICKETS.STATUSES);
    const payload = response.data as
      | TicketStatusOption[]
      | { data?: TicketStatusOption[] | { items?: TicketStatusOption[] } };

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.data?.items)) {
      return payload.data.items;
    }

    return [];
  },

  /**
   * Get available weeks for a specific month
   */
  getWeeks: async (month: number): Promise<WeekOption[]> => {
    const response = await axiosInstance.post(ENDPOINTS.TICKETS.WEEKS, {
      month: String(month),
    });
    const payload = response.data;

    // Handle format: { data: { weeks: ["1 (01/02/2026-01/02/2026)", ...] }, ... }
    if (payload?.data?.weeks && Array.isArray(payload.data.weeks)) {
      return payload.data.weeks.map((week: string, index: number) => ({
        id: String(index + 1),
        name: week,
      }));
    }

    // Handle format: { data: [...] } or { data: { items: [...] } }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.data?.items)) {
      return payload.data.items;
    }

    // Handle format: [...]
    if (Array.isArray(payload)) {
      return payload;
    }

    return [];
  },

  /**
   * Search tickets with query string
   */
  searchTickets: async (query: string): Promise<TicketsListResponse> => {
    const response = await axiosInstance.get<TicketsListResponse>(
      ENDPOINTS.TICKETS.SEARCH,
      {
        params: { query },
      },
    );
    return response.data;
  },

  /**
   * Create ticket entry
   */
  createTicketEntry: async (
    data: CreateTicketEntryData,
  ): Promise<TicketEntry> => {
    const response = await axiosInstance.post<TicketEntry>(
      ENDPOINTS.TICKETS.ENTRIES,
      data,
    );
    return response.data;
  },

  /**
   * Bulk create tickets
   */
  bulkCreateTickets: async (
    payload: BulkCreateTicketsPayload,
  ): Promise<BulkCreateTicketsResponse> => {
    const response = await axiosInstance.post<BulkCreateTicketsResponse>(
      ENDPOINTS.TICKETS.BULK,
      payload,
    );
    return response.data;
  },

  /**
   * Bulk delete tickets
   */
  bulkDeleteTickets: async (
    payload: BulkDeleteTicketsPayload,
  ): Promise<BulkDeleteTicketsResponse> => {
    const response = await axiosInstance.delete<BulkDeleteTicketsResponse>(
      ENDPOINTS.TICKETS.BULK,
      {
        data: payload,
      },
    );
    return response.data;
  },

  /**
   * Update existing ticket from bulk operation
   */
  bulkUpdateTicket: async (
    id: string,
    payload: BulkCreateTicketItem,
  ): Promise<BulkTicketItem> => {
    const response = await axiosInstance.put<BulkTicketItem>(
      ENDPOINTS.TICKETS.BULK_UPDATE(id),
      payload,
    );
    return response.data;
  },

  /**
   * Bulk update multiple tickets (PUT /api/tickets/bulk)
   */
  bulkUpdateTickets: async (payload: {
    tickets: Array<BulkCreateTicketItem & { id: string }>;
  }): Promise<BulkCreateTicketsResponse> => {
    const response = await axiosInstance.put<BulkCreateTicketsResponse>(
      ENDPOINTS.TICKETS.BULK,
      payload,
    );
    return response.data;
  },
};
