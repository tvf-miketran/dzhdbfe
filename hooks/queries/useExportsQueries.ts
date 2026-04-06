/**
 * Export Query Hooks
 * React Query hooks for export metadata
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { exportsService } from "../../services";
import { queryKeys } from "./queryKeys";
import type { ExportTableOption } from "../../types";

export const useExportTables = (
  options?: Omit<
    UseQueryOptions<ExportTableOption[], Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: queryKeys.exports.tables(),
    queryFn: exportsService.getTables,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};
