/**
 * Tickets Mutation Hooks
 * React Query hooks for ticket-related mutations with cache invalidation
 */

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  ticketsService,
  CreateTicketData,
  UpdateTicketData,
  CreateTicketEntryData,
  BulkCreateTicketsPayload,
  BulkCreateTicketsResponse,
  BulkDeleteTicketsPayload,
  BulkDeleteTicketsResponse,
  BulkCreateTicketItem,
} from "../../services";
import { Ticket, TicketEntry } from "../../types/index";
import { queryKeys } from "../queries";

/**
 * Hook for creating a new ticket
 */
export const useCreateTicket = (
  options?: Omit<
    UseMutationOptions<Ticket, Error, CreateTicketData>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.createTicket,
    onSuccess: () => {
      // Invalidate and refetch tickets list
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for updating a ticket
 */
export const useUpdateTicket = (
  options?: Omit<
    UseMutationOptions<Ticket, Error, { id: string; data: UpdateTicketData }>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ticketsService.updateTicket(id, data),
    onSuccess: (data, variables) => {
      // Update specific ticket in cache
      queryClient.setQueryData(queryKeys.tickets.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for deleting a ticket
 */
export const useDeleteTicket = (
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.deleteTicket,
    onSuccess: (_, ticketId) => {
      // Remove ticket from cache
      queryClient.removeQueries({
        queryKey: queryKeys.tickets.detail(ticketId),
      });

      // Invalidate tickets list
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for assigning a ticket
 */
export const useAssignTicket = (
  options?: Omit<
    UseMutationOptions<Ticket, Error, { id: string; assignees: string[] }>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignees }) =>
      ticketsService.assignTicket(id, assignees),
    onSuccess: (data, variables) => {
      // Update ticket in cache
      queryClient.setQueryData(queryKeys.tickets.detail(variables.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
    },
    ...options,
  });
};

/**
 * Hook for closing a ticket
 */
export const useCloseTicket = (
  options?: Omit<UseMutationOptions<Ticket, Error, string>, "mutationFn">,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.closeTicket,
    onSuccess: (data, ticketId) => {
      // Update ticket in cache
      queryClient.setQueryData(queryKeys.tickets.detail(ticketId), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for creating a ticket entry
 */
export const useCreateTicketEntry = (
  options?: Omit<
    UseMutationOptions<TicketEntry, Error, CreateTicketEntryData>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.createTicketEntry,
    onSuccess: () => {
      // Invalidate ticket entries
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.entries() });
    },
    ...options,
  });
};

/**
 * Hook for bulk creating tickets
 */
export const useBulkCreateTickets = (
  options?: Omit<
    UseMutationOptions<BulkCreateTicketsResponse, Error, BulkCreateTicketsPayload>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.bulkCreateTickets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.entries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for bulk deleting tickets
 */
export const useBulkDeleteTickets = (
  options?: Omit<
    UseMutationOptions<BulkDeleteTicketsResponse, Error, BulkDeleteTicketsPayload>,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketsService.bulkDeleteTickets,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.entries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
    ...options,
  });
};

/**
 * Hook for bulk updating tickets (PUT /api/tickets/bulk)
 */
export const useBulkUpdateTickets = (
  options?: Omit<
    UseMutationOptions<
      BulkCreateTicketsResponse,
      Error,
      { tickets: Array<BulkCreateTicketItem & { id: string }> }
    >,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: ticketsService.bulkUpdateTickets,
    ...options,
  });
};
