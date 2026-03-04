/**
 * Logworks Mutation Hooks
 * React Query mutation hooks for logwork write operations
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logworksService, SaveLogworksPayload } from "../../services";
import { queryKeys } from "../queries/queryKeys";

/**
 * Hook to save (upsert) logwork records
 * POST /api/logworks
 */
export const useSaveLogworks = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: SaveLogworksPayload) =>
            logworksService.saveLogworks(payload),
        onSuccess: () => {
            // Invalidate all logwork queries so the table refreshes
            queryClient.invalidateQueries({ queryKey: queryKeys.logworks.all });
        },
    });
};
