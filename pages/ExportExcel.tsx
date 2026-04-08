import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import {
  useExportExcel,
  useImportExcel,
} from "../hooks/mutations/useExportsMutations";
import { useExportTables } from "../hooks/queries/useExportsQueries";
import "./NyanCat.css";
interface ImportedTablePreview {
  tableName: string;
  columns: string[];
}

const ExportExcel: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importPreviewTables, setImportPreviewTables] = useState<ImportedTablePreview[]>([]);
  const [isParsingImportFile, setIsParsingImportFile] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);

  const {
    data: tables,
    isLoading: isLoadingTables,
    isError: isLoadTablesError,
    error: tablesError,
    refetch,
  } = useExportTables();

  const { mutateAsync: exportExcel, isPending: isExporting } = useExportExcel();
  const { mutateAsync: importExcel, isPending: isImporting } = useImportExcel();

  const normalizedSearch = searchKeyword.trim().toLowerCase();

  const filteredTables = useMemo(() => {
    const source = tables ?? [];

    if (!normalizedSearch) return source;

    return source.filter((table) => {
      return (
        table.key.toLowerCase().includes(normalizedSearch) ||
        table.label?.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [tables, normalizedSearch]);

  const handleExport = async () => {
    try {
      const exportResult = await exportExcel();

      const now = new Date();
      const pad2 = (value: number) => String(value).padStart(2, "0");
      const fileName = `data_${pad2(now.getHours())}${pad2(
        now.getMinutes(),
      )}${pad2(now.getSeconds())}_${pad2(now.getDate())}${pad2(
        now.getMonth() + 1,
      )}${now.getFullYear()}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(exportResult.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("Excel export completed successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Excel export failed. Please try again.";

      toast.error(message);
    }
  };

  const parseImportedFile = async (
    file: File,
  ): Promise<ImportedTablePreview[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    return workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
        worksheet,
        {
          header: 1,
          blankrows: false,
        },
      );

      const firstNonEmptyRow = rows.find((row) =>
        row.some((cell) => String(cell ?? "").trim().length > 0),
      );

      const columns = (firstNonEmptyRow ?? [])
        .map((cell) => String(cell ?? "").trim())
        .filter(Boolean);

      return {
        tableName: sheetName,
        columns,
      };
    });
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedImportFile(null);
      setImportPreviewTables([]);
      return;
    }

    setSelectedImportFile(file);
    setIsParsingImportFile(true);

    try {
      const preview = await parseImportedFile(file);
      setImportPreviewTables(preview);
      toast.success("Excel file parsed successfully.");
    } catch (error) {
      setImportPreviewTables([]);
      setSelectedImportFile(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to parse the selected Excel file.",
      );
    } finally {
      setIsParsingImportFile(false);
      event.target.value = "";
    }
  };

  const executeImport = async () => {
    if (!selectedImportFile) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    try {
      await importExcel(selectedImportFile);
      toast.success("Excel import completed successfully.");
      setSelectedImportFile(null);
      setImportPreviewTables([]);
      setIsImportConfirmOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Excel import failed. Please try again.",
      );
    }
  };

  const handleImportClick = () => {
    if (!selectedImportFile) {
      toast.error("Please choose an Excel file first.");
      return;
    }

    setIsImportConfirmOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Import Excel</h3>
            <p className="text-sm text-slate-500 mt-1">
              Select an Excel file, review detected tables and columns, then import.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center justify-center rounded-lg border border-border-light px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50">
              Choose File
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFileChange}
                className="hidden"
              />
            </label>
            <button
              onClick={handleImportClick}
              disabled={
                !selectedImportFile ||
                isImporting ||
                isParsingImportFile ||
                importPreviewTables.length === 0
              }
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isImporting ? "Importing..." : "Import Excel"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-500">
            {selectedImportFile
              ? `Selected file: ${selectedImportFile.name}`
              : "No file selected."}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold text-slate-900">Import preview</p>
            {isParsingImportFile && (
              <p className="text-xs text-slate-500">Reading workbook...</p>
            )}
          </div>

          {!isParsingImportFile && importPreviewTables.length === 0 && (
            <p className="text-sm text-slate-500">
              Choose a file to preview tables and columns.
            </p>
          )}

          <div className="space-y-3 max-h-64 overflow-auto custom-scrollbar pr-1">
            {importPreviewTables.map((table) => (
              <div key={table.tableName} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-base font-semibold text-slate-900 break-all">
                  {table.tableName}
                </p>
                {table.columns.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {table.columns.map((column) => (
                      <span
                        key={`${table.tableName}-${column}`}
                        className="rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600 border border-slate-200"
                      >
                        {column}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2">No columns detected.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Export To Excel</h3>
            <p className="text-sm text-slate-500 mt-1">
              Review available tables and columns, then export your Excel file.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting || isLoadingTables}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm h-[calc(100vh-220px)] flex flex-col">
        <div className="mb-4">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Search table
          </label>
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="For example: employees"
            className="mt-1 w-full rounded-lg border border-border-light px-3 py-2 text-sm text-slate-700 focus:border-primary focus:outline-none"
          />
        </div>

          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-semibold text-slate-900">Exportable tables</h4>
            <button
              onClick={() => refetch()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Reload tables
            </button>
          </div>

          {isLoadingTables && (
            <p className="text-sm text-slate-500">Loading table list...</p>
          )}

          {isLoadTablesError && (
            <p className="text-sm text-red-500">
              Failed to load table list: {tablesError?.message}
            </p>
          )}

          {!isLoadingTables && !isLoadTablesError && filteredTables.length === 0 && (
            <p className="text-sm text-slate-500">No matching tables found.</p>
          )}

          <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-1">
            {filteredTables.map((table) => {
              return (
                <div
                  key={table.key}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-900 break-all">{table.label ?? table.key}</p>
                    <p className="text-sm text-slate-500 break-all">{table.key}</p>
                    {table.description && (
                      <p className="text-xs text-slate-500 mt-1">{table.description}</p>
                    )}
                    {table.columns.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {table.columns.map((column) => (
                          <span
                            key={`${table.key}-${column}`}
                            className="rounded bg-white px-2 py-1 text-[11px] text-slate-600 border border-slate-200"
                          >
                            {column}
                          </span>
                        ))}
                      </div>
                    )}
                    {table.columns.length === 0 && (
                      <p className="text-xs text-slate-500 mt-2">No column metadata available.</p>
                    )}
                    </div>
                </div>
              );
            })}
          </div>
      </div>
      </div>

      {isImportConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-confirm-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-pink-200 bg-white shadow-2xl">
            <div className="relative bg-gradient-to-r from-pink-100 via-sky-100 to-yellow-100 p-5 overflow-hidden rounded-t-2xl">
              <div className="relative flex items-start gap-3">
                <div
                  className="mt-1 h-[72px] w-[100px] shrink-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <div
                        className="NyanCat NyanSize"
                        style={{ position: "absolute", top: "-8px", left: "-28px" }}
                    />
                </div>
                <div className="min-w-0">
                  <h4
                    id="import-confirm-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Import Alert
                  </h4>
                  <p className="mt-1 text-sm text-slate-700">
                    This action will delete all current data and import new data
                    from the selected Excel file.
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Please export your current data first if needed.
                  </p>
                </div>
              </div>
              <div className="relative mt-4 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-pink-400 via-yellow-400 to-sky-400" />
              </div>
            </div>

            <div className="p-5">
              <div className="mt-1 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportConfirmOpen(false)}
                disabled={isImporting}
                className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                No
              </button>
              <button
                type="button"
                onClick={executeImport}
                disabled={isImporting}
                className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? "Importing..." : "Yes, Import"}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportExcel;
