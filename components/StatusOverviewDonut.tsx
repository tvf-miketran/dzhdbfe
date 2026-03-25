import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

type PeriodKey = 1 | 3 | 6;

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

const MOCK_DATA_BY_PERIOD: Record<PeriodKey, StatusItem[]> = {
  1: [
    { name: "Closed", value: 145, color: "#22c55e" },
    { name: "In QA", value: 38, color: "#8b5cf6" },
    { name: "In Progress", value: 52, color: "#3b82f6" },
    { name: "In Review", value: 23, color: "#f59e0b" },
    { name: "Analysis Review", value: 17, color: "#06b6d4" },
    { name: "Waiting for Customer", value: 12, color: "#f97316" },
    { name: "Rejected", value: 8, color: "#ef4444" },
  ],
  3: [
    { name: "Closed", value: 387, color: "#22c55e" },
    { name: "In QA", value: 94, color: "#8b5cf6" },
    { name: "In Progress", value: 143, color: "#3b82f6" },
    { name: "In Review", value: 61, color: "#f59e0b" },
    { name: "Analysis Review", value: 42, color: "#06b6d4" },
    { name: "Waiting for Customer", value: 35, color: "#f97316" },
    { name: "Rejected", value: 21, color: "#ef4444" },
  ],
  6: [
    { name: "Closed", value: 723, color: "#22c55e" },
    { name: "In QA", value: 187, color: "#8b5cf6" },
    { name: "In Progress", value: 268, color: "#3b82f6" },
    { name: "In Review", value: 115, color: "#f59e0b" },
    { name: "Analysis Review", value: 79, color: "#06b6d4" },
    { name: "Waiting for Customer", value: 63, color: "#f97316" },
    { name: "Rejected", value: 42, color: "#ef4444" },
  ],
};

const StatusOverviewDonut: React.FC = () => {
  const [period, setPeriod] = useState<PeriodKey>(1);

  const data = MOCK_DATA_BY_PERIOD[period];
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data],
  );

  return (
    <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Status Overview
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Get a snapshot of the status of your work items.
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(Number(e.target.value) as PeriodKey)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value={1}>Last 1 month</option>
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
        </select>
      </div>

      {/* Chart + Legend */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="flex-shrink-0 w-full sm:w-56">
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={90}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`donut-cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  position="center"
                  content={(props) => {
                    const vb =
                      (props as { viewBox?: { cx?: number; cy?: number } })
                        .viewBox ?? {};
                    const cx = vb.cx ?? 0;
                    const cy = vb.cy ?? 0;
                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 8}
                          textAnchor="middle"
                          fill="#0f172a"
                          style={{
                            fontSize: 26,
                            fontWeight: 700,
                            fontFamily: "Geist, sans-serif",
                          }}
                        >
                          {total.toLocaleString()}
                        </text>
                        <text
                          x={cx}
                          y={cy + 14}
                          textAnchor="middle"
                          fill="#94a3b8"
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            fontFamily: "Geist, sans-serif",
                            letterSpacing: "0.06em",
                          }}
                        >
                          TOTAL ITEMS
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [
                  `${value} items (${(((value as number) / total) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Scrollable Legend */}
        <div className="flex-1 w-full max-h-52 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {data.map((item) => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.name} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-700 leading-tight">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{pct}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusOverviewDonut;
