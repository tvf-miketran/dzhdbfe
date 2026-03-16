import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import axiosInstance from "../helpers/axios";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import type { MultiSelectOption } from "../components/MultiSelectDropdown";

interface KPIData {
  standardKPI: number;
  currentKPI: number;
  totalBillable?: number;
  lastCalculated?: string;
  breakdown?: {
    tickets: number;
    logwork: number;
    quality: number;
  };
}

interface TrendData {
  date: string;
  odc: number;
}

interface TeamData {
  role: string;
  count: number;
  kpi: number;
}

interface ContributionRow {
  name: string;
  avatar: string;
  weight: string;
  weeks: [number, number][];
  ticket: number;
  logwork: number;
  member: number;
  billable: number;
  ee: string;
  status: string;
}

interface AggregateKPIData {
  total_billable_point?: number;
  total_ticket_point?: number;
  total_logwork_point?: number;
  average_billable_point?: number;
}

const DEFAULT_KPI: KPIData = {
  standardKPI: 8.5,
  currentKPI: 0,
  totalBillable: 0,
  lastCalculated: "Loading...",
  breakdown: {
    tickets: 0,
    logwork: 0,
    quality: 0,
  },
};

// Empty default - no mock data to avoid confusion
const DEFAULT_CONTRIBUTION_ROWS: ContributionRow[] = [];

const CONTRIBUTION_PAGE_SIZE = 20;

const getCurrentMonth = (): string =>
  String(new Date().getMonth() + 1).padStart(2, "0");
const buildRecentMonthOptions = (
  monthsBeforeCurrent = 5,
): MultiSelectOption[] => {
  const currentMonthNumber = new Date().getMonth() + 1;

  return Array.from({ length: monthsBeforeCurrent + 1 }, (_, index) => {
    const monthNumber =
      ((currentMonthNumber - monthsBeforeCurrent + index - 1 + 12 * 10) % 12) +
      1;
    const monthValue = String(monthNumber).padStart(2, "0");

    return {
      value: monthValue,
      label: monthValue,
    };
  });
};

const monthOptions: MultiSelectOption[] = buildRecentMonthOptions();

const toNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeMonthValue = (value: unknown): string | null => {
  const monthNumber = Number(value);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }
  return String(monthNumber).padStart(2, "0");
};

const buildMonthRequestCandidates = (months: string[]): string[] => {
  const withLeadingZero = months.join(",");
  const asNumbers = months
    .map((month) => String(parseInt(month, 10)))
    .join(",");

  return Array.from(new Set([withLeadingZero, asNumbers])).filter(Boolean);
};

const extractRowsFromResponse = (root: any): any[] => {
  const sources = [
    root?.data?.results,
    root?.results,
    root?.data,
    root?.data?.data,
    root?.data?.items,
    root?.result,
    root?.payload,
    root,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.filter(Boolean);
    }
  }

  return [];
};

const isKpiCandidatePayload = (value: any): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const hasKpiValue = [
    value.standardKPI,
    value.standard_kpi,
    value.currentKPI,
    value.current_kpi,
    value.kpi,
  ].some((item) => item !== undefined && item !== null);

  const breakdown = value.breakdown ?? value.kpiBreakdown;
  const hasBreakdown =
    breakdown && typeof breakdown === "object" && !Array.isArray(breakdown);

  return Boolean(hasKpiValue || hasBreakdown);
};

const extractCandidateFromResponse = (root: any) => {
  const sources = [
    root?.data?.kpi,
    root?.data,
    root?.result,
    root?.payload,
    root,
  ];

  for (const source of sources) {
    if (isKpiCandidatePayload(source)) {
      return source;
    }
  }

  return null;
};

const extractAggregateDataFromResponse = (root: any): AggregateKPIData => {
  const data = root?.data ?? root;
  return {
    total_billable_point: toNumber(data?.total_billable_point, undefined),
    total_ticket_point: toNumber(data?.total_ticket_point, undefined),
    total_logwork_point: toNumber(data?.total_logwork_point, undefined),
    average_billable_point: toNumber(data?.average_billable_point, undefined),
  };
};

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getRoleColumnIndex = (roleValue: unknown): number => {
  const normalizedRole = String(roleValue ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, "");

  if (normalizedRole === "BA") return 0;
  if (normalizedRole === "QAINTERNAL" || normalizedRole === "IQA") return 1;
  if (normalizedRole === "QASTANDALONE" || normalizedRole === "EQA") return 2;
  if (normalizedRole === "DEV" || normalizedRole === "DEVELOPER") return 3;
  if (normalizedRole === "REVIEWER" || normalizedRole === "REVIEW") return 4;

  return -1;
};

const buildFromMemberRows = (
  rows: any[],
  selectedMonths: string[],
  aggregateData?: AggregateKPIData,
) => {
  const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (safeRows.length === 0) {
    return {
      kpi: DEFAULT_KPI,
      trend: [],
      team: [],
      contribution: [] as ContributionRow[],
    };
  }

  const totalMember = safeRows.reduce(
    (sum, row) => sum + toNumber(row.member_contr_point, 0),
    0,
  );
  const totalTicket = safeRows.reduce(
    (sum, row) => sum + toNumber(row.ticket_point, 0),
    0,
  );
  const totalLogwork = safeRows.reduce(
    (sum, row) => sum + toNumber(row.logwork_point, 0),
    0,
  );
  const count = safeRows.length;

  const totalTeamPoints = toNumber(safeRows[0]?.total_team_points, totalMember);
  const avgMember = count > 0 ? totalMember / count : 0;
  const avgTicket = count > 0 ? totalTicket / count : 0;
  const avgLogwork = count > 0 ? totalLogwork / count : 0;
  const year = safeRows[0]?.year
    ? String(safeRows[0].year)
    : new Date().getFullYear().toString();

  const contribution: ContributionRow[] = safeRows.map((row, index) => {
    const breakdown = Array.isArray(row.ticket_breakdown)
      ? row.ticket_breakdown
      : [];
    const firstWeight =
      breakdown.length > 0 ? toNumber(breakdown[0]?.role_weight, 1) : 1;
    const memberPoint = toNumber(row.member_contr_point, 0);
    const eeValue = row.member_performance?.total_ee;
    const statusValue = row.member_performance?.performance_level;

    const roleBuckets: [number, number][] = [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ];
    breakdown.forEach((item: any) => {
      const roleIndex = getRoleColumnIndex(item?.role);
      if (roleIndex < 0) return;

      roleBuckets[roleIndex] = [
        roleBuckets[roleIndex][0] +
          toNumber(item?.task_count ?? item?.taskCount ?? item?.task, 0),
        roleBuckets[roleIndex][1] +
          toNumber(item?.bug_count ?? item?.bugCount ?? item?.bug, 0),
      ];
    });

    return {
      name:
        row.employee?.en_full_name ??
        row.employee?.vn_full_name ??
        `Member ${index + 1}`,
      avatar: row.employee?.id ?? row.employee_id ?? `member-${index + 1}`,
      weight: firstWeight.toFixed(1),
      weeks: roleBuckets,
      ticket: toNumber(row.ticket_point, 0),
      logwork: toNumber(row.logwork_point, 0),
      member: memberPoint,
      billable: toNumber(row.billable_point, 0),
      ee:
        eeValue !== undefined &&
        eeValue !== null &&
        String(eeValue).trim() !== ""
          ? String(eeValue)
          : "-",
      status:
        statusValue !== undefined &&
        statusValue !== null &&
        String(statusValue).trim() !== ""
          ? String(statusValue)
          : "-",
    };
  });

  const roleMap = new Map<
    string,
    { members: Set<string>; totalMemberPoint: number }
  >();
  safeRows.forEach((row, rowIndex) => {
    const memberKey = row.employee_id ?? row.employee?.id ?? String(rowIndex);
    const memberPoint = toNumber(row.member_contr_point, 0);
    const breakdown = Array.isArray(row.ticket_breakdown)
      ? row.ticket_breakdown
      : [];
    const roles = Array.from(
      new Set(breakdown.map((item: any) => item?.role).filter(Boolean)),
    );

    roles.forEach((role) => {
      const roleKey = String(role);
      if (!roleMap.has(roleKey)) {
        roleMap.set(roleKey, {
          members: new Set<string>(),
          totalMemberPoint: 0,
        });
      }
      const roleItem = roleMap.get(roleKey)!;
      if (!roleItem.members.has(memberKey)) {
        roleItem.members.add(memberKey);
        roleItem.totalMemberPoint += memberPoint;
      }
    });
  });

  const team: TeamData[] = Array.from(roleMap.entries()).map(
    ([role, value]) => {
      const contributorCount = value.members.size;
      return {
        role,
        count: contributorCount,
        kpi:
          contributorCount > 0 ? value.totalMemberPoint / contributorCount : 0,
      };
    },
  );

  // Use aggregate data from API if available, otherwise fall back to calculated averages
  const apiTotalBillable = aggregateData?.total_billable_point;
  const apiAverageBillable = aggregateData?.average_billable_point;
  const apiTotalTicket = aggregateData?.total_ticket_point;
  const apiTotalLogwork = aggregateData?.total_logwork_point;

  const kpiCurrentValue =
    apiAverageBillable !== undefined && apiAverageBillable !== null
      ? apiAverageBillable
      : avgMember;
  const kpiTotalBillableValue =
    apiTotalBillable !== undefined && apiTotalBillable !== null
      ? apiTotalBillable
      : totalMember;
  const kpiTicketValue =
    apiTotalTicket !== undefined && apiTotalTicket !== null
      ? apiTotalTicket
      : avgTicket;
  const kpiLogworkValue =
    apiTotalLogwork !== undefined && apiTotalLogwork !== null
      ? apiTotalLogwork
      : avgLogwork;

  const kpi: KPIData = {
    standardKPI: DEFAULT_KPI.standardKPI,
    currentKPI: kpiCurrentValue,
    totalBillable: kpiTotalBillableValue,
    lastCalculated:
      selectedMonths.length === 1
        ? `${selectedMonths[0]}/${year}`
        : `${selectedMonths.length} months/${year}`,
    breakdown: {
      tickets: kpiTicketValue,
      logwork: kpiLogworkValue,
      quality: Math.max(kpiCurrentValue - kpiTicketValue - kpiLogworkValue, 0),
    },
  };

  const trend: TrendData[] = [
    {
      date:
        selectedMonths.length === 1
          ? `${selectedMonths[0]}/${year.slice(-2)}`
          : `${selectedMonths[0]}-${selectedMonths[selectedMonths.length - 1]}/${year.slice(-2)}`,
      odc: kpiCurrentValue,
    },
  ];

  return {
    kpi,
    trend,
    team: team.length > 0 ? team : [],
    contribution,
  };
};

const ODashboard: React.FC = () => {
  useAuth();
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    getCurrentMonth(),
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [odcKPI, setOdcKPI] = useState<KPIData>(DEFAULT_KPI);
  const [isKPILoading, setIsKPILoading] = useState(true);
  const [kpiTrendData, setKpiTrendData] = useState<TrendData[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(true);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [contributionRows, setContributionRows] = useState<ContributionRow[]>(
    DEFAULT_CONTRIBUTION_ROWS,
  );
  const [isContributionLoading, setIsContributionLoading] = useState(false);
  const [contributionReloadKey, setContributionReloadKey] = useState(0);
  const [visibleContributionCount, setVisibleContributionCount] = useState(
    CONTRIBUTION_PAGE_SIZE,
  );
  const latestRequestIdRef = useRef(0);

  const visibleContributionRows = useMemo(
    () => contributionRows.slice(0, visibleContributionCount),
    [contributionRows, visibleContributionCount],
  );

  const canLoadMoreContributionRows =
    visibleContributionCount < contributionRows.length;

  const handleLoadMoreContributionRows = () => {
    setVisibleContributionCount((prev) =>
      Math.min(prev + CONTRIBUTION_PAGE_SIZE, contributionRows.length),
    );
  };

  const fetchDashboardPayloadByMonths = async (months: string[]) => {
    const monthParamCandidates = buildMonthRequestCandidates(months);
    let lastError: unknown = null;

    for (const monthParam of monthParamCandidates) {
      try {
        const response = await axiosInstance.get("/formulas/calculate", {
          params: {
            month: monthParam,
          },
        });
        const root = response?.data ?? {};
        const rows = extractRowsFromResponse(root);
        const aggregateData = extractAggregateDataFromResponse(root);

        if (rows.length > 0) {
          return {
            rows,
            candidate: null,
            aggregateData,
          };
        }

        const candidate = extractCandidateFromResponse(root);
        if (candidate) {
          return {
            rows: [],
            candidate,
            aggregateData,
          };
        }
      } catch (error) {
        lastError = error;
        // Try next month format candidate instead of leaving stale UI state.
        continue;
      }
    }

    if (lastError) {
      throw lastError;
    }

    return {
      rows: [],
      candidate: null,
      aggregateData: {},
    };
  };

  const fetchDashboardByMonth = async (months: string[]) => {
    const normalizedMonths = monthOptions
      .map((option) => option.value)
      .filter((monthValue) => months.includes(monthValue));

    if (normalizedMonths.length === 0) {
      setContributionRows([]);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
      setKpiTrendData([]);
      setIsContributionLoading(false);
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    const isStaleRequest = () => requestId !== latestRequestIdRef.current;

    setIsLoading(true);
    setIsContributionLoading(true);

    try {
      const payload = await fetchDashboardPayloadByMonths(normalizedMonths);
      if (isStaleRequest()) {
        return;
      }

      if (payload.rows.length > 0) {
        const next = buildFromMemberRows(
          payload.rows,
          normalizedMonths,
          payload.aggregateData,
        );

        const monthGroupedRows = new Map<string, any[]>();
        normalizedMonths.forEach((month) => monthGroupedRows.set(month, []));

        payload.rows.forEach((row, index) => {
          const monthFromRow = normalizeMonthValue(
            row?.month ?? row?.month_no ?? row?.formula_month,
          );

          if (monthFromRow && monthGroupedRows.has(monthFromRow)) {
            monthGroupedRows.get(monthFromRow)!.push(row);
            return;
          }

          if (payload.rows.length === normalizedMonths.length) {
            const fallbackMonth = normalizedMonths[index];
            if (fallbackMonth) {
              monthGroupedRows.get(fallbackMonth)!.push(row);
            }
          }
        });

        const trendByMonth: TrendData[] = normalizedMonths
          .map((month) => {
            const monthRows = monthGroupedRows.get(month) ?? [];
            if (monthRows.length === 0) {
              return null;
            }

            const totalMemberPoint = monthRows.reduce(
              (sum, row) => sum + toNumber(row.member_contr_point, 0),
              0,
            );
            const avgMemberPoint =
              monthRows.length > 0 ? totalMemberPoint / monthRows.length : 0;
            const year = monthRows[0]?.year
              ? String(monthRows[0].year)
              : new Date().getFullYear().toString();

            return {
              date: `${month}/${year.slice(-2)}`,
              odc: avgMemberPoint,
            };
          })
          .filter(Boolean) as TrendData[];

        if (trendByMonth.length === 0) {
          const totalMemberPoint = payload.rows.reduce(
            (sum, row) => sum + toNumber(row.member_contr_point, 0),
            0,
          );
          const avgMemberPoint =
            payload.rows.length > 0
              ? totalMemberPoint / payload.rows.length
              : 0;
          const fallbackYear = payload.rows[0]?.year
            ? String(payload.rows[0].year).slice(-2)
            : String(new Date().getFullYear()).slice(-2);
          const fallbackDate =
            normalizedMonths.length === 1
              ? `${normalizedMonths[0]}/${fallbackYear}`
              : `${normalizedMonths[0]}-${normalizedMonths[normalizedMonths.length - 1]}/${fallbackYear}`;

          trendByMonth.push({
            date: fallbackDate,
            odc: avgMemberPoint,
          });
        }

        setOdcKPI(next.kpi);
        setIsKPILoading(false);
        setKpiTrendData(trendByMonth.length > 0 ? trendByMonth : next.trend);
        setIsTrendLoading(false);
        setTeamData(next.team);
        setIsTeamLoading(false);
        setContributionRows(next.contribution);
        setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
        setContributionReloadKey((prev) => prev + 1); // Trigger re-mount AFTER data is set
        return;
      }

      if (payload.candidate) {
        const candidate = payload.candidate;
        const breakdown = candidate.breakdown ?? candidate.kpiBreakdown ?? {};
        const nextKPI: KPIData = {
          standardKPI: toNumber(
            candidate.standardKPI ?? candidate.standard_kpi,
            DEFAULT_KPI.standardKPI,
          ),
          currentKPI: toNumber(
            candidate.currentKPI ?? candidate.current_kpi ?? candidate.kpi,
            DEFAULT_KPI.currentKPI,
          ),
          totalBillable: toNumber(
            candidate.totalBillable ?? candidate.total_billable,
            DEFAULT_KPI.totalBillable,
          ),
          lastCalculated:
            candidate.lastCalculated ?? candidate.last_calculated ?? "just now",
          breakdown: {
            tickets: toNumber(
              breakdown.tickets ?? breakdown.ticket ?? candidate.tickets,
              DEFAULT_KPI.breakdown?.tickets ?? 0,
            ),
            logwork: toNumber(
              breakdown.logwork ?? breakdown.logWork ?? candidate.logwork,
              DEFAULT_KPI.breakdown?.logwork ?? 0,
            ),
            quality: toNumber(
              breakdown.quality ?? candidate.quality,
              DEFAULT_KPI.breakdown?.quality ?? 0,
            ),
          },
        };

        setOdcKPI(nextKPI);
        setIsKPILoading(false);
        setKpiTrendData([
          {
            date:
              normalizedMonths.length === 1
                ? normalizedMonths[0]
                : `${normalizedMonths[0]}-${normalizedMonths[normalizedMonths.length - 1]}`,
            odc: nextKPI.currentKPI,
          },
        ]);
        setIsTrendLoading(false);
        setTeamData([]);
        setIsTeamLoading(false);
        setContributionRows([]);
        setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
        setContributionReloadKey((prev) => prev + 1);
        return;
      }

      setOdcKPI(DEFAULT_KPI);
      setIsKPILoading(false);
      setKpiTrendData([]);
      setIsTrendLoading(false);
      setTeamData([]);
      setIsTeamLoading(false);
      setContributionRows([]);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
    } catch (error: any) {
      if (isStaleRequest()) {
        return;
      }

      setOdcKPI(DEFAULT_KPI);
      setIsKPILoading(false);
      setKpiTrendData([]);
      setIsTrendLoading(false);
      setTeamData([]);
      setIsTeamLoading(false);
      setContributionRows([]);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch ODashboard data by month",
      );
    } finally {
      if (!isStaleRequest()) {
        setIsLoading(false);
        setIsContributionLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardByMonth(selectedMonths);
  }, [selectedMonths]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-6 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                ODC KPI Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Monitor overall ODC performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-[180px]">
                <MultiSelectDropdown
                  options={monthOptions}
                  selectedValues={selectedMonths}
                  onChange={setSelectedMonths}
                  placeholder="Select month"
                  disabled={isLoading}
                  showSelectAll
                  selectAllLabel="All"
                  allSelectedLabel="All"
                  multiSelectedSuffix="months selected"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main KPI Section */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Left: KPI Scores */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
                  KPI Score
                </p>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-slate-500 font-semibold mb-1">
                        Total
                      </span>
                      <span className="text-4xl font-bold text-slate-700 leading-none">
                        {odcKPI.totalBillable?.toFixed(1) ?? "0.0"}
                      </span>
                    </div>

                    <div className="h-10 w-px bg-slate-300 mx-1"></div>

                    <div className="flex flex-col items-start">
                      <span className="text-xs text-slate-500 font-semibold mb-1">
                        Average
                      </span>
                      <span className="text-6xl font-bold text-primary leading-none">
                        {odcKPI.currentKPI.toFixed(1)}
                      </span>
                    </div>

                    <span className="text-lg font-semibold text-slate-500 self-end mb-1">
                      / {odcKPI.standardKPI.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-sm text-emerald-600">
                        trending_up
                      </span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Math.abs(
                          odcKPI.currentKPI - odcKPI.standardKPI,
                        ).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">↑ vs Standard</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Last calculated:{" "}
                  <span className="font-medium text-slate-600">
                    {odcKPI.lastCalculated}
                  </span>
                </p>

                {/* KPI Breakdown */}
                {odcKPI.breakdown && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
                      Breakdown
                    </p>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-500">
                              assignment_turned_in
                            </span>
                            Ticket Completion
                          </span>
                          <span className="text-sm font-bold text-blue-600">
                            {odcKPI.breakdown.tickets.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{
                              width: `${Math.min((odcKPI.breakdown.tickets / odcKPI.standardKPI) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-purple-500">
                              schedule
                            </span>
                            Logwork Compliance
                          </span>
                          <span className="text-sm font-bold text-purple-600">
                            {odcKPI.breakdown.logwork.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                            style={{
                              width: `${Math.min((odcKPI.breakdown.logwork / odcKPI.standardKPI) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">
                              code
                            </span>
                            Code Quality
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {odcKPI.breakdown.quality.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{
                              width: `${Math.min((odcKPI.breakdown.quality / odcKPI.standardKPI) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calculate Button */}
              <div className="mt-10 pt-6 border-t border-slate-200">
                <button
                  onClick={() => fetchDashboardByMonth(selectedMonths)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isLoading
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 hover:shadow-xl hover:shadow-primary/30"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${isLoading ? "animate-spin" : ""}`}
                  >
                    calculate
                  </span>
                  {isLoading ? "Loading..." : "Refresh Data"}
                </button>
              </div>
            </div>

            {/* Right: KPI Score Gauge */}
            <div className="flex items-center justify-center">
              {isKPILoading ? (
                <div className="relative w-56 h-56 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full animate-pulse"></div>
              ) : (
                <div className="relative w-56 h-56">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="2.5"
                    />

                    {/* Progress circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2.5"
                      strokeDasharray={`${(odcKPI.currentKPI / 10) * 100}, 100`}
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                    />

                    {/* Gradient definition */}
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>

                    {/* Center text */}
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dy="0.3em"
                      fontSize="10"
                      fontWeight="700"
                      fill="#3b82f6"
                    >
                      {odcKPI.currentKPI.toFixed(1)}
                    </text>
                    <text
                      x="50%"
                      y="65%"
                      textAnchor="middle"
                      dy="0.3em"
                      fontSize="4"
                      fontWeight="500"
                      fill="#64748b"
                    >
                      of {odcKPI.standardKPI.toFixed(1)}
                    </text>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* KPI Trend Chart */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                KPI Trend
              </h3>
              <p className="text-sm text-slate-600 mt-1">Monthly progress</p>
            </div>
            <div className="h-64 w-full">
              {isTrendLoading ? (
                <div className="h-64 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg animate-pulse"></div>
              ) : kpiTrendData.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-400">
                    No trend data available
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={kpiTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: "12px" }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => (value as number).toFixed(1)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="odc"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#8b5cf6" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Team Performance */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Team Performance
              </h3>
              <p className="text-sm text-slate-600 mt-1">By role</p>
            </div>
            <div className="h-64 w-full">
              {isTeamLoading ? (
                <div className="h-64 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg animate-pulse"></div>
              ) : teamData.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-400">
                    No team data available
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={teamData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="role"
                      stroke="#94a3b8"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: "12px" }}
                      yAxisId="left"
                    />
                    <YAxis
                      stroke="#94a3b8"
                      style={{ fontSize: "12px" }}
                      yAxisId="right"
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      fill="#3b82f6"
                      name="Team Size"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="kpi"
                      fill="#8b5cf6"
                      name="Avg KPI"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* KPI Contribution Table */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                KPI Contribution Detail
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Team performance breakdown by week
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table key={contributionReloadKey} className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200"></th>
                  <th
                    colSpan={2}
                    className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200"
                  >
                    BA
                  </th>
                  <th
                    colSpan={2}
                    className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200"
                  >
                    QA Internal
                  </th>
                  <th
                    colSpan={2}
                    className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200"
                  >
                    QA Stand Alone
                  </th>
                  <th
                    colSpan={2}
                    className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200"
                  >
                    DEV
                  </th>
                  <th
                    colSpan={2}
                    className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200"
                  >
                    Reviewer
                  </th>
                  <th colSpan={6} className="px-4 py-2"></th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                    Member's Name
                  </th>
                  {[1, 2, 3, 4, 5].map((w) => (
                    <React.Fragment key={`header-${w}`}>
                      <th className="text-center px-3 py-2 font-medium text-blue-600 whitespace-nowrap border-r border-slate-100 text-xs">
                        Task
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-red-500 whitespace-nowrap border-r border-slate-200 text-xs">
                        Bug
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                    Ticket Contribution Point
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                    LogWork Contr. Point
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                    Member Contr. Point
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">
                    Billable
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                    EE
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isContributionLoading &&
                  Array.from({ length: 6 }, (_, index) => index).map((row) => (
                    <tr
                      key={`loading-${row}`}
                      className="border-b border-slate-100 animate-pulse"
                    >
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-40 rounded bg-slate-200"></div>
                      </td>
                      {Array.from({ length: 5 }, (_, index) => index).map(
                        (value) => (
                          <React.Fragment key={`loading-cell-${row}-${value}`}>
                            <td className="px-3 py-3 border-r border-slate-100">
                              <div className="h-4 w-8 mx-auto rounded bg-slate-200"></div>
                            </td>
                            <td className="px-3 py-3 border-r border-slate-200">
                              <div className="h-4 w-8 mx-auto rounded bg-slate-200"></div>
                            </td>
                          </React.Fragment>
                        ),
                      )}
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-12 mx-auto rounded bg-slate-200"></div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-12 mx-auto rounded bg-slate-200"></div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-12 mx-auto rounded bg-slate-200"></div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-12 mx-auto rounded bg-slate-200"></div>
                      </td>
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="h-4 w-10 mx-auto rounded bg-slate-200"></div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-14 mx-auto rounded bg-slate-200"></div>
                      </td>
                    </tr>
                  ))}

                {!isContributionLoading &&
                  visibleContributionRows.length === 0 && (
                    <tr className="border-b border-slate-100">
                      <td
                        colSpan={17}
                        className="px-4 py-6 text-center text-sm text-slate-500"
                      >
                        No contribution data for selected month(s).
                      </td>
                    </tr>
                  )}

                {!isContributionLoading &&
                  visibleContributionRows.map((row, idx) => (
                    <tr
                      key={`${row.avatar}-${row.name}-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center">
                            {getInitials(row.name)}
                          </div>
                          <span className="font-medium text-slate-800 whitespace-nowrap">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      {row.weeks.map(([task, bug], wi) => (
                        <React.Fragment key={`week-${wi}`}>
                          <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">
                            {task}
                          </td>
                          <td
                            className={`text-center px-3 py-3 border-r border-slate-200 ${bug > 0 ? "text-red-500 font-medium" : "text-slate-400"}`}
                          >
                            {bug}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="text-center px-4 py-3 font-semibold text-blue-600 border-r border-slate-100">
                        {row.ticket.toFixed(2)}
                      </td>
                      <td className="text-center px-4 py-3 font-semibold text-purple-600 border-r border-slate-100">
                        {row.logwork.toFixed(2)}
                      </td>
                      <td
                        className={`text-center px-4 py-3 font-bold border-r border-slate-100 ${row.member >= 8 ? "text-emerald-600" : row.member >= 7.5 ? "text-blue-600" : "text-amber-600"}`}
                      >
                        {row.member.toFixed(2)}
                      </td>
                      <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                        {row.billable.toFixed(2)}
                      </td>
                      <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                        {row.ee}
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className="text-slate-700">{row.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!isContributionLoading && canLoadMoreContributionRows && (
            <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMoreContributionRows}
                className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">
                description
              </span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Tickets</p>
                <p className="text-xs text-slate-600">Add new tickets</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">
                schedule
              </span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Hours</p>
                <p className="text-xs text-slate-600">Log work hours</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">
                trending_up
              </span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">View Reports</p>
                <p className="text-xs text-slate-600">Detailed analytics</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">
                help
              </span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Help</p>
                <p className="text-xs text-slate-600">Documentation</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ODashboard;
