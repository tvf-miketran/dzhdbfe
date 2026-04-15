import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { formulasService } from "../services";
import type { KpiClosedTicketsData } from "../services/formulas.service";
import { useTicketTypes } from "../hooks/queries/useTicketsQueries";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import MainKPISection from "../components/MainKPISection";
import TicketConsumptionDashboard from "../components/TicketConsumptionDashboard";
import StatusOverviewDonut from "../components/StatusOverviewDonut";
import ProjectPerformanceTable from "../components/ProjectPerformanceTable";
import { EmployeesEEModal } from "../components/modal";
import {
  extractFormulaAggregateFromResponse,
  extractFormulaCandidateFromResponse,
  extractFormulaLogworkComparisonFromResponse,
  extractFormulaTicketComparisonFromResponse,
  extractFormulaRowsFromResponse,
  type FormulaAggregateData,
  type FormulaResultRow,
} from "../mappers";
import {
  buildMonthRequestCandidates,
  buildRecentMonthOptions,
  getCurrentMonth,
  getInitials,
  getRoleColumnIndex,
  normalizeKPIStandardParams,
  normalizeMonthValue,
  toNumber,
} from "../utils/dashboardShared";
import type {
  ContributionRow,
  KPIData,
  TeamData,
  TrendData,
} from "../types/index";
import * as theme from "../theme/colors";

const DEFAULT_KPI: KPIData = {
  standardKPI: 0,
  currentKPI: 0,
  billableStandard: 0,
  logworkStandard: 0,
  totalBillable: 0,
  lastCalculated: "No data available",
  breakdown: {
    tickets: 0,
    logwork: 0,
    quality: 0,
  },
};

// Empty default - no mock data to avoid confusion
const DEFAULT_CONTRIBUTION_ROWS: ContributionRow[] = [];

const CONTRIBUTION_PAGE_SIZE = 20;

const monthOptions = buildRecentMonthOptions();

type TicketBreakdownItem = NonNullable<
  FormulaResultRow["ticket_breakdown"]
>[number] & {
  taskCount?: number;
  task?: number;
  bugCount?: number;
  bug?: number;
};

type LogworkComparisonChartPoint = {
  month: string;
  standard: number;
  actual: number;
};

type TicketComparisonChartPoint = {
  month: string;
  expected: number;
  completed: number;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildFromMemberRows = (
  rows: FormulaResultRow[],
  selectedMonths: string[],
  aggregateData?: FormulaAggregateData,
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
    breakdown.forEach((item: TicketBreakdownItem) => {
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
      new Set(breakdown.map((item) => item?.role).filter(Boolean)),
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
  const apiBillableStandard = aggregateData?.billable_standard;
  const apiLogworkStandard = aggregateData?.logwork_standard;
  const apiAverageEE = aggregateData?.average_ee;
  const apiParams = normalizeKPIStandardParams(aggregateData?.params);

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
    billableStandard: toNumber(
      apiBillableStandard,
      DEFAULT_KPI.billableStandard,
    ),
    logworkStandard: toNumber(apiLogworkStandard, DEFAULT_KPI.logworkStandard),
    totalBillable: kpiTotalBillableValue,
    averageEE: apiAverageEE,
    params: apiParams,
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
  const [pendingSelectedMonths, setPendingSelectedMonths] = useState<string[]>(
    [getCurrentMonth()],
  );
  const [isLoading, setIsLoading] = useState(false);

  const [odcKPI, setOdcKPI] = useState<KPIData>(DEFAULT_KPI);
  const [isKPILoading, setIsKPILoading] = useState(true);
  const [kpiTrendData, setKpiTrendData] = useState<TrendData[]>([]);
  const [isTrendLoading, setIsTrendLoading] = useState(true);
  const [logworkComparisonData, setLogworkComparisonData] = useState<
    LogworkComparisonChartPoint[]
  >([]);
  const [ticketComparisonData, setTicketComparisonData] = useState<
    TicketComparisonChartPoint[]
  >([]);
  const [activeTicketGuides, setActiveTicketGuides] = useState<{
    required?: number;
    completed?: number;
  } | null>(null);
  const [activeLogworkGuides, setActiveLogworkGuides] = useState<{
    expected?: number;
    actual?: number;
  } | null>(null);
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
  const [contributionSearch, setContributionSearch] = useState("");
  const [contributionProjectId, setContributionProjectId] = useState<
    string | null
  >(null);
  const [totalCurrentMember, setTotalCurrentMember] = useState<number>(0);
  const latestRequestIdRef = useRef(0);

  // --- Closed Tickets KPI state ---
  const [ticketProjectId, setTicketProjectId] = useState<string | null>(null);
  const [ticketTypeId, setTicketTypeId] = useState<string | null>(null);
  const [allProjectOptions, setAllProjectOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const { data: ticketTypes = [] } = useTicketTypes();
  const [closedTicketData, setClosedTicketData] =
    useState<KpiClosedTicketsData | null>(null);
  const [isClosedTicketsLoading, setIsClosedTicketsLoading] = useState(true);
  const [closedTicketError, setClosedTicketError] = useState<string | null>(
    null,
  );
  const [isEEModalOpen, setIsEEModalOpen] = useState(false);

  const normalizedContributionSearch = contributionSearch.trim().toLowerCase();

  const filteredContributionRows = useMemo(() => {
    if (!normalizedContributionSearch) {
      return contributionRows;
    }

    return contributionRows.filter((row) =>
      row.name.toLowerCase().includes(normalizedContributionSearch),
    );
  }, [contributionRows, normalizedContributionSearch]);

  const visibleContributionRows = useMemo(
    () => filteredContributionRows.slice(0, visibleContributionCount),
    [filteredContributionRows, visibleContributionCount],
  );

  const canLoadMoreContributionRows =
    visibleContributionCount < filteredContributionRows.length;

  const noContributionMessage =
    contributionRows.length > 0 && normalizedContributionSearch
      ? "No members matched your search."
      : "No contribution data for selected month(s).";

  useEffect(() => {
    setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
  }, [contributionSearch]);

  const handleLoadMoreContributionRows = () => {
    setVisibleContributionCount((prev) =>
      Math.min(prev + CONTRIBUTION_PAGE_SIZE, filteredContributionRows.length),
    );
  };

  const getStatusClassName = (status: string): string => {
    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === "bad") {
      return "text-red-600 font-bold";
    }

    if (normalizedStatus === "good") {
      return "text-emerald-600 font-bold";
    }

    return "text-slate-700 font-bold";
  };

  const filteredProjectOverview = closedTicketData?.project_overview_table;

  const fetchClosedTickets = async (
    months: string,
    projectId?: string | null,
    selectedTicketTypeId?: string | null,
  ) => {
    setIsClosedTicketsLoading(true);
    setClosedTicketError(null);
    try {
      const params: {
        month: string;
        project?: string;
        ticket_type_id?: string;
      } = {
        month: months,
      };
      if (projectId) params.project = projectId;
      if (selectedTicketTypeId) {
        params.ticket_type_id = selectedTicketTypeId;
      }
      const raw = await formulasService.getKpiClosedTickets(params);
      const rawAny = raw as Record<string, unknown>;
      const inner: KpiClosedTicketsData | null =
        rawAny?.project_overview_table !== undefined
          ? (raw as unknown as KpiClosedTicketsData)
          : ((rawAny?.data as KpiClosedTicketsData | undefined) ?? null);
      if (inner) {
        setClosedTicketData(inner);
        if (!projectId && inner.project_overview_table?.length) {
          setAllProjectOptions(
            inner.project_overview_table.map((p) => ({
              value: p.project_id,
              label: p.project_name,
            })),
          );
        }
      } else {
        setClosedTicketError("No data returned from API.");
      }
    } catch (error: unknown) {
      const msg =
        (error as { message?: string })?.message ||
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        "Failed to fetch closed tickets data";
      setClosedTicketError(msg);
      toast.error(msg);
    } finally {
      setIsClosedTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchClosedTickets(selectedMonths.join(","), ticketProjectId, ticketTypeId);
  }, [ticketProjectId, ticketTypeId]);

  const handleRefreshData = () => {
    setSelectedMonths(pendingSelectedMonths);
    fetchDashboardByMonth(pendingSelectedMonths, contributionProjectId);
    fetchClosedTickets(
      pendingSelectedMonths.join(","),
      ticketProjectId,
      ticketTypeId,
    );
  };

  const fetchDashboardPayloadByMonths = async (
    months: string[],
    project?: string | null,
  ) => {
    const monthParamCandidates = buildMonthRequestCandidates(months);
    let lastError: unknown = null;

    for (const monthParam of monthParamCandidates) {
      try {
        const root =
          (await formulasService.getFormulaODC({
            month: monthParam,
            ...(project ? { project } : {}),
          })) ?? {};
        const rows = extractFormulaRowsFromResponse(root);
        const aggregateData = extractFormulaAggregateFromResponse(root);
        const logworkComparisonData =
          extractFormulaLogworkComparisonFromResponse(root);
        const ticketComparisonData =
          extractFormulaTicketComparisonFromResponse(root);

        if (rows.length > 0) {
          return {
            rows,
            candidate: null,
            aggregateData,
            logworkComparisonData,
            ticketComparisonData,
          };
        }

        const candidate = extractFormulaCandidateFromResponse(root);
        if (candidate) {
          return {
            rows: [],
            candidate,
            aggregateData,
            logworkComparisonData,
            ticketComparisonData,
          };
        }

        if (logworkComparisonData.length > 0 || ticketComparisonData.length > 0) {
          return {
            rows: [],
            candidate: null,
            aggregateData,
            logworkComparisonData,
            ticketComparisonData,
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
      logworkComparisonData: [],
      ticketComparisonData: [],
    };
  };

  const fetchDashboardByMonth = async (
    months: string[],
    project?: string | null,
  ) => {
    const normalizedMonths = monthOptions
      .map((option) => option.value)
      .filter((monthValue) => months.includes(monthValue));

    if (normalizedMonths.length === 0) {
      setOdcKPI(DEFAULT_KPI);
      setIsKPILoading(false);
      setIsTrendLoading(false);
      setTeamData([]);
      setIsTeamLoading(false);
      setContributionRows([]);
      setTotalCurrentMember(0);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
      setKpiTrendData([]);
      setLogworkComparisonData([]);
      setTicketComparisonData([]);
      setIsContributionLoading(false);
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    const isStaleRequest = () => requestId !== latestRequestIdRef.current;

    setIsLoading(true);
    setIsContributionLoading(true);

    try {
      const payload = await fetchDashboardPayloadByMonths(
        normalizedMonths,
        project,
      );
      if (isStaleRequest()) {
        return;
      }

      if (payload.rows.length > 0) {
        const next = buildFromMemberRows(
          payload.rows,
          normalizedMonths,
          payload.aggregateData,
        );

        const monthGroupedRows = new Map<string, FormulaResultRow[]>();
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

            const totalMemberPoint = monthRows.reduce<number>(
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
          let totalMemberPoint = 0;
          payload.rows.forEach((row) => {
            totalMemberPoint += toNumber(row.member_contr_point, 0);
          });
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
        setLogworkComparisonData(payload.logworkComparisonData);
        setTicketComparisonData(payload.ticketComparisonData);
        setTotalCurrentMember(
          payload.aggregateData.total_current_member ??
            next.contribution.length,
        );
        setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
        setContributionReloadKey((prev) => prev + 1); // Trigger re-mount AFTER data is set
        return;
      }

      if (payload.candidate) {
        const candidate = payload.candidate;
        const breakdown = candidate.breakdown ?? candidate.kpiBreakdown ?? {};
        const paramsFromCandidate =
          normalizeKPIStandardParams(candidate.params) ??
          normalizeKPIStandardParams(payload.aggregateData.params);

        const averageEEFromSource =
          candidate.averageEE ??
          candidate.average_ee ??
          payload.aggregateData.average_ee;

        const nextKPI: KPIData = {
          standardKPI: toNumber(
            candidate.standardKPI ?? candidate.standard_kpi,
            DEFAULT_KPI.standardKPI,
          ),
          currentKPI: toNumber(
            candidate.currentKPI ?? candidate.current_kpi ?? candidate.kpi,
            DEFAULT_KPI.currentKPI,
          ),
          billableStandard: toNumber(
            candidate.billableStandard ??
              candidate.billable_standard ??
              payload.aggregateData.billable_standard,
            DEFAULT_KPI.billableStandard,
          ),
          logworkStandard: toNumber(
            candidate.logworkStandard ??
              candidate.logwork_standard ??
              payload.aggregateData.logwork_standard,
            DEFAULT_KPI.logworkStandard,
          ),
          totalBillable: toNumber(
            candidate.totalBillable ?? candidate.total_billable,
            DEFAULT_KPI.totalBillable,
          ),
          averageEE: toOptionalNumber(averageEEFromSource),
          params: paramsFromCandidate,
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
        setLogworkComparisonData(payload.logworkComparisonData);
        setTicketComparisonData(payload.ticketComparisonData);
        setTotalCurrentMember(0);
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
      setLogworkComparisonData(payload.logworkComparisonData);
      setTicketComparisonData(payload.ticketComparisonData);
      setTotalCurrentMember(0);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
    } catch (error: unknown) {
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
      setLogworkComparisonData([]);
      setTicketComparisonData([]);
      setTotalCurrentMember(0);
      setVisibleContributionCount(CONTRIBUTION_PAGE_SIZE);
      setContributionReloadKey((prev) => prev + 1);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to fetch ODashboard data by month";

      toast.error(errorMessage);
    } finally {
      if (!isStaleRequest()) {
        setIsLoading(false);
        setIsContributionLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardByMonth(selectedMonths, contributionProjectId);
  }, []);

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-slate-50 to-slate-100">
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
                  selectedValues={pendingSelectedMonths}
                  onChange={setPendingSelectedMonths}
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

        {/* KPI Reach Summary & Comparison Charts */}
        {(() => {
          const reachCount = contributionRows.filter(
            (r: ContributionRow) =>
              r.status && r.status !== "Bad" && r.status !== "-",
          ).length;
          const notReachCount = contributionRows.filter(
            (r: ContributionRow) => r.status === "Bad",
          ).length;

          const selectedMonthValues = monthOptions
            .map((option) => option.value)
            .filter((monthValue) => selectedMonths.includes(monthValue));
          const isSingleMonthSelected = selectedMonthValues.length === 1;

          const fallbackActualFromContribution =
            contributionRows.reduce(
              (sum: number, r: ContributionRow) => sum + toNumber(r.logwork, 0),
              0,
            ) || 138;

          const ticketComparisonByMonth = new Map(
            ticketComparisonData.map((item) => [
              normalizeMonthValue(item.month) ?? item.month,
              item,
            ]),
          );

          const logworkTrendData = selectedMonthValues.map((month, index) => {
            const fromApi =
              selectedMonthValues.length === 1
                ? logworkComparisonData[0]
                : logworkComparisonData[index] ?? logworkComparisonData[0];

            return {
              month,
              standard: toNumber(
                fromApi?.standard,
                toNumber(odcKPI.logworkStandard, 161),
              ),
              actual: toNumber(
                fromApi?.actual,
                index === selectedMonthValues.length - 1
                  ? fallbackActualFromContribution
                  : 0,
              ),
            };
          });

          const logworkMaxPoint = logworkTrendData.reduce(
            (maxValue, item) =>
              Math.max(
                maxValue,
                toNumber(item.standard, 0),
                toNumber(item.actual, 0),
              ),
            0,
          );
          const logworkAxisDomain: [number, number] = [
            0,
            Math.max(Math.ceil(logworkMaxPoint * 1.1), 10),
          ];

          const ticketTrendData =
            selectedMonthValues.map((month, index) => {
              const fromApi =
                ticketComparisonByMonth.get(month) ??
                (selectedMonthValues.length === 1
                  ? ticketComparisonData[0]
                  : ticketComparisonData[index] ?? ticketComparisonData[0]);

              return {
                month,
                expected: toNumber(
                  fromApi?.expected,
                  index === selectedMonthValues.length - 1
                    ? contributionRows.length > 0
                      ? contributionRows.length * 7
                      : 70
                    : 0,
                ),
                completed: toNumber(
                  fromApi?.actual,
                  index === selectedMonthValues.length - 1
                    ? contributionRows.reduce(
                        (sum: number, r: ContributionRow) =>
                          sum + toNumber(r.ticket, 0),
                        0,
                      ) || 45
                    : 0,
                ),
              };
            });

          const ticketMaxPoint = ticketTrendData.reduce(
            (maxValue, item) =>
              Math.max(
                maxValue,
                toNumber(item.expected, 0),
                toNumber(item.completed, 0),
              ),
            0,
          );
          const ticketAxisDomain: [number, number] = [
            0,
            Math.max(Math.ceil(ticketMaxPoint * 1.1), 10),
          ];

          return (
            <>
              <MainKPISection
                kpi={odcKPI}
                isLoading={isLoading}
                isKPILoading={isKPILoading}
                onRefresh={handleRefreshData}
                showTotal
                totalMembers={totalCurrentMember}
                hideParams
                reachKPICount={reachCount}
                notReachKPICount={notReachCount}
                onAverageEEClick={() => setIsEEModalOpen(true)}
              />

              {/* Variance Analysis */}
              <div className="mb-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <span className="material-symbols-outlined text-lg text-slate-600 block">
                      trending_up
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      Variance Analysis
                    </h2>
                    <p className="text-xs text-slate-500">
                      Standard vs Actual comparison over months
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Logwork Trend */}
                  <div
                    className="rounded-xl bg-white shadow-sm overflow-hidden"
                    style={{ border: "1px solid #e5e7eb" }}
                  >
                    <div className="px-5 pt-4 pb-1">
                      <h3 className="text-[15px] font-bold text-slate-800">
                        Logwork Comparison
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Expected vs Actual logwork points per month
                      </p>
                    </div>
                    <div className="px-2 pb-4">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={logworkTrendData}
                          barGap={isSingleMonthSelected ? -270 : -34}
                          barCategoryGap={isSingleMonthSelected ? "20%" : "20%"}
                          margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                          onMouseMove={(state: any) => {
                            const payload = state?.activePayload;
                            if (Array.isArray(payload) && payload.length > 0) {
                              const expectedValue = toOptionalNumber(
                                payload.find((item: any) => item?.dataKey === "standard")
                                  ?.value,
                              );
                              const actualValue = toOptionalNumber(
                                payload.find((item: any) => item?.dataKey === "actual")
                                  ?.value,
                              );
                              setActiveLogworkGuides({
                                expected: expectedValue,
                                actual: actualValue,
                              });
                              return;
                            }

                            const activeIndex = Number(state?.activeTooltipIndex);
                            if (
                              Number.isInteger(activeIndex) &&
                              activeIndex >= 0 &&
                              activeIndex < logworkTrendData.length
                            ) {
                              const activePoint = logworkTrendData[activeIndex];
                              const expectedValue = toOptionalNumber(
                                activePoint?.standard,
                              );
                              const actualValue = toOptionalNumber(
                                activePoint?.actual,
                              );
                              setActiveLogworkGuides({
                                expected: expectedValue,
                                actual: actualValue,
                              });
                              return;
                            }

                            setActiveLogworkGuides(null);
                          }}
                          onMouseLeave={() => setActiveLogworkGuides(null)}
                        >
                          <CartesianGrid
                            strokeDasharray="0"
                            vertical={false}
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                          />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            domain={logworkAxisDomain}
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                            label={{
                              value: "Points",
                              angle: -90,
                              position: "insideLeft",
                              offset: 10,
                              style: { fontSize: 12, fill: "#666" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={logworkAxisDomain}
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                            label={{
                              value: "Points",
                              angle: 90,
                              position: "insideRight",
                              offset: 10,
                              style: { fontSize: 12, fill: "#666" },
                            }}
                          />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              backgroundColor: "#fff",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                              padding: "8px 12px",
                              fontSize: "13px",
                            }}
                            itemSorter={(item) =>
                              item.dataKey === "standard" ? -1 : 1
                            }
                            formatter={(
                              value: number,
                              _name: string,
                              props?: any,
                            ) => [
                              <span
                                key={props?.dataKey ?? _name}
                                style={{ color: "#333", fontWeight: 600 }}
                              >
                                {value.toFixed(2)}
                              </span>,
                              props?.dataKey === "actual"
                                ? "Actual"
                                : "Expected",
                            ]}
                            labelFormatter={(label: string) => (
                              <span
                                style={{ fontWeight: 700, fontSize: "13px" }}
                              >
                                Month {label}
                              </span>
                            )}
                          />
                          {activeLogworkGuides?.expected !== undefined && (
                            <ReferenceLine
                              yAxisId="left"
                              y={activeLogworkGuides.expected}
                              stroke="#2563eb"
                              strokeDasharray="6 3"
                              strokeOpacity={1}
                              strokeWidth={1.5}
                              label={{
                                value: activeLogworkGuides.expected.toFixed(2),
                                position: "left",
                                fill: "#2563eb",
                                fontSize: 12,
                                fontWeight: 700,
                                background: { fill: "#fff", radius: 4 },
                                padding: [4, 8],
                                offset: 10,
                              }}
                              isFront
                            />
                          )}
                          {activeLogworkGuides?.actual !== undefined && (
                            <ReferenceLine
                              yAxisId="right"
                              y={activeLogworkGuides.actual}
                              stroke="#c7d2fe"
                              strokeDasharray="6 3"
                              strokeOpacity={1}
                              strokeWidth={1.5}
                              label={{
                                value: activeLogworkGuides.actual.toFixed(2),
                                position: "right",
                                fill: "#6366f1",
                                fontSize: 12,
                                fontWeight: 700,
                                background: { fill: "#fff", radius: 4 },
                                padding: [4, 8],
                                offset: 10,
                              }}
                              isFront
                            />
                          )}
                          <Bar
                            yAxisId="left"
                            dataKey="standard"
                            name="Expected"
                            fill="#2563eb"
                            maxBarSize={32}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="actual"
                            name="Actual"
                            fill="#c7d2fe"
                            maxBarSize={32}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="px-5 pb-3 flex items-center justify-center gap-6 text-xs w-full">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm inline-block"
                          style={{ backgroundColor: "#2563eb" }}
                        />
                        <span className="text-slate-600 font-medium">
                          Expected
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm inline-block"
                          style={{ backgroundColor: "#c7d2fe" }}
                        />
                        <span className="text-slate-600 font-medium">
                          Actual
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Ticket Trend */}
                  <div
                    className="rounded-xl bg-white shadow-sm overflow-hidden"
                    style={{ border: "1px solid #e5e7eb" }}
                  >
                    <div className="px-5 pt-4 pb-1">
                      <h3 className="text-[15px] font-bold text-slate-800">
                        Ticket Completion
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Required vs Completed tickets per month
                      </p>
                    </div>
                    <div className="px-2 pb-4">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={ticketTrendData}
                          barGap={isSingleMonthSelected ? -270 : -34}
                          barCategoryGap={isSingleMonthSelected ? "20%" : "20%"}
                          margin={{ top: 20, right: 20, bottom: 5, left: 0 }}
                          onMouseMove={(state: any) => {
                            const payload = state?.activePayload;
                            if (Array.isArray(payload) && payload.length > 0) {
                              const expectedValue = toOptionalNumber(
                                payload.find((item: any) => item?.dataKey === "expected")
                                  ?.value,
                              );
                              const completedValue = toOptionalNumber(
                                payload.find((item: any) => item?.dataKey === "completed")
                                  ?.value,
                              );
                              setActiveTicketGuides({
                                required: expectedValue,
                                completed: completedValue,
                              });
                              return;
                            }

                            const activeIndex = Number(state?.activeTooltipIndex);
                            if (
                              Number.isInteger(activeIndex) &&
                              activeIndex >= 0 &&
                              activeIndex < ticketTrendData.length
                            ) {
                              const activePoint = ticketTrendData[activeIndex];
                              const expectedValue = toOptionalNumber(
                                activePoint?.expected,
                              );
                              const completedValue = toOptionalNumber(
                                activePoint?.completed,
                              );
                              setActiveTicketGuides({
                                required: expectedValue,
                                completed: completedValue,
                              });
                              return;
                            }

                            setActiveTicketGuides(null);
                          }}
                          onMouseLeave={() => setActiveTicketGuides(null)}
                        >
                          <CartesianGrid
                            strokeDasharray="0"
                            vertical={false}
                            stroke="#f0f0f0"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                          />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            domain={ticketAxisDomain}
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                            label={{
                              value: "Tickets",
                              angle: -90,
                              position: "insideLeft",
                              offset: 10,
                              style: { fontSize: 12, fill: "#666" },
                            }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={ticketAxisDomain}
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={{ stroke: "#ccd6eb" }}
                            tickLine={{ stroke: "#ccd6eb" }}
                            label={{
                              value: "Tickets",
                              angle: 90,
                              position: "insideRight",
                              offset: 10,
                              style: { fontSize: 12, fill: "#666" },
                            }}
                          />
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              backgroundColor: "#fff",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                              padding: "8px 12px",
                              fontSize: "13px",
                            }}
                            itemSorter={(item) =>
                              item.dataKey === "expected" ? -1 : 1
                            }
                            formatter={(
                              value: number,
                              _name: string,
                              props?: any,
                            ) => [
                              <span
                                key={props?.dataKey ?? _name}
                                style={{ color: "#333", fontWeight: 600 }}
                              >
                                {value.toFixed(2)}
                              </span>,
                              props?.dataKey === "completed"
                                ? "Completed"
                                : "Expected",
                            ]}
                            labelFormatter={(label: string) => (
                              <span
                                style={{ fontWeight: 700, fontSize: "13px" }}
                              >
                                Month {label}
                              </span>
                            )}
                          />
                          {activeTicketGuides?.required !== undefined && (
                            <ReferenceLine
                              yAxisId="left"
                              y={activeTicketGuides.required}
                              stroke="#2563eb"
                              strokeDasharray="6 3"
                              strokeOpacity={1}
                              strokeWidth={1.5}
                              label={{
                                value: activeTicketGuides.required.toFixed(2),
                                position: "left",
                                fill: "#2563eb",
                                fontSize: 12,
                                fontWeight: 700,
                                background: { fill: "#fff", radius: 4 },
                                padding: [4, 8],
                                offset: 10,
                              }}
                              isFront
                            />
                          )}
                          {activeTicketGuides?.completed !== undefined && (
                            <ReferenceLine
                              yAxisId="right"
                              y={activeTicketGuides.completed}
                              stroke="#c7d2fe"
                              strokeDasharray="6 3"
                              strokeOpacity={1}
                              strokeWidth={1.5}
                              label={{
                                value: activeTicketGuides.completed.toFixed(2),
                                position: "right",
                                fill: "#6366f1",
                                fontSize: 12,
                                fontWeight: 700,
                                background: { fill: "#fff", radius: 4 },
                                padding: [4, 8],
                                offset: 10,
                              }}
                              isFront
                            />
                          )}
                          <Bar
                            yAxisId="left"
                            dataKey="expected"
                            name="Expected"
                            fill="#2563eb"
                            maxBarSize={32}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="completed"
                            name="Completed"
                            fill="#b6c1ff"
                            maxBarSize={32}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="px-5 pb-3 flex items-center justify-center gap-6 text-xs w-full">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm inline-block"
                          style={{ backgroundColor: "#2563eb" }}
                        />
                        <span className="text-slate-600 font-medium">
                          Expected
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm inline-block"
                          style={{ backgroundColor: "#b6c1ff" }}
                        />
                        <span className="text-slate-600 font-medium">
                          Completed
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Analytics Overview */}
        <div className="mb-6">
          <div className="mb-4 overflow-x-auto custom-scrollbar">
            <div className="flex min-w-[980px] items-center justify-between gap-4 pb-1">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <h2 className="text-base font-semibold text-slate-700">
                  Closed Tickets KPI
                </h2>
                <p className="text-xs text-slate-500">
                  Ticket analytics by role, trend, and status
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Period filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    Month
                  </span>
                  <div className="w-[180px]">
                    <MultiSelectDropdown
                      options={monthOptions}
                      selectedValues={pendingSelectedMonths}
                      onChange={setPendingSelectedMonths}
                      placeholder="Select month"
                      disabled={isLoading}
                      showSelectAll
                      selectAllLabel="All"
                      allSelectedLabel="All"
                      multiSelectedSuffix="months selected"
                    />
                  </div>
                </div>
                {/* Project filter — uses allProjectOptions so list persists after filtered fetches */}
                {allProjectOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      Project
                    </span>
                    <div className="w-[180px]">
                      <MultiSelectDropdown
                        options={[
                          { value: "", label: "All Projects" },
                          ...allProjectOptions,
                        ]}
                        selectedValues={[ticketProjectId ?? ""]}
                        onChange={(vals) => {
                          // Detect the newly selected item (not in previous selection)
                          const prev = ticketProjectId ?? "";
                          const next = vals.find((v) => v !== prev);
                          if (next !== undefined) {
                            setTicketProjectId(next || null);
                          } else if (vals.length === 0) {
                            setTicketProjectId(null);
                          }
                        }}
                        disabled={isClosedTicketsLoading}
                        placeholder="All Projects"
                      />
                    </div>
                  </div>
                )}
                {ticketTypes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      Ticket Type
                    </span>
                    <div className="w-[220px]">
                      <MultiSelectDropdown
                        options={[
                          { value: "", label: "All Types" },
                          ...ticketTypes.map((type) => ({
                            value: type.id,
                            label: type.name || type.code || "Unknown",
                          })),
                        ]}
                        selectedValues={[ticketTypeId ?? ""]}
                        onChange={(vals) => {
                          const prev = ticketTypeId ?? "";
                          const next = vals.find((v) => v !== prev);
                          if (next !== undefined) {
                            setTicketTypeId(next || null);
                          } else if (vals.length === 0) {
                            setTicketTypeId(null);
                          }
                        }}
                        disabled={isClosedTicketsLoading}
                        placeholder="All Types"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8 min-w-0">
          <TicketConsumptionDashboard
            closedByRole={closedTicketData?.closed_by_role_chart}
            totalTrend={closedTicketData?.total_trend_chart?.data}
            isLoading={isClosedTicketsLoading}
          />
          <StatusOverviewDonut
            totals={
              closedTicketData?.status_overview_chart
                ? {
                    total: closedTicketData.status_overview_chart.total_tickets,
                    closed:
                      closedTicketData.status_overview_chart
                        .total_tickets_closed,
                    inQA: closedTicketData.status_overview_chart
                      .total_tickets_inqa,
                    open: closedTicketData.status_overview_chart
                      .total_tickets_open,
                  }
                : undefined
            }
            isLoading={isClosedTicketsLoading}
            error={closedTicketError}
          />
        </div>

        {/* Project Performance Table */}
        <ProjectPerformanceTable
          data={filteredProjectOverview}
          isLoading={isClosedTicketsLoading}
        />

        {/* Standard Params */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 shadow-sm">
          <div className="px-8 py-5 border-b border-slate-200/80">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">tune</span>
                Standard Parameters
              </p>
              <span className="text-[11px] font-semibold text-slate-400">
                Configuration Baseline
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: "BILLABLE_PARAM",
                  label: "Billable Param",
                  value: odcKPI.params?.BILLABLE_PARAM,
                  icon: "payments",
                  tone: "border-blue-100 bg-blue-50/60 text-blue-700",
                },
                {
                  key: "STANDARD_BA",
                  label: "Standard Ticket BA",
                  value: odcKPI.params?.STANDARD_BA,
                  icon: "description",
                  tone: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
                },
                {
                  key: "STANDARD_DEV",
                  label: "Standard Ticket DEV",
                  value: odcKPI.params?.STANDARD_DEV,
                  icon: "terminal",
                  tone: "border-indigo-100 bg-indigo-50/60 text-indigo-700",
                },
                {
                  key: "STANDARD_QA",
                  label: "Standard Ticket QA",
                  value: odcKPI.params?.STANDARD_QA,
                  icon: "fact_check",
                  tone: "border-purple-100 bg-purple-50/60 text-purple-700",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`rounded-2xl border p-4 shadow-sm ${item.tone}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {item.label}
                    </p>
                    <span className="material-symbols-outlined text-[18px] opacity-80">
                      {item.icon}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black leading-none text-slate-800">
                    {item.value !== undefined &&
                    item.value !== null &&
                    String(item.value).trim() !== ""
                      ? String(item.value)
                      : "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Contribution Table */}
        <div className={`mb-8 ${theme.card}`}>
          <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className={theme.heading}>KPI Contribution Detail</h3>
              <p className={theme.subtitle}>
                Team performance breakdown by week
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
              {allProjectOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    Project
                  </span>
                  <div className="min-w-[180px]">
                    <MultiSelectDropdown
                      options={[
                        { value: "", label: "All Projects" },
                        ...allProjectOptions,
                      ]}
                      selectedValues={[contributionProjectId ?? ""]}
                      onChange={(vals) => {
                        const prev = contributionProjectId ?? "";
                        const next = vals.find((v) => v !== prev);
                        if (next !== undefined) {
                          setContributionProjectId(next || null);
                        } else if (vals.length === 0) {
                          setContributionProjectId(null);
                        }
                      }}
                      placeholder="All Projects"
                    />
                  </div>
                </div>
              )}
              <div className="w-full sm:w-[300px]">
                <label htmlFor="contribution-search" className="sr-only">
                  Search member by name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    id="contribution-search"
                    type="text"
                    value={contributionSearch}
                    onChange={(event) =>
                      setContributionSearch(event.target.value)
                    }
                    placeholder="Search by member name"
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table key={contributionReloadKey} className="w-full text-sm">
              <thead>
                <tr className={theme.tableHead}>
                  <th className={`text-left ${theme.thBordered}`}></th>
                  <th
                    colSpan={2}
                    className={`text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200`}
                  >
                    BA
                  </th>
                  <th
                    colSpan={2}
                    className={`text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200`}
                  >
                    QA Internal
                  </th>
                  <th
                    colSpan={2}
                    className={`text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200`}
                  >
                    QA Stand Alone
                  </th>
                  <th
                    colSpan={2}
                    className={`text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200`}
                  >
                    DEV
                  </th>
                  <th
                    colSpan={2}
                    className={`text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200`}
                  >
                    Reviewer
                  </th>
                  <th colSpan={6} className="px-4 py-2"></th>
                </tr>
                <tr className={theme.tableHead}>
                  <th className={`text-left ${theme.thBordered}`}>
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
                  <th className={`text-center ${theme.thBordered}`}>
                    Ticket Contribution Point
                  </th>
                  <th className={`text-center ${theme.thBordered}`}>
                    LogWork Contr. Point
                  </th>
                  <th className={`text-center ${theme.thBordered}`}>
                    Member Contr. Point
                  </th>
                  <th className={`text-center ${theme.thBordered}`}>
                    Billable
                  </th>
                  <th className={`text-center ${theme.th}`}>EE</th>
                  <th className={`text-center ${theme.th}`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isContributionLoading &&
                  Array.from({ length: 6 }, (_, index) => index).map((row) => (
                    <tr
                      key={`loading-${row}`}
                      className={`border-b border-slate-100 animate-pulse`}
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
                        {noContributionMessage}
                      </td>
                    </tr>
                  )}

                {!isContributionLoading &&
                  visibleContributionRows.map((row, idx) => (
                    <tr
                      key={`${row.avatar}-${row.name}-${idx}`}
                      className={theme.tableRow}
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
                        <span className={getStatusClassName(row.status)}>
                          {row.status}
                        </span>
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
      </div>

      <EmployeesEEModal
        isOpen={isEEModalOpen}
        onClose={() => setIsEEModalOpen(false)}
      />
    </div>
  );
};

export default ODashboard;
