/**
 * Tickets Service
 * Handles all ticket-related API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import { Ticket, TicketEntry } from "../types";

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
  page?: number;
  limit?: number;
}

export interface TicketsListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketEntryData {
  ticketId: string;
  projectName: string;
  type: string;
  role: string;
  status: "Open" | "Closed" | "InQA";
}

/**
 * Tickets Service - Raw async API calls
 */
export const ticketsService = {
  /**
   * Get all tickets with optional filters
   */
  getTickets: async (filters?: TicketFilters): Promise<TicketsListResponse> => {
    const response = await axiosInstance.get<TicketsListResponse>(
      ENDPOINTS.TICKETS.LIST,
      {
        params: filters,
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
};
