import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  ClosedByRoleChart,
  TotalTrendItem,
} from "../services/formulas.service";

const ROLE_CONFIG: Array<{
  key: keyof Omit<ClosedByRoleChart, "months">;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: "developers", label: "Developer", icon: "code", color: "#3b82f6" },
  { key: "ba", label: "BA", icon: "business_center", color: "#60a5fa" },
  { key: "eqa", label: "EQA", icon: "verified", color: "#93c5fd" },
  { key: "iqa", label: "IQA", icon: "fact_check", color: "#bfdbfe" },
];

interface RoleBarTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

const MONTH_NAMES = [
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

const formatMonthLabel = (monthNum: number): string => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const year = monthNum <= currentMonth ? currentYear : currentYear - 1;
  return `${MONTH_NAMES[monthNum - 1]}/${String(year).slice(-2)}`;
};

const RoleBarTick: React.FC<RoleBarTickProps> = ({ x = 0, y = 0, payload }) => {
  if (!payload) return null;
  const role = ROLE_CONFIG.find((r) => r.label === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fill="#475569"
        style={{
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "Geist, sans-serif",
        }}
      >
        {payload.value}
      </text>
      {role && (
        <text
          x={0}
          y={0}
          dy={36}
          textAnchor="middle"
          fill={role.color}
          style={{
            fontSize: 20,
            fontFamily: "Material Symbols Outlined",
            fontVariationSettings: "'FILL' 0, 'wght' 300",
          }}
        >
          {role.icon}
        </text>
      )}
    </g>
  );
};

const TicketConsumptionDashboard: React.FC<{
  closedByRole?: ClosedByRoleChart;
  totalTrend?: TotalTrendItem[];
  isLoading?: boolean;
}> = ({ closedByRole, totalTrend, isLoading = false }) => {
  const barData = useMemo(
    () =>
      ROLE_CONFIG.map(({ key, label, color }) => ({
        role: label,
        count: closedByRole?.[key] ?? 0,
        color,
      })),
    [closedByRole],
  );

  const trendData = useMemo(
    () =>
      (totalTrend ?? []).map((d) => ({
        month: formatMonthLabel(d.month),
        total: d.total_closed,
      })),
    [totalTrend],
  );

  const hasData =
    closedByRole !== undefined || (totalTrend && totalTrend.length > 0);

  return (
    <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6 h-full overflow-hidden min-w-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Closed Tickets by Role
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Ticket consumption breakdown across roles
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-56">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
        </div>
      )}

      {!isLoading && !hasData && (
        <div className="flex items-center justify-center h-56 text-sm text-slate-400">
          No ticket data available.
        </div>
      )}

      {!isLoading && hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="min-w-0 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              By Role
            </p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart
                data={barData}
                margin={{ top: 5, right: 8, left: -16, bottom: 48 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="role"
                  tick={<RoleBarTick />}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  height={58}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} tickets`, "Closed"]}
                />
                <Bar
                  dataKey="count"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="min-w-0 overflow-hidden">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Total Trend
            </p>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 8, left: -16, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} tickets`, "Total Closed"]}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#fb923c"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "#fb923c",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6, fill: "#fb923c" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketConsumptionDashboard;
