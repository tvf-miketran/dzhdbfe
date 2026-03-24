export interface KPIBreakdown {
  tickets: number;
  logwork: number;
  quality: number;
}

export interface KPIStandardParams {
  BILLABLE_PARAM?: string | number;
  STANDARD_BA?: string | number;
  STANDARD_DEV?: string | number;
  STANDARD_QA?: string | number;
  STANDARD_REVIEWER?: string | number;
}

export interface KPIData {
  standardKPI: number;
  currentKPI: number;
  billableStandard: number;
  logworkStandard: number;
  totalBillable?: number;
  averageEE?: number;
  params?: KPIStandardParams;
  lastCalculated?: string;
  breakdown?: KPIBreakdown;
}

export interface TrendData {
  date: string;
  odc: number;
}

export interface TeamData {
  role: string;
  count: number;
  kpi: number;
}

export interface ContributionRow {
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

export interface PersonalContributionRow {
  name: string;
  weeks: [number, number][];
  ticket: number;
  logwork: number;
  member: number;
  billable: number;
  ee: string;
  status: string;
}