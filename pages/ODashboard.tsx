import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axiosInstance from '../helpers/axios';

interface KPIData {
  standardKPI: number;
  currentKPI: number;
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

const DEFAULT_KPI: KPIData = {
  standardKPI: 8.5,
  currentKPI: 8.1,
  lastCalculated: '1 hour ago',
  breakdown: {
    tickets: 3.2,
    logwork: 2.1,
    quality: 2.8,
  },
};

const DEFAULT_KPI_TREND_DATA: TrendData[] = [
  { date: 'Jan', odc: 7.8 },
  { date: 'Feb', odc: 7.9 },
  { date: 'Mar', odc: 8.1 },
  { date: 'Apr', odc: 8.0 },
  { date: 'May', odc: 8.2 },
  { date: 'Jun', odc: 8.1 },
];

const DEFAULT_TEAM_DATA: TeamData[] = [
  { role: 'Developer', count: 12, kpi: 8.2 },
  { role: 'QA', count: 8, kpi: 8.0 },
  { role: 'BA', count: 5, kpi: 8.4 },
  { role: 'DevOps', count: 3, kpi: 7.9 },
];

const DEFAULT_CONTRIBUTION_ROWS: ContributionRow[] = [
  { name: 'Alex Morgan', avatar: 'alex', weight: '1.0', weeks: [[5, 1], [6, 0], [4, 2], [7, 1], [5, 0]], ticket: 3.5, logwork: 2.0, member: 7.8, billable: 0, ee: '-', status: '-' },
  { name: 'Sarah Johnson', avatar: 'sarah', weight: '0.9', weeks: [[4, 0], [5, 1], [6, 0], [5, 2], [4, 1]], ticket: 3.2, logwork: 2.1, member: 7.5, billable: 0, ee: '-', status: '-' },
  { name: 'Mike Chen', avatar: 'mike', weight: '1.0', weeks: [[7, 0], [6, 1], [7, 0], [8, 0], [6, 1]], ticket: 3.8, logwork: 2.2, member: 8.2, billable: 0, ee: '-', status: '-' },
  { name: 'Emily Davis', avatar: 'emily', weight: '0.8', weeks: [[3, 2], [4, 1], [3, 0], [4, 1], [3, 2]], ticket: 2.9, logwork: 1.8, member: 7.1, billable: 0, ee: '-', status: '-' },
  { name: 'Tom Wilson', avatar: 'tom', weight: '1.0', weeks: [[6, 0], [5, 0], [7, 1], [6, 0], [7, 0]], ticket: 3.6, logwork: 2.3, member: 8.4, billable: 0, ee: '-', status: '-' },
];

const getCurrentMonth = (): string => String(new Date().getMonth() + 1).padStart(2, '0');
const monthOptions = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));

const toNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getInitials = (fullName: string): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getRoleColumnIndex = (roleValue: unknown): number => {
  const normalizedRole = String(roleValue ?? '')
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, '');

  if (normalizedRole === 'BA') return 0;
  if (normalizedRole === 'QAINTERNAL' || normalizedRole === 'IQA') return 1;
  if (normalizedRole === 'QASTANDALONE' || normalizedRole === 'EQA') return 2;
  if (normalizedRole === 'DEV' || normalizedRole === 'DEVELOPER') return 3;
  if (normalizedRole === 'REVIEWER' || normalizedRole === 'REVIEW') return 4;

  return -1;
};

const buildFromMemberRows = (rows: any[], selectedMonth: string) => {
  const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (safeRows.length === 0) {
    return {
      kpi: DEFAULT_KPI,
      trend: DEFAULT_KPI_TREND_DATA,
      team: DEFAULT_TEAM_DATA,
      contribution: [] as ContributionRow[],
    };
  }

  const totalMember = safeRows.reduce((sum, row) => sum + toNumber(row.member_contr_point, 0), 0);
  const totalTicket = safeRows.reduce((sum, row) => sum + toNumber(row.ticket_point, 0), 0);
  const totalLogwork = safeRows.reduce((sum, row) => sum + toNumber(row.logwork_point, 0), 0);
  const count = safeRows.length;

  const totalTeamPoints = toNumber(safeRows[0]?.total_team_points, totalMember);
  const avgMember = count > 0 ? totalMember / count : 0;
  const avgTicket = count > 0 ? totalTicket / count : 0;
  const avgLogwork = count > 0 ? totalLogwork / count : 0;
  const year = safeRows[0]?.year ? String(safeRows[0].year) : new Date().getFullYear().toString();

  const contribution: ContributionRow[] = safeRows.map((row, index) => {
    const breakdown = Array.isArray(row.ticket_breakdown) ? row.ticket_breakdown : [];
    const firstWeight = breakdown.length > 0 ? toNumber(breakdown[0]?.role_weight, 1) : 1;
    const memberPoint = toNumber(row.member_contr_point, 0);
    const eeValue = row.ee ?? row.employee?.ee;
    const statusValue = row.status ?? row.employee?.status;

    const roleBuckets: [number, number][] = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    breakdown.forEach((item: any) => {
      const roleIndex = getRoleColumnIndex(item?.role);
      if (roleIndex < 0) return;

      roleBuckets[roleIndex] = [
        roleBuckets[roleIndex][0] + toNumber(item?.task_count ?? item?.taskCount ?? item?.task, 0),
        roleBuckets[roleIndex][1] + toNumber(item?.bug_count ?? item?.bugCount ?? item?.bug, 0),
      ];
    });

    return {
      name: row.employee?.en_full_name ?? row.employee?.vn_full_name ?? `Member ${index + 1}`,
      avatar: row.employee?.id ?? row.employee_id ?? `member-${index + 1}`,
      weight: firstWeight.toFixed(1),
      weeks: roleBuckets,
      ticket: toNumber(row.ticket_point, 0),
      logwork: toNumber(row.logwork_point, 0),
      member: memberPoint,
      billable: toNumber(row.billable_point, 0),
      ee: eeValue !== undefined && eeValue !== null && String(eeValue).trim() !== '' ? String(eeValue) : '-',
      status: statusValue !== undefined && statusValue !== null && String(statusValue).trim() !== '' ? String(statusValue) : '-',
    };
  });

  contribution.sort((a, b) => b.member - a.member);

  const roleMap = new Map<string, { members: Set<string>; totalMemberPoint: number }>();
  safeRows.forEach((row, rowIndex) => {
    const memberKey = row.employee_id ?? row.employee?.id ?? String(rowIndex);
    const memberPoint = toNumber(row.member_contr_point, 0);
    const breakdown = Array.isArray(row.ticket_breakdown) ? row.ticket_breakdown : [];
    const roles = Array.from(new Set(breakdown.map((item: any) => item?.role).filter(Boolean)));

    roles.forEach((role) => {
      const roleKey = String(role);
      if (!roleMap.has(roleKey)) {
        roleMap.set(roleKey, { members: new Set<string>(), totalMemberPoint: 0 });
      }
      const roleItem = roleMap.get(roleKey)!;
      if (!roleItem.members.has(memberKey)) {
        roleItem.members.add(memberKey);
        roleItem.totalMemberPoint += memberPoint;
      }
    });
  });

  const team: TeamData[] = Array.from(roleMap.entries()).map(([role, value]) => {
    const contributorCount = value.members.size;
    return {
      role,
      count: contributorCount,
      kpi: contributorCount > 0 ? value.totalMemberPoint / contributorCount : 0,
    };
  });

  const kpi: KPIData = {
    standardKPI: DEFAULT_KPI.standardKPI,
    currentKPI: avgMember,
    lastCalculated: `${selectedMonth}/${year}`,
    breakdown: {
      tickets: avgTicket,
      logwork: avgLogwork,
      quality: Math.max(avgMember - avgTicket - avgLogwork, 0),
    },
  };

  const trend: TrendData[] = [
    {
      date: `${selectedMonth}/${year.slice(-2)}`,
      odc: avgMember,
    },
  ];

  return {
    kpi,
    trend,
    team: team.length > 0 ? team : DEFAULT_TEAM_DATA,
    contribution,
  };
};

const ODashboard: React.FC = () => {
  useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(false);
  
  const [odcKPI, setOdcKPI] = useState<KPIData>(DEFAULT_KPI);
  const [kpiTrendData, setKpiTrendData] = useState<TrendData[]>(DEFAULT_KPI_TREND_DATA);
  const [teamData, setTeamData] = useState<TeamData[]>(DEFAULT_TEAM_DATA);
  const [contributionRows, setContributionRows] = useState<ContributionRow[]>(DEFAULT_CONTRIBUTION_ROWS);

  const fetchDashboardByMonth = async (month: string) => {
    setIsLoading(true);
    try {
      const monthAsNumber = String(parseInt(month, 10));
      const monthCandidates = monthAsNumber === month ? [month] : [month, monthAsNumber];

      let mapped = false;
      for (const monthValue of monthCandidates) {
        const response = await axiosInstance.get(`/formulas/calculate?month=${monthValue}`);
        const root = response?.data ?? {};
        const rows = root?.data;

        if (Array.isArray(rows)) {
          const next = buildFromMemberRows(rows, month);
          setOdcKPI(next.kpi);
          setKpiTrendData(next.trend);
          setTeamData(next.team);
          setContributionRows(next.contribution);
          mapped = true;
          break;
        }

        const candidate = root?.data ?? root?.result ?? root?.payload ?? root;
        if (candidate && typeof candidate === 'object') {
          const breakdown = candidate.breakdown ?? candidate.kpiBreakdown ?? {};
          const nextKPI: KPIData = {
            standardKPI: toNumber(candidate.standardKPI ?? candidate.standard_kpi, DEFAULT_KPI.standardKPI),
            currentKPI: toNumber(candidate.currentKPI ?? candidate.current_kpi ?? candidate.kpi, DEFAULT_KPI.currentKPI),
            lastCalculated: candidate.lastCalculated ?? candidate.last_calculated ?? 'just now',
            breakdown: {
              tickets: toNumber(breakdown.tickets ?? breakdown.ticket ?? candidate.tickets, DEFAULT_KPI.breakdown?.tickets ?? 0),
              logwork: toNumber(breakdown.logwork ?? breakdown.logWork ?? candidate.logwork, DEFAULT_KPI.breakdown?.logwork ?? 0),
              quality: toNumber(breakdown.quality ?? candidate.quality, DEFAULT_KPI.breakdown?.quality ?? 0),
            },
          };
          setOdcKPI(nextKPI);
          mapped = true;
        }
      }

      if (!mapped) {
        setContributionRows([]);
      }

    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không lấy được dữ liệu ODashboard theo tháng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardByMonth(selectedMonth);
  }, [selectedMonth]);

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
              <label htmlFor="odc-month" className="text-sm font-medium text-slate-600">Month</label>
              <select
                id="odc-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isLoading}
                className="h-10 min-w-[92px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main KPI Section */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Left: KPI Scores */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">KPI Score</p>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold text-primary">
                      {odcKPI.currentKPI.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold text-slate-500">/ {odcKPI.standardKPI.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-sm text-emerald-600">trending_up</span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Math.abs(odcKPI.currentKPI - odcKPI.standardKPI).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">↑ vs Standard</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-6">Last calculated: <span className="font-medium text-slate-600">{odcKPI.lastCalculated}</span></p>

                {/* KPI Breakdown */}
                {odcKPI.breakdown && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Breakdown</p>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-500">assignment_turned_in</span>
                            Ticket Completion
                          </span>
                          <span className="text-sm font-bold text-blue-600">{odcKPI.breakdown.tickets.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.tickets / odcKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-purple-500">schedule</span>
                            Logwork Compliance
                          </span>
                          <span className="text-sm font-bold text-purple-600">{odcKPI.breakdown.logwork.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.logwork / odcKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">code</span>
                            Code Quality
                          </span>
                          <span className="text-sm font-bold text-emerald-600">{odcKPI.breakdown.quality.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.quality / odcKPI.standardKPI) * 100, 100)}%` }}
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
                  onClick={() => fetchDashboardByMonth(selectedMonth)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 hover:shadow-xl hover:shadow-primary/30'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>
                    calculate
                  </span>
                  {isLoading ? 'Loading...' : 'Refresh Data'}
                </button>
              </div>
            </div>

            {/* Right: KPI Score Gauge */}
            <div className="flex items-center justify-center">
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
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* KPI Trend Chart */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">KPI Trend</h3>
              <p className="text-sm text-slate-600 mt-1">Monthly progress</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={kpiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    formatter={(value) => (value as number).toFixed(1)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="odc" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
              <p className="text-sm text-slate-600 mt-1">By role</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="role" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} yAxisId="left" />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Team Size" />
                  <Bar yAxisId="right" dataKey="kpi" fill="#8b5cf6" name="Avg KPI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* KPI Contribution Table */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">KPI Contribution Detail</h3>
              <p className="text-sm text-slate-500 mt-0.5">Team performance breakdown by week</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th colSpan={1} className="text-left px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">DATA THÁNG {selectedMonth}</th>
                  <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">BA = 0,4</th>
                  <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">QA Internal = 0,6</th>
                  <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">QA Stand Alone = 0,8</th>
                  <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">DEV = 1</th>
                  <th colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200">Reviewer = 0,2</th>
                  <th colSpan={6} className="px-4 py-2"></th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  {[1, 2, 3, 4, 5].map((w) => (
                    <React.Fragment key={w}>
                      <th className="text-center px-3 py-2 font-medium text-slate-700 whitespace-nowrap border-r border-slate-100">1</th>
                      <th className="text-center px-3 py-2 font-medium text-slate-700 whitespace-nowrap border-r border-slate-200">0.5</th>
                    </React.Fragment>
                  ))}
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  <th className="px-4 py-2 border-r border-slate-200"></th>
                  <th className="px-4 py-2"></th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Member's Name</th>
                  {[1, 2, 3, 4, 5].map((w) => (
                    <React.Fragment key={`header-${w}`}>
                      <th className="text-center px-3 py-2 font-medium text-blue-600 whitespace-nowrap border-r border-slate-100 text-xs">Task</th>
                      <th className="text-center px-3 py-2 font-medium text-red-500 whitespace-nowrap border-r border-slate-200 text-xs">Bug</th>
                    </React.Fragment>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Ticket Contribution Point</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">LogWork Contr. Point</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Member Contr. Point</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Billable</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">EE</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {contributionRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-[10px] font-semibold flex items-center justify-center">
                          {getInitials(row.name)}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{row.name}</span>
                      </div>
                    </td>
                    {row.weeks.map(([task, bug], wi) => (
                      <React.Fragment key={`week-${wi}`}>
                        <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">{task}</td>
                        <td className={`text-center px-3 py-3 border-r border-slate-200 ${bug > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{bug}</td>
                      </React.Fragment>
                    ))}
                    <td className="text-center px-4 py-3 font-semibold text-blue-600 border-r border-slate-100">{row.ticket.toFixed(2)}</td>
                    <td className="text-center px-4 py-3 font-semibold text-purple-600 border-r border-slate-100">{row.logwork.toFixed(2)}</td>
                    <td className={`text-center px-4 py-3 font-bold border-r border-slate-100 ${row.member >= 8 ? 'text-emerald-600' : row.member >= 7.5 ? 'text-blue-600' : 'text-amber-600'}`}>{row.member.toFixed(2)}</td>
                    <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">{row.billable.toFixed(2)}</td>
                    <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">{row.ee}</td>
                    <td className="text-center px-4 py-3">
                      <span className="text-slate-700">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">description</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Tickets</p>
                <p className="text-xs text-slate-600">Add new tickets</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Hours</p>
                <p className="text-xs text-slate-600">Log work hours</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">trending_up</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">View Reports</p>
                <p className="text-xs text-slate-600">Detailed analytics</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">help</span>
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
