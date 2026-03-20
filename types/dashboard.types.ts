export interface KPIBreakdown {
  tickets: number;
  logwork: number;
  quality: number;
}

export interface KPIData {
  standardKPI: number;
  currentKPI: number;
  billableStandard: number;
  logworkStandard: number;
  totalBillable?: number;
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