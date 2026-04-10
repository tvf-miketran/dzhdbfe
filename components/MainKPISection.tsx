import React from "react";
import type { KPIData } from "../types/index";

export type MainKPIData = KPIData;

interface MainKPISectionProps {
  kpi: MainKPIData;
  isLoading: boolean;
  isKPILoading?: boolean;
  onRefresh: () => void;
  showTotal?: boolean;
  totalMembers?: number;
  hideParams?: boolean;
  reachKPICount?: number;
  notReachKPICount?: number;
}

const MainKPISection: React.FC<MainKPISectionProps> = ({
  kpi,
  isLoading,
  isKPILoading = false,
  onRefresh,
  showTotal = false,
  totalMembers,
  hideParams = false,
  reachKPICount,
  notReachKPICount,
}) => {
  const billableStandard = kpi.billableStandard ?? 0;
  const logworkStandard = kpi.logworkStandard ?? 0;
  const averageEE = kpi.averageEE;
  const memberTotalEE = kpi.memberTotalEE;

  const standardParamItems = [
    {
      key: "BILLABLE_PARAM",
      label: "Billable Param",
      value: kpi.params?.BILLABLE_PARAM,
    },
    {
      key: "STANDARD_BA",
      label: "Standard Ticket BA",
      value: kpi.params?.STANDARD_BA,
    },
    {
      key: "STANDARD_DEV",
      label: "Standard Ticket DEV",
      value: kpi.params?.STANDARD_DEV,
    },
    {
      key: "STANDARD_QA",
      label: "Standard Ticket QA",
      value: kpi.params?.STANDARD_QA,
    },
  ];

  const hasParamData = standardParamItems.some(
    (item) => item.value !== undefined && item.value !== null,
  );
  const hasExtendedStandardData = averageEE !== undefined || hasParamData;

  const displayNumber = (value: number | undefined) =>
    value === undefined || value === null ? "0" : String(value);

  const displayOptionalValue = (value: string | number | undefined) =>
    value === undefined || value === null || String(value).trim() === ""
      ? "-"
      : String(value);

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* INDIVIDUAL KPI  */}
        <div className="lg:col-span-5 p-10 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
          <div className="flex items-start justify-between mb-12">
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">
                leaderboard
              </span>
              Individual KPI
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[13px] text-slate-400">
                history
              </span>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {kpi.lastCalculated}
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center space-y-12">
            <div className="text-center group">
              <span className="block text-m font-black text-primary uppercase tracking-[0.3em] mb-2 opacity-70">
                {totalMembers !== undefined ? "TOTAL MEMBERS" : "AVERAGE SCORE"}
              </span>
              <span className="text-7xl font-black leading-none text-primary drop-shadow-md">
                {totalMembers !== undefined
                  ? String(totalMembers)
                  : displayNumber(kpi.currentKPI)}
              </span>
            </div>

            <div className="w-24 h-1 bg-slate-200 rounded-full" />

            {showTotal && (
              <div className="text-center group">
                <span className="block text-m font-black text-primary uppercase tracking-[0.3em] mb-2 opacity-70">
                  TOTAL BILLABLE
                </span>
                <span className="text-7xl font-black leading-none text-primary drop-shadow-md">
                  {displayNumber(kpi.totalBillable)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-12 flex justify-center w-full">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="w-full max-w-[300px] inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm bg-primary text-white hover:bg-blue-600 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isLoading ? "animate-spin" : ""}`}
              >
                {isLoading ? "sync" : "refresh"}
              </span>
              {isLoading ? "REFRESHING..." : "REFRESH DATA"}
            </button>
          </div>
        </div>

        {/* PARAMETERS & BREAKDOWN */}
        <div className="lg:col-span-7 p-8 space-y-10">
          {/* Grouped Parameters Section */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  tune
                </span>
                Standard Point
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Billable Standard */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
                <p className="text-[10px] font-black uppercase text-blue-600 mb-1">
                  Billable Standards (EE 100%)
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayNumber(billableStandard)}
                </p>
              </div>

              {/* Logwork Standard */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
                <p className="text-[10px] font-black uppercase text-purple-600 mb-1">
                  Logwork Standards (EE 100%)
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayNumber(logworkStandard)}
                </p>
              </div>

              {/* Average EE */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">
                  Average EE
                </p>
                <p className="text-2xl font-bold text-slate-800">
                  {memberTotalEE !== undefined
                    ? `${memberTotalEE}%`
                    : averageEE !== undefined
                      ? `${averageEE}%`
                      : "-"}
                </p>
              </div>

              {/* Reach KPI */}
              {reachKPICount !== undefined &&
                notReachKPICount !== undefined && (
                  <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-3">
                      KPI Achievement
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-emerald-700">
                          {reachKPICount}
                        </span>
                        <span className="text-xs text-slate-500">Reach</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm font-bold text-red-700">
                          {notReachKPICount}
                        </span>
                        <span className="text-xs text-slate-500">
                          Not Reach
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden flex">
                      {reachKPICount + notReachKPICount > 0 && (
                        <>
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500"
                            style={{
                              width: `${(reachKPICount / (reachKPICount + notReachKPICount)) * 100}%`,
                            }}
                          />
                          <div
                            className="h-full bg-red-500 transition-all duration-500"
                            style={{
                              width: `${(notReachKPICount / (reachKPICount + notReachKPICount)) * 100}%`,
                            }}
                          />
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {reachKPICount + notReachKPICount > 0
                        ? `${((reachKPICount / (reachKPICount + notReachKPICount)) * 100).toFixed(0)}% members reached KPI`
                        : "No data"}
                    </p>
                  </div>
                )}

              {!hideParams &&
                standardParamItems.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                      {item.label}
                    </p>
                    <p className="text-xl font-bold text-slate-700">
                      {displayOptionalValue(item.value)}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MainKPISection;
