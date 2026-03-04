/**
 * Tickets Query Hooks
 * React Query hooks for ticket-related queries
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  ticketsService,
  TicketsListResponse,
  TicketFilters,
  TicketTypeOption,
  TicketStatusOption,
  WeekOption,
} from "../../services";
import { Ticket, TicketEntry } from "../../types";
import { queryKeys } from "./queryKeys";

/**
 * Hook to fetch tickets list
 */
export const useTickets = (
  filters?: TicketFilters,
  options?: Omit<
    UseQueryOptions<TicketsListResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.tickets.list(
      filters as Record<string, unknown> | undefined,
    ),
    queryFn: () => ticketsService.getTickets(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook to fetch single ticket
 */
export const useTicket = (
  id: string,
  options?: Omit<UseQueryOptions<Ticket, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketsService.getTicket(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to fetch ticket entries
 */
export const useTicketEntries = (
  options?: Omit<UseQueryOptions<TicketEntry[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: queryKeys.tickets.entries(),
    queryFn: ticketsService.getTicketEntries,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook to fetch ticket types for dropdown selection
 */
export const useTicketTypes = (
  options?: Omit<
    UseQueryOptions<TicketTypeOption[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.tickets.all, "types"] as const,
    queryFn: ticketsService.getTicketTypes,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook to fetch ticket statuses for dropdown selection
 */
export const useTicketStatuses = (
  options?: Omit<
    UseQueryOptions<TicketStatusOption[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: [...queryKeys.tickets.all, "statuses"] as const,
    queryFn: ticketsService.getTicketStatuses,
    staleTime: 10 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook to fetch available weeks for a specific month
 */
export const useWeeks = (
  month: number | null | undefined,
  options?: Omit<UseQueryOptions<WeekOption[], Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: [...queryKeys.tickets.all, "weeks", month] as const,
    queryFn: () => ticketsService.getWeeks(month!),
    staleTime: 10 * 60 * 1000,
    enabled: month !== null && month !== undefined,
    ...options,
  });
};
