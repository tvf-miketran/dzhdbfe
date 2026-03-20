import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { formulasService } from "../services";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import MainKPISection from "../components/MainKPISection";
import {
  extractFormulaAggregateFromResponse,
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
  normalizeMonthValue,
  toNumber,
} from "../utils/dashboardShared";
import type { KPIData, PersonalContributionRow } from "../types/index";

const monthOptions = buildRecentMonthOptions();

type TicketBreakdownItem = NonNullable<
  FormulaResultRow["ticket_breakdown"]
>[number] & {
  taskCount?: number;
  task?: number;
  bugCount?: number;
  bug?: number;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.UUID || "";
  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    getCurrentMonth(),
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [personalKPI, setPersonalKPI] = useState<KPIData>({
    standardKPI: 8.5,
    currentKPI: 7.8,
    billableStandard: 0,
    logworkStandard: 0,
    totalBillable: 0,
    lastCalculated: "2 hours ago",
    breakdown: {
      tickets: 3.5,
      logwork: 2.0,
      quality: 2.3,
    },
  });
  const [personalContribution, setPersonalContribution] =
    useState<PersonalContributionRow>({
      name: user?.en_full_name || user?.vn_full_name || "You",
      weeks: [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      ticket: 0,
      logwork: 0,
      member: 0,
      billable: 0,
      ee: "-",
      status: "-",
    });
  const [monthTicketCount, setMonthTicketCount] = useState(0);
  const [monthLogworkPoint, setMonthLogworkPoint] = useState(0);
  const [monthRolesCount, setMonthRolesCount] = useState(0);

  const [kpiTrendData, setKpiTrendData] = useState([
    { date: "Jan", personal: 7.2 },
    { date: "Feb", personal: 7.5 },
    { date: "Mar", personal: 7.8 },
    { date: "Apr", personal: 8.0 },
    { date: "May", personal: 7.9 },
    { date: "Jun", personal: 7.8 },
  ]);

  const fetchPersonalRowsByMonths = async (
    months: string[],
  ): Promise<{
    rows: FormulaResultRow[];
    aggregateData: FormulaAggregateData;
  }> => {
    const monthParamCandidates = buildMonthRequestCandidates(months);

    for (const monthParam of monthParamCandidates) {
      try {
        const root =
          (await formulasService.getFormulaByUser(userId, {
            month: monthParam,
            latest: false,
          })) ?? {};
        const rows = extractFormulaRowsFromResponse(root);
        const aggregateData = extractFormulaAggregateFromResponse(root);
        if (rows.length > 0) {
          return { rows, aggregateData };
        }
      } catch (_error) {
        // try next month format candidate
      }
    }

    return { rows: [], aggregateData: {} };
  };

  const fetchDashboardByMonth = async (months: string[]) => {
    if (!userId) return;
    const normalizedMonths = monthOptions
      .map((option) => option.value)
      .filter((monthValue) => months.includes(monthValue));

    if (normalizedMonths.length === 0) {
      setPersonalContribution((prev) => ({
        ...prev,
        weeks: [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        ticket: 0,
        logwork: 0,
        member: 0,
        billable: 0,
        ee: "-",
        status: "-",
      }));
      setMonthTicketCount(0);
      setMonthLogworkPoint(0);
      setMonthRolesCount(0);
      setKpiTrendData([]);
      return;
    }

    setIsLoading(true);
    try {
      const { rows: personalRows, aggregateData } =
        await fetchPersonalRowsByMonths(normalizedMonths);

      if (personalRows.length === 0) {
        setPersonalContribution((prev) => ({ ...prev, ee: "-", status: "-" }));
        setMonthTicketCount(0);
        setMonthLogworkPoint(0);
        setMonthRolesCount(0);
        setKpiTrendData([]);
        return;
      }

      const monthGroupedRows = new Map<string, FormulaResultRow[]>();
      normalizedMonths.forEach((month) => monthGroupedRows.set(month, []));

      personalRows.forEach((row, index) => {
        const monthFromRow = normalizeMonthValue(
          row?.month ?? row?.month_no ?? row?.formula_month,
        );

        if (monthFromRow && monthGroupedRows.has(monthFromRow)) {
          monthGroupedRows.get(monthFromRow)!.push(row);
          return;
        }

        if (personalRows.length === normalizedMonths.length) {
          const fallbackMonth = normalizedMonths[index];
          if (fallbackMonth) {
            monthGroupedRows.get(fallbackMonth)!.push(row);
          }
        }
      });

      const trendRows = normalizedMonths
        .map((month) => {
          const rows = monthGroupedRows.get(month) ?? [];
          if (rows.length === 0) return null;

          const totalMemberPoint = rows.reduce(
            (sum, row) => sum + toNumber(row.member_contr_point, 0),
            0,
          );
          const averageMemberPoint = totalMemberPoint / rows.length;
          const year = rows[0]?.year
            ? String(rows[0].year)
            : String(new Date().getFullYear());

          return {
            date: `${month}/${year.slice(-2)}`,
            personal: averageMemberPoint,
            row: rows[rows.length - 1],
          };
        })
        .filter(Boolean) as Array<{
        date: string;
        personal: number;
        row: FormulaResultRow;
      }>;

      const latestRow =
        trendRows.length > 0
          ? trendRows[trendRows.length - 1].row
          : personalRows[personalRows.length - 1];

      const totalTicketPoint = personalRows.reduce(
        (sum, row) => sum + toNumber(row.ticket_point, 0),
        0,
      );
      const totalLogworkPoint = personalRows.reduce(
        (sum, row) => sum + toNumber(row.logwork_point, 0),
        0,
      );
      const totalMemberPoint = personalRows.reduce(
        (sum, row) => sum + toNumber(row.member_contr_point, 0),
        0,
      );
      const totalBillablePoint = personalRows.reduce(
        (sum, row) => sum + toNumber(row.billable_point, 0),
        0,
      );

      const normalizedTotalTicketPoint =
        aggregateData.total_ticket_point ?? totalTicketPoint;
      const normalizedTotalLogworkPoint =
        aggregateData.total_logwork_point ?? totalLogworkPoint;
      const normalizedTotalBillablePoint =
        aggregateData.total_billable_point ?? totalBillablePoint;
      const normalizedBillableStandard = aggregateData.billable_standard ?? 0;
      const normalizedLogworkStandard = aggregateData.logwork_standard ?? 0;

      const rowCount = personalRows.length;
      const avgTicketPoint =
        rowCount > 0 ? normalizedTotalTicketPoint / rowCount : 0;
      const avgLogworkPoint =
        rowCount > 0 ? normalizedTotalLogworkPoint / rowCount : 0;
      const avgMemberPoint = rowCount > 0 ? totalMemberPoint / rowCount : 0;
      const avgBillablePoint =
        aggregateData.average_billable_point ??
        (rowCount > 0 ? normalizedTotalBillablePoint / rowCount : 0);

      const roleBuckets: [number, number][] = [
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ];
      const uniqueRoleSet = new Set<string>();
      let monthTicketCountValue = 0;

      personalRows.forEach((row) => {
        monthTicketCountValue +=
          toNumber(row.task_count, 0) + toNumber(row.bug_count, 0);
        const ticketBreakdown = Array.isArray(row.ticket_breakdown)
          ? row.ticket_breakdown
          : [];

        ticketBreakdown.forEach((item: TicketBreakdownItem) => {
          const roleIndex = getRoleColumnIndex(item?.role);
          if (roleIndex < 0) return;

          roleBuckets[roleIndex] = [
            roleBuckets[roleIndex][0] +
              toNumber(item?.task_count ?? item?.taskCount ?? item?.task, 0),
            roleBuckets[roleIndex][1] +
              toNumber(item?.bug_count ?? item?.bugCount ?? item?.bug, 0),
          ];

          if (item?.role) {
            uniqueRoleSet.add(String(item.role));
          }
        });
      });

      const lastCalculatedLabel =
        normalizedMonths.length === 1
          ? `${normalizedMonths[0]}/${latestRow?.year ?? new Date().getFullYear()}`
          : `${normalizedMonths.length} months`;

      const kpiData: KPIData = {
        standardKPI: 8.5,
        currentKPI: avgBillablePoint,
        billableStandard: normalizedBillableStandard,
        logworkStandard: normalizedLogworkStandard,
        totalBillable: normalizedTotalBillablePoint,
        lastCalculated: lastCalculatedLabel,
        breakdown: {
          tickets: normalizedTotalTicketPoint,
          logwork: normalizedTotalLogworkPoint,
          quality: Math.max(
            avgBillablePoint -
              normalizedTotalTicketPoint -
              normalizedTotalLogworkPoint,
            0,
          ),
        },
      };

      setPersonalKPI(kpiData);
      setPersonalContribution({
        name:
          latestRow?.employee?.en_full_name ??
          latestRow?.employee?.vn_full_name ??
          user?.en_full_name ??
          user?.vn_full_name ??
          "You",
        weeks: roleBuckets,
        ticket: avgTicketPoint,
        logwork: avgLogworkPoint,
        member: avgMemberPoint,
        billable: avgBillablePoint,
        ee: latestRow?.member_performance?.total_ee
          ? String(latestRow.member_performance.total_ee)
          : "-",
        status: latestRow?.member_performance?.performance_level
          ? String(latestRow.member_performance.performance_level)
          : "-",
      });

      setMonthTicketCount(monthTicketCountValue);
      setMonthLogworkPoint(normalizedTotalLogworkPoint);
      setMonthRolesCount(uniqueRoleSet.size);

      if (trendRows.length > 0) {
        setKpiTrendData(
          trendRows.map((item) => ({
            date: item.date,
            personal: item.personal,
          })),
        );
      } else {
        const aggregatedYear = latestRow?.year
          ? String(latestRow.year).slice(-2)
          : String(new Date().getFullYear()).slice(-2);
        const dateLabel =
          normalizedMonths.length === 1
            ? `${normalizedMonths[0]}/${aggregatedYear}`
            : `${normalizedMonths[0]}-${normalizedMonths[normalizedMonths.length - 1]}/${aggregatedYear}`;

        setKpiTrendData([
          {
            date: dateLabel,
            personal: avgMemberPoint,
          },
        ]);
      }
    } catch (error) {
      toast.error("Failed to fetch dashboard data by month");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardByMonth(selectedMonths);
  }, [selectedMonths, userId]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-6 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Your KPI Dashboard
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Track your individual performance metrics
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
        <MainKPISection
          kpi={personalKPI}
          isLoading={isLoading}
          onRefresh={() => fetchDashboardByMonth(selectedMonths)}
          showTotal
        />

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
                    dataKey="personal"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personal Stat Cards */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Tickets This Month
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {monthTicketCount}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    From selected month
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="material-symbols-outlined text-blue-600 text-[32px]">
                    assignment
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Logwork Hours
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {monthLogworkPoint.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Logwork point</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <span className="material-symbols-outlined text-purple-600 text-[32px]">
                    schedule
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Code Reviews
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {monthRolesCount}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Roles in breakdown
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-600 text-[32px]">
                    done_all
                  </span>
                </div>
              </div>
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
                Your performance breakdown by week
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center">
                        {getInitials(personalContribution.name)}
                      </div>
                      <span className="font-medium text-slate-800 whitespace-nowrap">
                        {personalContribution.name}
                      </span>
                    </div>
                  </td>
                  {personalContribution.weeks.map(([task, bug], wi) => (
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
                    {personalContribution.ticket.toFixed(2)}
                  </td>
                  <td className="text-center px-4 py-3 font-semibold text-purple-600 border-r border-slate-100">
                    {personalContribution.logwork.toFixed(2)}
                  </td>
                  <td className="text-center px-4 py-3 font-bold text-primary border-r border-slate-100">
                    {personalContribution.member.toFixed(2)}
                  </td>
                  <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                    {personalContribution.billable.toFixed(2)}
                  </td>
                  <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">
                    {personalContribution.ee}
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className="text-slate-700">
                      {personalContribution.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

export default Dashboard;
