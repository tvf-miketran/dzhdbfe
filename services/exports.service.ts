/**
 * Exports Service
 * Handles export metadata and excel file export API calls
 */

import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import type {
  ExportTablesResponse,
  ExportTablesData,
  ExportTableOption,
} from "../types";

export interface ExportExcelResponse {
  blob: Blob;
  fileName?: string;
}

const extractFilenameFromContentDisposition = (
  contentDisposition?: string,
): string | undefined => {
  if (!contentDisposition) return undefined;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return undefined;
};

type LegacyTableItem =
  | string
  | {
      key?: string;
      name?: string;
      table?: string;
      table_name?: string;
      label?: string;
      display_name?: string;
      description?: string;
      columns?: string[];
    };

const normalizeTable = (
  raw: LegacyTableItem,
): ExportTableOption | null => {
  if (typeof raw === "string") {
    return {
      key: raw,
      label: raw,
      columns: [],
    };
  }

  if (!raw || typeof raw !== "object") return null;

  const key =
    raw.key ?? raw.name ?? raw.table ?? raw.table_name ?? raw.display_name;

  if (!key) return null;

  return {
    key,
    label: raw.label ?? raw.display_name ?? raw.name ?? raw.table_name ?? key,
    description: raw.description,
    columns: Array.isArray(raw.columns) ? raw.columns : [],
  };
};

const normalizeTablesFromMetadata = (
  data: ExportTablesData,
): ExportTableOption[] => {
  const tableMap = new Map<string, ExportTableOption>();

  (data.tables ?? []).forEach((item) => {
    const key = item?.table;
    if (!key) return;

    tableMap.set(key, {
      key,
      label: key,
      columns: Array.isArray(item.columns) ? item.columns : [],
    });
  });

  (data.table_names ?? []).forEach((tableName) => {
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, {
        key: tableName,
        label: tableName,
        columns: [],
      });
    }
  });

  return [...tableMap.values()];
};

export const exportsService = {
  /**
   * Get exportable tables list
   * GET /api/exports/tables
   */
  getTables: async (): Promise<ExportTableOption[]> => {
    const response = await axiosInstance.get<ExportTablesResponse>(
      ENDPOINTS.EXPORTS.TABLES,
    );

    const rawData = response.data?.data;

    if (!rawData) return [];

    if (Array.isArray(rawData)) {
      return rawData
        .map(normalizeTable)
        .filter((table): table is ExportTableOption => Boolean(table));
    }

    return normalizeTablesFromMetadata(rawData);
  },

  /**
   * Trigger excel export
   * POST /api/exports/excel/export
   */
  exportExcel: async (): Promise<ExportExcelResponse> => {
    const response = await axiosInstance.post(ENDPOINTS.EXPORTS.EXCEL, undefined, {
      responseType: "blob",
    });

    const contentDisposition =
      response.headers?.["content-disposition"] ||
      response.headers?.["Content-Disposition"];

    return {
      blob: response.data,
      fileName: extractFilenameFromContentDisposition(contentDisposition),
    };
  },

  /**
   * Import excel file and replace current data
   * POST /api/exports/excel/import
   */
  importExcel: async (file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosInstance.post(
      ENDPOINTS.EXPORTS.IMPORT_EXCEL,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  },
};
