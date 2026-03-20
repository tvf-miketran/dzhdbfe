import React, { useId } from "react";
import type { KPIData } from "../types/index";

export type MainKPIData = KPIData;

interface MainKPISectionProps {
  kpi: MainKPIData;
  isLoading: boolean;
  isKPILoading?: boolean;
  onRefresh: () => void;
  showTotal?: boolean;
}

const MainKPISection: React.FC<MainKPISectionProps> = ({
  kpi,
  isLoading,
  isKPILoading = false,
  onRefresh,
  showTotal = false,
}) => {
  const gradientId = useId();
  const progressValue = Math.min(Math.max((kpi.currentKPI / 10) * 100, 0), 100);
  const billableStandard = kpi.billableStandard ?? 0;
  const logworkStandard = kpi.logworkStandard ?? 0;
  const displayNumber = (value: number | undefined) =>
    value === undefined || value === null ? "0" : String(value);
  const getBreakdownProgressWidth = (value: number, standard: number) => {
    if (standard <= 0) {
      return "0%";
    }

    return `${Math.min((value / standard) * 100, 100)}%`;
  };

  return (
    <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">
              KPI Score
            </p>
            <div className="flex items-center justify-between mb-8">
              {showTotal ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-500 font-semibold mb-1">
                      Total
                    </span>
                    <span className="text-4xl font-bold text-slate-700 leading-none">
                      {displayNumber(kpi.totalBillable)}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-slate-300 mx-1"></div>

                  <div className="flex flex-col items-start">
                    <span className="text-xs text-slate-500 font-semibold mb-1">
                      Average
                    </span>
                    <span className="text-6xl font-bold text-primary leading-none">
                      {displayNumber(kpi.currentKPI)}
                    </span>
                  </div>

                  <span className="text-lg font-semibold text-slate-500 self-end mb-1">
                    / {displayNumber(kpi.standardKPI)}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-primary">
                    {displayNumber(kpi.currentKPI)}
                  </span>
                  <span className="text-lg font-semibold text-slate-500">
                    / {displayNumber(kpi.standardKPI)}
                  </span>
                </div>
              )}

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="material-symbols-outlined text-sm text-emerald-600">
                    trending_up
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    {displayNumber(Math.abs(kpi.currentKPI - kpi.standardKPI))}
                  </span>
                </div>
                <p className="text-xs text-slate-500">↑ vs Standard</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Last calculated:{" "}
              <span className="font-medium text-slate-600">
                {kpi.lastCalculated}
              </span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-blue-600 text-base">
                    paid
                  </span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Billable Standard
                  </p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {displayNumber(billableStandard)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-purple-600 text-base">
                    schedule
                  </span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Logwork Standard
                  </p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {displayNumber(logworkStandard)}
                </p>
              </div>
            </div>

            {kpi.breakdown && (
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
                        {displayNumber(kpi.breakdown.tickets)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                        style={{
                          width: getBreakdownProgressWidth(
                            kpi.breakdown.tickets,
                            kpi.standardKPI,
                          ),
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
                        {displayNumber(kpi.breakdown.logwork)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                        style={{
                          width: getBreakdownProgressWidth(
                            kpi.breakdown.logwork,
                            kpi.standardKPI,
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200">
            <button
              onClick={onRefresh}
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

        <div className="flex items-center justify-center">
          {isKPILoading ? (
            <div className="relative w-56 h-56 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full animate-pulse"></div>
          ) : (
            <div className="relative w-56 h-56">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="2.5"
                />

                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="2.5"
                  strokeDasharray={`${progressValue}, 100`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />

                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dy="0.3em"
                  fontSize="10"
                  fontWeight="700"
                  fill="#3b82f6"
                >
                  {displayNumber(kpi.currentKPI)}
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
                  of {displayNumber(kpi.standardKPI)}
                </text>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainKPISection;
