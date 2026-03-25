import React, { useState, useMemo } from "react";
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
  Cell,
} from "recharts";

type MonthRange = 3 | 6 | 9;
type RoleKey = "dev" | "ba" | "eqa" | "iqa";

interface MonthDataRow {
  month: string;
  dev: number;
  ba: number;
  eqa: number;
  iqa: number;
  total: number;
}

const ALL_MONTHLY_DATA: MonthDataRow[] = [
  { month: "Jul/25", dev: 45, ba: 12, eqa: 28, iqa: 18, total: 103 },
  { month: "Aug/25", dev: 52, ba: 15, eqa: 32, iqa: 22, total: 121 },
  { month: "Sep/25", dev: 38, ba: 10, eqa: 25, iqa: 16, total: 89 },
  { month: "Oct/25", dev: 61, ba: 18, eqa: 35, iqa: 24, total: 138 },
  { month: "Nov/25", dev: 48, ba: 14, eqa: 30, iqa: 20, total: 112 },
  { month: "Dec/25", dev: 55, ba: 16, eqa: 33, iqa: 21, total: 125 },
  { month: "Jan/26", dev: 42, ba: 11, eqa: 27, iqa: 17, total: 97 },
  { month: "Feb/26", dev: 58, ba: 17, eqa: 36, iqa: 23, total: 134 },
  { month: "Mar/26", dev: 50, ba: 15, eqa: 31, iqa: 20, total: 116 },
];

const ROLE_CONFIG: Array<{
  key: RoleKey;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: "dev", label: "Developer", icon: "code", color: "#3b82f6" },
  { key: "ba", label: "BA", icon: "business_center", color: "#60a5fa" },
  { key: "eqa", label: "EQA", icon: "verified", color: "#93c5fd" },
  { key: "iqa", label: "IQA", icon: "fact_check", color: "#bfdbfe" },
];

interface RoleBarTickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

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

const TicketConsumptionDashboard: React.FC = () => {
  const [monthRange, setMonthRange] = useState<MonthRange>(3);

  const filteredData = useMemo(
    () => ALL_MONTHLY_DATA.slice(-monthRange),
    [monthRange],
  );

  const barData = useMemo(
    () =>
      ROLE_CONFIG.map((role) => ({
        role: role.label,
        count: filteredData.reduce((sum, m) => sum + m[role.key], 0),
        color: role.color,
      })),
    [filteredData],
  );

  return (
    <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Closed Tickets by Role
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Ticket consumption breakdown across roles
          </p>
        </div>
        <select
          value={monthRange}
          onChange={(e) => setMonthRange(Number(e.target.value) as MonthRange)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={9}>Last 9 months</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Left: Bar Chart – by role */}
        <div>
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
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Line Chart – total trend */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Total Trend
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart
              data={filteredData}
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
                domain={["auto", "auto"]}
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
                dot={{ r: 4, fill: "#fb923c", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#fb923c" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TicketConsumptionDashboard;
