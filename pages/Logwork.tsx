import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useAdminLogworks,
  useUserLogworks,
  useMembersProjects,
  useMeProjects,
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

interface LogworkCellData {
  hours: number;
  status: 0 | 1 | null;
}

interface ProjectRowData {
  projectId: string;
  projectName: string;
  allocationPercent: number;
  cells: LogworkCellData[];
}

interface EmployeeRowData {
  id: string;
  name: string;
  initials: string;
  color: string;
  totalCells: LogworkCellData[];
  projects: ProjectRowData[];
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
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set(),
  );

  // ─── Changed-cells tracking ──────────────────────────────────────────────────
  // Key: "<employeeUUID>|<projectId>|<monthNumber>", value: hours as number
  const [changedCells, setChangedCells] = useState<Map<string, number>>(
    new Map(),
  );
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);

  // ─── Save mutation ───────────────────────────────────────────────────────────
  const { mutate: saveLogworks, isPending: isSaving } = useSaveLogworks();

  const {
    data: membersProjectsResponse,
    isLoading: membersProjectsLoading,
    error: membersProjectsError,
  } = useMembersProjects({
    enabled: !isMember,
  });

  const {
    data: meProjectsResponse,
    isLoading: meProjectsLoading,
    error: meProjectsError,
  } = useMeProjects({
    enabled: isMember,
  });

  const memberProjects = useMemo(() => {
    if (isMember) {
      return meProjectsResponse?.data ? [meProjectsResponse.data] : [];
    }
    return membersProjectsResponse?.data ?? [];
  }, [isMember, meProjectsResponse, membersProjectsResponse]);

  const memberProjectLookup = useMemo(() => {
    const byEmployee = new Map<string, Map<string, number>>();

    memberProjects.forEach((member) => {
      const projectMap = new Map<string, number>();
      member.projects.forEach((project) => {
        projectMap.set(project.projectId, project.allocationPercent);
      });
      byEmployee.set(member.id, projectMap);
    });

    return byEmployee;
  }, [memberProjects]);

  const membersByEmployeeId = useMemo(() => {
    const byId = new Map<string, EmployeeBasic>();
    memberProjects.forEach((member) => {
      byId.set(member.id, {
        id: member.id,
        enFullName: member.enFullName,
      });
    });
    return byId;
  }, [memberProjects]);

  const toggleExpand = useCallback((employeeId: string) => {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  }, []);

  // ─── Fetch logworks ──────────────────────────────────────────────────────────
  const selectedMonthsParam =
    selectedMonths.length > 0
      ? selectedMonths.slice().sort((a, b) => a - b).join(",")
      : undefined;

  const adminFilters = {
    month: selectedMonthsParam,
    year: selectedYear,
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

  const logworkGroups = useMemo(() => {
    const payload = logworksResponse?.data;
    if (!payload) return [];
    return Array.isArray(payload) ? payload : [payload];
  }, [logworksResponse]);

  const isLoading = isMember
    ? memberLoading || meProjectsLoading
    : adminLoading || membersProjectsLoading;

  const error = isMember
    ? memberError || meProjectsError
    : adminError || membersProjectsError;

  const standardLogworkByMonth = useMemo(() => {
    const standardByMonth: Record<string, number> = {};

    logworkGroups.forEach((group) => {
      group.total.forEach((item) => {
        const key = String(item.month).padStart(2, "0");
        if (standardByMonth[key] === undefined) {
          standardByMonth[key] = item.standardLogworkInMonth;
        }
      });

      group.data.forEach((item) => {
        const key = String(item.month).padStart(2, "0");
        if (standardByMonth[key] === undefined) {
          standardByMonth[key] = item.standardLogworkInMonth;
        }
      });
    });

    return standardByMonth;
  }, [logworkGroups]);

  // ─── Build table data ────────────────────────────────────────────────────────
  const tableData = useMemo(() => {
    const createEmptyCells = (): LogworkCellData[] =>
      Array.from({ length: 12 }, () => ({ hours: 0, status: null }));

    const employeeMap = new Map<string, EmployeeRowData>();

    const ensureEmployee = (
      employeeId: string,
      employeeName: string,
    ): EmployeeRowData => {
      const existing = employeeMap.get(employeeId);
      if (existing) return existing;

      const next: EmployeeRowData = {
        id: employeeId,
        name: employeeName,
        initials: getInitials(employeeName),
        totalCells: createEmptyCells(),
        projects: [],
        color: getRandomColor(employeeId),
      };

      employeeMap.set(employeeId, next);
      return next;
    };

    const ensureProject = (
      employee: EmployeeRowData,
      projectId: string,
      projectName: string,
      allocationPercent: number,
    ): ProjectRowData => {
      const existing = employee.projects.find((p) => p.projectId === projectId);
      if (existing) return existing;

      const next: ProjectRowData = {
        projectId,
        projectName,
        allocationPercent,
        cells: createEmptyCells(),
      };

      employee.projects.push(next);
      return next;
    };

    memberProjects.forEach((member) => {
      const employee = ensureEmployee(member.id, member.enFullName);
      member.projects.forEach((project) => {
        ensureProject(
          employee,
          project.projectId,
          project.projectName,
          project.allocationPercent,
        );
      });
    });

    logworkGroups.forEach((group) => {
      const memberProfile = membersByEmployeeId.get(group.employeeId);
      const employee = ensureEmployee(
        group.employeeId,
        memberProfile?.enFullName ?? group.engName,
      );

      group.total.forEach((total) => {
        const monthIndex = parseInt(total.month, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          employee.totalCells[monthIndex].hours = total.totalLoghour;
          employee.totalCells[monthIndex].status = total.status;
        }
      });

      group.data.forEach((logwork) => {
        const monthIndex = parseInt(logwork.month, 10) - 1;
        if (monthIndex < 0 || monthIndex > 11) return;

        if (!Array.isArray(logwork.projects) || logwork.projects.length === 0) {
          return;
        }

        const totalEE =
          logwork.totalEEPercent > 0
            ? logwork.totalEEPercent
            : logwork.projects.reduce(
                (sum, project) => sum + (project.EEPercent ?? 0),
                0,
              );
        const isPerProjectRow = logwork.projects.length === 1;

        logwork.projects.forEach((project) => {
          const allocationPercent =
            project.EEPercent ??
            memberProjectLookup.get(group.employeeId)?.get(project.projectId) ??
            0;

          const projectRow = ensureProject(
            employee,
            project.projectId,
            project.projectName,
            allocationPercent,
          );

          const distributedHours = isPerProjectRow
            ? logwork.logHours
            : totalEE > 0
              ? (logwork.logHours * allocationPercent) / totalEE
              : logwork.logHours;

          projectRow.cells[monthIndex].hours += distributedHours;
          projectRow.cells[monthIndex].status = logwork.status;
        });
      });

      if (group.total.length === 0) {
        employee.projects.forEach((project) => {
          project.cells.forEach((cell, monthIndex) => {
            employee.totalCells[monthIndex].hours += cell.hours;
            if (cell.status !== null) {
              employee.totalCells[monthIndex].status = cell.status;
            }
          });
        });
      }
    });

    return Array.from(employeeMap.values())
      .filter((employee) => {
        if (!searchName.trim()) return true;
        return employee.name.toLowerCase().includes(searchName.toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    logworkGroups,
    memberProjectLookup,
    memberProjects,
    membersByEmployeeId,
    searchName,
  ]);

  // ─── Monthly totals ──────────────────────────────────────────────────────────
  const monthlyTotals = useMemo(() => {
    const totals = new Array(12).fill(0);
    tableData.forEach((emp) => {
      emp.totalCells.forEach((cell, i) => {
        totals[i] += cell.hours;
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
    setSelectedQuarter("");
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
    setChangedCells(new Map());
  };

  const removeMonthTag = (month: number) => {
    setSelectedMonths((prev) => prev.filter((m) => m !== month));
    setChangedCells(new Map());
  };

  // ─── Cell edit tracking ──────────────────────────────────────────────────────
  const handleCellChange = useCallback(
    (
      employeeId: string,
      projectId: string,
      monthNumber: number,
      value: string,
    ) => {
      const hours = parseFloat(value);
      const key = `${employeeId}|${projectId}|${monthNumber}`;

      setChangedCells((prev) => {
        const next = new Map(prev);
        if (value === "") {
          next.set(key, 0);
          return next;
        }

        if (Number.isNaN(hours) || hours < 0) {
          next.delete(key);
          return next;
        }

        next.set(key, hours);
        return next;
      });
    },
    [],
  );

  // ─── Save Changes ─────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (changedCells.size === 0) return;

    const logworks = Array.from(
      changedCells.entries() as Iterable<[string, number]>,
    )
      .map(([cellKey, logHour]: [string, number]) => {
        const [employeeId, projectId, monthStr] = cellKey.split("|");
        const monthNumber = parseInt(monthStr, 10);
        if (!employeeId || !projectId || monthNumber < 1 || monthNumber > 12) {
          return null;
        }
        return {
          userId: employeeId,
          projectId,
          year: selectedYear,
          month: monthStr,
          logHour: logHour.toString(),
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    if (logworks.length === 0) return;

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

  function formatHours(value: number): string {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  function getMonthKey(monthIndex: number): string {
    return String(monthIndex + 1).padStart(2, "0");
  }

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return [cur, cur - 1, cur - 2];
  }, []);

  const hasChanges = changedCells.size > 0;

  const getStatusClasses = (status: 0 | 1 | null): string => {
    if (status === 1) return "bg-emerald-50 text-emerald-700";
    if (status === 0) return "bg-rose-50 text-rose-700";
    return "";
  };

  const getProjectCellDisplayValue = (
    employeeId: string,
    projectId: string,
    monthNumber: number,
    fallback: number,
  ): string => {
    const key = `${employeeId}|${projectId}|${monthNumber}`;
    const changedValue = changedCells.get(key);
    if (changedValue !== undefined) {
      return String(changedValue);
    }
    return fallback > 0 ? String(fallback) : "";
  };

  const getEmployeeTotalEE = (employee: EmployeeRowData): number => {
    return employee.projects.reduce(
      (sum, project) => sum + project.allocationPercent,
      0,
    );
  };

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
            <table className="w-full table-fixed border-collapse min-w-[700px] lg:min-w-0">
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr className="border-b border-border-light">
                  <th
                    className="sticky left-0 z-30 bg-slate-50 px-3 md:px-6 py-3 md:py-5 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light w-[30%] min-w-[30%] max-w-[30%]"
                  >
                    User Name
                  </th>
                  {displayedMonths.map((m) => (
                    <th
                      key={m.name}
                      className={`px-1 md:px-2 py-3 md:py-5 text-center text-[9px] md:text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light ${isSingleMonthView ? "w-full min-w-[200px] md:min-w-[300px]" : "min-w-[70px] md:min-w-[100px]"}`}
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span>{m.name}</span>
                        <span className="mt-1 text-[10px] md:text-xs font-medium normal-case tracking-normal text-slate-500">
                          {standardLogworkByMonth[getMonthKey(m.index)] !==
                          undefined
                            ? formatHours(
                                standardLogworkByMonth[getMonthKey(m.index)],
                              )
                            : "-"}
                        </span>
                      </div>
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
                      <React.Fragment key={emp.id}>
                        <tr className="group hover:bg-slate-50 transition-colors">
                          <td
                            className="sticky left-0 z-10 bg-surface-light group-hover:bg-slate-100 transition-colors px-3 md:px-6 py-3 md:py-4 border-r border-border-light text-left w-[30%] min-w-[30%] max-w-[30%]"
                          >
                            <div className="flex items-center justify-between gap-2 md:gap-4">
                              <div className="min-w-0 flex items-center gap-2 md:gap-4">
                                <div
                                  className={`h-8 md:h-10 w-8 md:w-10 rounded-full ${emp.color}/10 flex items-center justify-center font-semibold text-[10px] md:text-xs ${emp.color.replace("bg-", "text-")}`}
                                >
                                  {emp.initials}
                                </div>
                                <span className="text-xs md:text-sm font-semibold text-slate-900 truncate">
                                  {emp.name}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 text-left">
                                  EE {formatHours(getEmployeeTotalEE(emp))}%
                                </span>
                                <button
                                  type="button"
                                  className="h-7 w-7 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
                                  onClick={() => toggleExpand(emp.id)}
                                  aria-label={
                                    expandedEmployees.has(emp.id)
                                      ? `Collapse ${emp.name}`
                                      : `Expand ${emp.name}`
                                  }
                                >
                                  <span className="material-symbols-outlined text-[18px] leading-none">
                                    {expandedEmployees.has(emp.id)
                                      ? "keyboard_arrow_up"
                                      : "keyboard_arrow_down"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </td>
                          {displayedMonths.map((m) => {
                            const currentCell = emp.totalCells[m.index];
                            const statusClasses = getStatusClasses(
                              currentCell.status,
                            );

                            return (
                              <td
                                key={m.name}
                                className={`px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-sm font-semibold border-r border-border-light transition-colors ${statusClasses} ${isSingleMonthView ? "text-center" : ""}`}
                              >
                                {currentCell.hours > 0
                                  ? formatHours(currentCell.hours)
                                  : "-"}
                              </td>
                            );
                          })}
                        </tr>

                        {expandedEmployees.has(emp.id) &&
                          emp.projects.map((project) => (
                            <tr
                              key={`${emp.id}-${project.projectId}`}
                              className="bg-slate-50/60"
                            >
                              <td
                                className="sticky left-0 z-10 bg-slate-50 px-3 md:px-6 py-2.5 md:py-3 border-r border-border-light text-left w-[30%] min-w-[30%] max-w-[30%]"
                              >
                                <div className="pl-10 md:pl-14 flex items-center justify-between gap-2">
                                  <span className="text-[11px] md:text-xs font-semibold text-slate-700 truncate">
                                    {project.projectName}
                                  </span>
                                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 shrink-0">
                                    EE {formatHours(project.allocationPercent)}%
                                  </span>
                                </div>
                              </td>
                              {displayedMonths.map((m) => {
                                const monthNumber = m.index + 1;
                                const cellKey = `${emp.id}|${project.projectId}|${monthNumber}`;
                                const currentCell = project.cells[m.index];

                                return (
                                  <td
                                    key={`${project.projectId}-${m.name}`}
                                    className={`p-0.5 md:p-1 border-r border-border-light transition-colors ${isSingleMonthView ? "text-center" : ""}`}
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={getProjectCellDisplayValue(
                                        emp.id,
                                        project.projectId,
                                        monthNumber,
                                        currentCell.hours,
                                      )}
                                      placeholder="-"
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                      ) =>
                                        handleCellChange(
                                          emp.id,
                                          project.projectId,
                                          monthNumber,
                                          e.target.value,
                                        )
                                      }
                                      className={`w-full h-8 md:h-10 bg-transparent border-0 text-center text-[10px] md:text-sm font-semibold focus:ring-2 focus:ring-primary rounded transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:ring-2 hover:ring-primary/30 text-slate-900 ${changedCells.has(cellKey) ? "ring-2 ring-amber-400" : ""}`}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
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
                            ? formatHours(monthlyTotals[m.index])
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
