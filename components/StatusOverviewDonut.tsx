import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface StatusItem {
  name: string;
  value: number;
  color: string;
}

const SEGMENT_CONFIG: Array<{
  key: "closed" | "inQA" | "open" | "others";
  label: string;
  color: string;
}> = [
  { key: "closed", label: "Closed", color: "#22c55e" },
  { key: "inQA", label: "In QA", color: "#8b5cf6" },
  { key: "open", label: "Open", color: "#f59e0b" },
  { key: "others", label: "Others", color: "#94a3b8" },
];

const StatusOverviewDonut: React.FC<{
  totals?: {
    total: number;
    closed: number;
    inQA: number;
    open: number;
  };
  isLoading?: boolean;
  error?: string | null;
}> = ({ totals, isLoading = false, error = null }) => {
  const safeTotal = totals?.total ?? 0;
  const safeClosed = totals?.closed ?? 0;
  const safeInQA = totals?.inQA ?? 0;
  const safeOpen = totals?.open ?? 0;
  const safeOthers = Math.max(safeTotal - safeClosed - safeInQA - safeOpen, 0);

  const data: StatusItem[] = useMemo(
    () =>
      SEGMENT_CONFIG.map(({ key, label, color }) => {
        const value =
          key === "closed"
            ? safeClosed
            : key === "inQA"
              ? safeInQA
              : key === "open"
                ? safeOpen
                : safeOthers;
        return { name: label, value, color };
      }).filter((item) => item.value > 0),
    [safeClosed, safeInQA, safeOpen, safeOthers],
  );

  return (
    <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6 h-full overflow-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Status Overview
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Get a snapshot of the status of your work items.
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center justify-center h-52">
          <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center h-52 gap-2">
          <span className="material-symbols-outlined text-red-400 text-3xl">
            error_outline
          </span>
          <p className="text-sm text-red-500 text-center">{error}</p>
        </div>
      )}

      {/* Empty state — only shown when totals was explicitly passed but all values are 0 */}
      {!isLoading && !error && totals !== undefined && safeTotal === 0 && (
        <div className="flex items-center justify-center h-52 text-sm text-slate-400">
          No ticket data available.
        </div>
      )}

      {/* Chart + Legend */}
      {!isLoading && !error && safeTotal > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart — center overlay shows total_tickets */}
          <div className="flex-shrink-0 w-full sm:w-56 min-w-0 relative">
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
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    `${value} tickets (${(((value as number) / safeTotal) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Absolutely-positioned center label — avoids SVG clipping issues */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 leading-none">
                {safeTotal.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase mt-1">
                Total Tickets
              </span>
            </div>
          </div>

          {/* Legend — Closed / In QA / Open / Others */}
          <div className="flex-1 w-full space-y-3 pr-1">
            {SEGMENT_CONFIG.map(({ key, label, color }) => {
              const value =
                key === "closed"
                  ? safeClosed
                  : key === "inQA"
                    ? safeInQA
                    : key === "open"
                      ? safeOpen
                      : safeOthers;
              const pct =
                safeTotal > 0 ? ((value / safeTotal) * 100).toFixed(1) : "0.0";
              return (
                <div key={key} className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-700 leading-tight">
                        {label}
                      </span>
                      <span className="text-sm font-bold text-slate-900 flex-shrink-0">
                        {value.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusOverviewDonut;
