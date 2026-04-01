import type { BaseApiResponse } from "../types/index";

export interface FormulaResultRow {
  billable_point?: number;
  bug_count?: number;
  employee?: {
    id?: string;
    en_full_name?: string;
    vn_full_name?: string;
    email?: string;
    employee_id?: string;
  };
  employee_id?: string;
  logwork_point?: number;
  member_contr_point?: number;
  member_performance?: {
    performance_level?: string;
    total_ee?: number;
  };
  month?: number;
  month_no?: number;
  formula_month?: number;
  task_count?: number;
  ticket_breakdown?: Array<{
    bug_count?: number;
    role?: string;
    role_weight?: number;
    standard?: number;
    task_count?: number;
    value?: number;
  }>;
  ticket_point?: number;
  total_team_points?: number;
  year?: number;
}

export interface FormulaAggregateData {
  total_billable_point?: number;
  total_current_member?: number;
  total_ticket_point?: number;
  total_logwork_point?: number;
  average_billable_point?: number;
  average_ee?: number;
  billable_standard?: number;
  logwork_standard?: number;
  params?: {
    BILLABLE_PARAM?: string;
    STANDARD_BA?: string;
    STANDARD_DEV?: string;
    STANDARD_QA?: string;
    STANDARD_REVIEWER?: string;
  };
}

export interface FormulaResponseData extends FormulaAggregateData {
  results?: FormulaResultRow[];
  kpi?: Record<string, unknown>;
  data?: unknown;
  items?: unknown[];
}

export type FormulaApiResponse = BaseApiResponse<FormulaResponseData>;

const toOptionalNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : undefined;
};

const isKpiCandidatePayload = (value: any): boolean => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const hasKpiValue = [
    value.standardKPI,
    value.standard_kpi,
    value.currentKPI,
    value.current_kpi,
    value.kpi,
  ].some((item) => item !== undefined && item !== null);

  const breakdown = value.breakdown ?? value.kpiBreakdown;
  const hasBreakdown =
    breakdown && typeof breakdown === "object" && !Array.isArray(breakdown);

  return Boolean(hasKpiValue || hasBreakdown);
};

export const extractFormulaRowsFromResponse = (
  root: any,
): FormulaResultRow[] => {
  const response = root as FormulaApiResponse;

  const sources = [
    response?.data?.results,
    root?.results,
    response?.data?.data,
    response?.data?.items,
    root?.result,
    root?.payload,
  ];

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source.filter(Boolean);
    }
  }

  return [];
};

export const extractFormulaCandidateFromResponse = (root: any) => {
  const response = root as FormulaApiResponse;

  const sources = [
    response?.data?.kpi,
    response?.data,
    root?.result,
    root?.payload,
    root,
  ];

  for (const source of sources) {
    if (isKpiCandidatePayload(source)) {
      return source;
    }
  }

  return null;
};

export const extractFormulaAggregateFromResponse = (
  root: any,
): FormulaAggregateData => {
  const response = root as FormulaApiResponse;
  const data = response?.data ?? root;
  const rawParams = data?.params;

  const paramsSource =
    rawParams && typeof rawParams === "object" && !Array.isArray(rawParams)
      ? rawParams
      : undefined;

  return {
    total_billable_point: toOptionalNumber(data?.total_billable_point),
    total_current_member: toOptionalNumber(data?.total_current_member),
    total_ticket_point: toOptionalNumber(data?.total_ticket_point),
    total_logwork_point: toOptionalNumber(data?.total_logwork_point),
    average_billable_point: toOptionalNumber(data?.average_billable_point),
    average_ee: toOptionalNumber(data?.average_ee),
    billable_standard: toOptionalNumber(data?.billable_standard),
    logwork_standard: toOptionalNumber(data?.logwork_standard),
    params: paramsSource
      ? {
          BILLABLE_PARAM: toOptionalString(paramsSource?.BILLABLE_PARAM),
          STANDARD_BA: toOptionalString(paramsSource?.STANDARD_BA),
          STANDARD_DEV: toOptionalString(paramsSource?.STANDARD_DEV),
          STANDARD_QA: toOptionalString(paramsSource?.STANDARD_QA),
          STANDARD_REVIEWER: toOptionalString(paramsSource?.STANDARD_REVIEWER),
        }
      : undefined,
  };
};
