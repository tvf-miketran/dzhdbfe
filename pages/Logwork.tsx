import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useAdminLogworks,
  useUserLogworks,
  useEmployees,
  useSaveLogworks,
} from "../hooks";
import { ConfirmActionModal } from "../components/modal/confirm";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface EmployeeBasic {
  id: string;
  enFullName: string;
}

const Logwork: React.FC = () => {
  const { user } = useAuth();
  const roleFromStorage = (() => {
    const raw = localStorage.getItem("user");
    if (!raw) return "";

    try {
      const parsed = JSON.parse(raw);
      return String(parsed?.authorize_role || parsed?.authorizeRole || "");
    } catch {
      return "";
    }
  })();

  const currentRole = String(
    (user as any)?.authorize_role ||
      (user as any)?.authorizeRole ||
      roleFromStorage,
  ).toUpperCase();
  const isMember = currentRole !== "ADMIN";

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [searchName, setSearchName] = useState<string>("");

  // ─── Changed-cells tracking ──────────────────────────────────────────────────
  // Key: "<employeeUUID>|<monthNumber>" (month is 1-based), value: hours as number
  const [changedCells, setChangedCells] = useState<Map<string, number>>(
    new Map(),
  );
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // ─── Save mutation ───────────────────────────────────────────────────────────
  const { mutate: saveLogworks, isPending: isSaving } = useSaveLogworks();

  // ─── Fetch all employees (admin needs to show all) ───────────────────────────
  const { data: employeesResponse } = useEmployees(
    { per_page: 1000 },
    { enabled: !isMember }, // Only admins need the full employee list
  );

  const allEmployees = useMemo<EmployeeBasic[]>(() => {
    const data = employeesResponse?.data;
    if (!data) return [];

    // Fallback logic in case the API returns an array directly vs paginated object
    const items = Array.isArray(data) ? data : (data as any).items;
    if (!items || !Array.isArray(items)) return [];

    return items.map((e: any) => ({
      id: e.id,
      enFullName: e.enFullName,
    }));
  }, [employeesResponse]);

  // ─── Fetch logworks ──────────────────────────────────────────────────────────
  const selectedMonthsParam =
    selectedMonths.length > 0
      ? selectedMonths.slice().sort((a, b) => a - b).join(",")
      : undefined;

  const adminFilters = {
    month: selectedMonthsParam,
    year: selectedYear,
    userName: searchName,
    quarter: selectedQuarter,
    sortBy: "desc" as const,
  };

  const memberFilters = {
    month: selectedMonthsParam,
    year: selectedYear,
    quarter: selectedQuarter,
    sortBy: "desc" as const,
  };

  const {
    data: adminLogworksResponse,
    isLoading: adminLoading,
    error: adminError,
  } = useAdminLogworks(isMember ? undefined : adminFilters);

  const {
    data: memberLogworksResponse,
    isLoading: memberLoading,
    error: memberError,
  } = useUserLogworks(isMember ? memberFilters : undefined);

  const logworksResponse = isMember
    ? memberLogworksResponse
    : adminLogworksResponse;
  const isLoading = isMember ? memberLoading : adminLoading;
  const error = isMember ? memberError : adminError;

  // ─── Build table data ────────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    // Map from employee UUID → { id, name, hours[12] }
    const employeeMap = new Map<
      string,
      {
        id: string;
        name: string;
        initials: string;
        hours: number[];
        color: string;
      }
    >();

    // For admins: pre-populate with all employees (so they always appear even with no data)
    if (!isMember && allEmployees.length > 0 && !searchName) {
      allEmployees.forEach((emp) => {
        employeeMap.set(emp.id, {
          id: emp.id,
          name: emp.enFullName,
          initials: getInitials(emp.enFullName),
          hours: new Array(12).fill(0),
          color: getRandomColor(emp.id),
        });
      });
    }

    // Add / merge logworks data
    if (logworksResponse?.data) {
      logworksResponse.data.forEach((logwork) => {
        const monthIndex = parseInt(logwork.month, 10) - 1;
        const key = logwork.employeeId; // This is the UUID returned from logworks API

        if (!employeeMap.has(key)) {
          // For members (or if UUID not in employee list)
          employeeMap.set(key, {
            id: key,
            name: logwork.engName,
            initials: getInitials(logwork.engName),
            hours: new Array(12).fill(0),
            color: getRandomColor(key),
          });
        }

        const employee = employeeMap.get(key)!;
        if (monthIndex >= 0 && monthIndex < 12) {
          employee.hours[monthIndex] += logwork.logHours;
        }
      });
    }

    return Array.from(employeeMap.values());
  }, [logworksResponse, allEmployees, isMember]);

  // ─── Monthly totals ──────────────────────────────────────────────────────────
  const monthlyTotals = useMemo(() => {
    const totals = new Array(12).fill(0);
    tableData.forEach((emp) => {
      emp.hours.forEach((h, i) => {
        totals[i] += h;
      });
    });
    return totals;
  }, [tableData]);

  // ─── Displayed month columns ─────────────────────────────────────────────────
  const displayedMonths = useMemo(() => {
    if (selectedMonths.length > 0) {
      return selectedMonths
        .slice()
        .sort((a, b) => a - b)
        .map((m) => ({ index: m - 1, name: MONTHS[m - 1] }));
    }
    return MONTHS.map((name, index) => ({ index, name }));
  }, [selectedMonths]);

  const isSingleMonthView = selectedMonths.length === 1;

  // ─── Quarter filter helpers ───────────────────────────────────────────────────
  const getQuarterMonths = (quarter: string): number[] => {
    switch (quarter) {
      case "Q1":
        return [1, 2, 3];
      case "Q2":
        return [4, 5, 6];
      case "Q3":
        return [7, 8, 9];
      case "Q4":
        return [10, 11, 12];
      default:
        return [];
    }
  };

  const handleQuarterChange = (quarter: string) => {
    if (quarter === "") {
      setSelectedQuarter("");
      setSelectedMonths([]);
    } else {
      setSelectedQuarter(quarter);
      setSelectedMonths(getQuarterMonths(quarter));
    }
    setChangedCells(new Map());
  };

  // ─── Month filter helpers ─────────────────────────────────────────────────────
  const toggleMonth = (month: number) => {
    setSelectedQuarter(""); // Clear quarter selection when manually selecting months
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
    // Clear changed cells when filter changes to avoid stale references
    setChangedCells(new Map());
  };

  const removeMonthTag = (month: number) => {
    setSelectedMonths((prev) => prev.filter((m) => m !== month));
    setChangedCells(new Map());
  };

  // ─── Cell edit tracking ──────────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (employeeId: string, monthNumber: number, value: string) => {
      const hours = parseFloat(value);
      const key = `${employeeId}|${monthNumber}`;
      setChangedCells((prev) => {
        const next = new Map(prev);
        if (value === "" || isNaN(hours)) {
          // Treat empty / invalid as 0
          next.set(key, 0);
        } else {
          next.set(key, hours);
        }
        return next;
      });
    },
    [],
  );

  // ─── Save Changes ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (changedCells.size === 0) return;

    const logworks = Array.from(changedCells.entries()).map(
      ([key, logHours]) => {
        const [employeeId, monthStr] = key.split("|");
        return {
          userId: employeeId,
          year: selectedYear,
          month: monthStr,
          logHour: logHours.toString(),
        };
      },
    );

    saveLogworks(
      { logworks },
      {
        onSuccess: () => setChangedCells(new Map()),
      },
    );
  };

  const handleOpenSaveConfirm = () => {
    if (!hasChanges || isSaving) return;
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    setIsSaveConfirmOpen(false);
    handleSave();
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRandomColor(id: string): string {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur, cur - 1, cur - 2];
  }, []);

  const hasChanges = changedCells.size > 0;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light animate-in fade-in duration-500">
      {/* Filter bar */}
      <div className="shrink-0 p-4 md:p-6 lg:p-8 flex flex-col gap-3 border-b border-border-light bg-slate-50">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 md:gap-6">
          {/* Search (admin only) */}
          {!isMember && (
            <div className="flex-1 min-w-0 lg:w-80">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Search by Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchName(e.target.value)
                  }
                  placeholder="Enter employee name..."
                  className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  search
                </span>
              </div>
            </div>
          )}

          {/* Year */}
          <div className="flex-1 min-w-0 lg:w-40">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedYear(Number(e.target.value));
                  setChangedCells(new Map());
                }}
                className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {yearOptions.map((year: number) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                calendar_today
              </span>
            </div>
          </div>

          {/* Quarter */}
          <div className="flex-1 min-w-0 lg:w-40">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Quarter
            </label>
            <div className="relative">
              <select
                value={selectedQuarter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleQuarterChange(e.target.value)
                }
                className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">All Quarters</option>
                <option value="Q1">Q1 (Jan-Mar)</option>
                <option value="Q2">Q2 (Apr-Jun)</option>
                <option value="Q3">Q3 (Jul-Sep)</option>
                <option value="Q4">Q4 (Oct-Dec)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                date_range
              </span>
            </div>
          </div>

          {/* Month multi-select */}
          <div className="flex-1 min-w-0 lg:w-52">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Month
            </label>
            <div className="relative">
              <select
                value=""
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const val = Number(e.target.value);
                  if (val) toggleMonth(val);
                  // Reset select back to placeholder
                  e.target.value = "";
                }}
                className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">
                  {selectedMonths.length === 0 ? "All Months" : "Add month..."}
                </option>
                {MONTHS.map((month: string, index: number) => (
                  <option
                    key={month}
                    value={index + 1}
                    disabled={selectedMonths.includes(index + 1)}
                  >
                    {month} {selectedMonths.includes(index + 1) ? "✓" : ""}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full lg:w-auto lg:ml-auto lg:pb-2">
            {!isMember && (
              <button
                onClick={handleOpenSaveConfirm}
                disabled={!hasChanges || isSaving}
                className={`flex items-center justify-center gap-2 h-10 px-5 rounded-lg font-semibold text-xs transition-all shadow-xl ${
                  hasChanges && !isSaving
                    ? "bg-primary hover:bg-emerald-600 text-white shadow-primary/20 cursor-pointer"
                    : "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                )}
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : "Save Changes"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Selected month tags */}
        {selectedMonths.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {selectedMonths
              .slice()
              .sort((a, b) => a - b)
              .map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
                >
                  {MONTHS[m - 1]}
                  <button
                    onClick={() => removeMonthTag(m)}
                    className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
                    aria-label={`Remove ${MONTHS[m - 1]}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      close
                    </span>
                  </button>
                </span>
              ))}
            {selectedMonths.length > 1 && (
              <button
                onClick={() => {
                  setSelectedQuarter("");
                  setSelectedMonths([]);
                  setChangedCells(new Map());
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-3 md:p-4 lg:p-6 custom-scrollbar">
        <div className="rounded-lg md:rounded-xl border border-border-light bg-surface-light shadow-lg overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[700px] lg:min-w-0">
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr className="border-b border-border-light">
                  <th
                    className={`sticky left-0 z-30 bg-slate-50 px-3 md:px-6 py-3 md:py-5 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light ${isSingleMonthView ? "w-[200px] md:w-[260px] min-w-[200px] md:min-w-[260px]" : "min-w-[200px] md:min-w-[260px]"}`}
                  >
                    User Name
                  </th>
                  {displayedMonths.map((m) => (
                    <th
                      key={m.name}
                      className={`px-1 md:px-2 py-3 md:py-5 text-center text-[9px] md:text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light ${isSingleMonthView ? "w-full min-w-[200px] md:min-w-[300px]" : "min-w-[70px] md:min-w-[100px]"}`}
                    >
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={displayedMonths.length + 1}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      <span className="material-symbols-outlined animate-spin text-2xl">
                        progress_activity
                      </span>
                      <p className="mt-2 text-sm">Loading logworks...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={displayedMonths.length + 1}
                      className="px-6 py-8 text-center text-red-500"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        error
                      </span>
                      <p className="mt-2 text-sm">
                        Failed to load logworks data
                      </p>
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={displayedMonths.length + 1}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      <span className="material-symbols-outlined text-2xl">
                        inbox
                      </span>
                      <p className="mt-2 text-sm">No data found</p>
                    </td>
                  </tr>
                ) : (
                  <>
                    {tableData.map((emp) => (
                      <tr
                        key={emp.id}
                        className="group hover:bg-slate-50 transition-colors"
                      >
                        <td
                          className={`sticky left-0 z-10 bg-surface-light group-hover:bg-slate-100 transition-colors px-3 md:px-6 py-3 md:py-4 border-r border-border-light text-left ${isSingleMonthView ? "w-[200px] md:w-[260px]" : ""}`}
                        >
                          <div className="flex items-center gap-2 md:gap-4">
                            <div
                              className={`h-8 md:h-10 w-8 md:w-10 rounded-full ${emp.color}/10 flex items-center justify-center font-semibold text-[10px] md:text-xs ${emp.color.replace("bg-", "text-")}`}
                            >
                              {emp.initials}
                            </div>
                            <span className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                              {emp.name}
                            </span>
                          </div>
                        </td>
                        {displayedMonths.map((m) => {
                          const cellKey = `${emp.id}|${m.index + 1}`;
                          const changedValue = changedCells.get(cellKey);
                          const displayValue =
                            changedValue !== undefined
                              ? changedValue === 0
                                ? ""
                                : String(changedValue)
                              : emp.hours[m.index] === 0
                                ? ""
                                : String(emp.hours[m.index]);

                          return (
                            <td
                              key={m.name}
                              className={`p-0.5 md:p-1 border-r border-border-light group-hover:bg-slate-100/50 transition-colors ${changedCells.has(cellKey) ? "bg-amber-50" : ""} ${isSingleMonthView ? "text-center" : ""}`}
                            >
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                defaultValue={displayValue}
                                key={`${emp.id}-${m.index}-${selectedYear}`}
                                placeholder="-"
                                disabled={isMember}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                  handleCellChange(
                                    emp.id,
                                    m.index + 1,
                                    e.target.value,
                                  )
                                }
                                className={`w-full h-8 md:h-10 bg-transparent border-0 text-center text-[10px] md:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-primary rounded transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isMember
                                    ? "cursor-not-allowed opacity-60"
                                    : "hover:ring-2 hover:ring-primary/30"
                                } ${changedCells.has(cellKey) ? "ring-2 ring-amber-400" : ""}`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Summary Row */}
                    <tr className="bg-slate-100 font-semibold border-t-2 border-slate-300">
                      <td className="sticky left-0 z-10 bg-slate-100 px-3 md:px-6 py-3 md:py-4 border-r border-border-light text-center text-xs md:text-sm text-slate-900">
                        Total
                      </td>
                      {displayedMonths.map((m) => (
                        <td
                          key={m.name}
                          className={`px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 border-r border-border-light ${isSingleMonthView ? "text-center" : ""}`}
                        >
                          {monthlyTotals[m.index] > 0
                            ? monthlyTotals[m.index].toLocaleString()
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        isOpen={isSaveConfirmOpen}
        title="Confirm Save Changes"
        message="Are you sure you want to save logwork changes?"
        icon="save"
        confirmText="Save"
        cancelText="Cancel"
        isPending={isSaving}
        onCancel={() => {
          if (isSaving) return;
          setIsSaveConfirmOpen(false);
        }}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
};

export default Logwork;
