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
  const billableStandard = kpi.billableStandard ?? 0;
  const logworkStandard = kpi.logworkStandard ?? 0;

  const displayNumber = (value: number | undefined) =>
    value === undefined || value === null ? "0" : String(value);

  const getBreakdownProgressWidth = (value: number, standard: number) => {
    if (standard <= 0) return "0%";
    return `${Math.min((value / standard) * 100, 100)}%`;
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 p-8 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col min-h-[400px]">
          <div className="flex items-start justify-between mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                leaderboard
              </span>
              KPI Score
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-sm">
              <span className="material-symbols-outlined text-[13px] text-slate-400">
                history
              </span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {kpi.lastCalculated}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center w-full">
            <div className="flex items-center justify-center gap-10">
              <div className="flex flex-col items-center">
                {showTotal && (
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
                    Average
                  </span>
                )}
                <span className="text-7xl font-black leading-none text-primary">
                  {displayNumber(kpi.currentKPI)}
                </span>
              </div>

              {showTotal && (
                <div className="h-20 w-px bg-slate-200 rounded-full" />
              )}

              {showTotal && (
                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Total
                  </span>
                  <span className="text-5xl font-bold leading-none text-slate-700">
                    {displayNumber(kpi.totalBillable)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 flex justify-center w-full">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                isLoading
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-blue-600 hover:shadow-md active:scale-95"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] ${isLoading ? "animate-spin" : ""}`}
              >
                {isLoading ? "sync" : "refresh"}
              </span>
              {isLoading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 space-y-8">
          {/* Standards Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="material-symbols-outlined text-blue-600 text-xl block">
                    paid
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Billable Standard
                </p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {displayNumber(billableStandard)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <span className="material-symbols-outlined text-purple-600 text-xl block">
                    schedule
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Logwork Standard
                </p>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {displayNumber(logworkStandard)}
              </p>
            </div>
          </div>

          {/* Breakdown List */}
          {kpi.breakdown && (
            <div className="pt-4">
              <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="h-px w-4 bg-slate-300"></span> Performance
                Breakdown
              </h4>
              <div className="space-y-6">
                {/* Item 1 */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="material-symbols-outlined text-blue-500">
                        task_alt
                      </span>
                      Ticket Completion
                    </span>
                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {displayNumber(kpi.breakdown.tickets)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{
                        width: getBreakdownProgressWidth(
                          kpi.breakdown.tickets,
                          kpi.standardKPI,
                        ),
                      }}
                    />
                  </div>
                </div>

                {/* Item 2 */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className="material-symbols-outlined text-purple-500">
                        timer
                      </span>
                      Logwork Compliance
                    </span>
                    <span className="text-sm font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      {displayNumber(kpi.breakdown.logwork)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                      style={{
                        width: getBreakdownProgressWidth(
                          kpi.breakdown.logwork,
                          kpi.standardKPI,
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainKPISection;
