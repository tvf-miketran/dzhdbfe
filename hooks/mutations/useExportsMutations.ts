/**
 * Export Mutation Hooks
 * React Query hooks for export actions
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { exportsService } from "../../services";
import type { ExportExcelResponse } from "../../services/exports.service";

export const useExportExcel = (
  options?: Omit<UseMutationOptions<ExportExcelResponse, Error, void>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: () => exportsService.exportExcel(),
    ...options,
  });
};

export const useImportExcel = (
  options?: Omit<UseMutationOptions<unknown, Error, File>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: (file: File) => exportsService.importExcel(file),
    ...options,
  });
};
