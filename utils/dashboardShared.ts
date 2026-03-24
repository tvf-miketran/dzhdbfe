import type { KPIData } from "../types";

export interface MonthOption {
  value: string;
  label: string;
}

export const getCurrentMonth = (): string =>
  String(new Date().getMonth() + 1).padStart(2, "0");

export const buildRecentMonthOptions = (
  monthsBeforeCurrent = 5,
): MonthOption[] => {
  const currentMonthNumber = new Date().getMonth() + 1;

  return Array.from({ length: monthsBeforeCurrent + 1 }, (_, index) => {
    const monthNumber =
      ((currentMonthNumber - monthsBeforeCurrent + index - 1 + 12 * 10) % 12) +
      1;
    const monthValue = String(monthNumber).padStart(2, "0");

    return {
      value: monthValue,
      label: monthValue,
    };
  });
};

export const toNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const normalizeMonthValue = (value: unknown): string | null => {
  const monthNumber = Number(value);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }
  return String(monthNumber).padStart(2, "0");
};

export const buildMonthRequestCandidates = (months: string[]): string[] => {
  const withLeadingZero = months.join(",");
  const asNumbers = months
    .map((month) => String(parseInt(month, 10)))
    .join(",");

  return Array.from(new Set([withLeadingZero, asNumbers])).filter(Boolean);
};

export const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getRoleColumnIndex = (roleValue: unknown): number => {
  const normalizedRole = String(roleValue ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_\s-]+/g, "");

  if (normalizedRole === "BA") return 0;
  if (normalizedRole === "QAINTERNAL" || normalizedRole === "IQA") return 1;
  if (normalizedRole === "QASTANDALONE" || normalizedRole === "EQA") return 2;
  if (normalizedRole === "DEV" || normalizedRole === "DEVELOPER") return 3;
  if (normalizedRole === "REVIEWER" || normalizedRole === "REVIEW") return 4;

  return -1;
};

export const normalizeKPIStandardParams = (
  params: unknown,
): KPIData["params"] | undefined => {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return undefined;
  }

  const source = params as Record<string, unknown>;
  const selected: KPIData["params"] = {
    BILLABLE_PARAM:
      source.BILLABLE_PARAM !== undefined && source.BILLABLE_PARAM !== null
        ? String(source.BILLABLE_PARAM)
        : undefined,
    STANDARD_BA:
      source.STANDARD_BA !== undefined && source.STANDARD_BA !== null
        ? String(source.STANDARD_BA)
        : undefined,
    STANDARD_DEV:
      source.STANDARD_DEV !== undefined && source.STANDARD_DEV !== null
        ? String(source.STANDARD_DEV)
        : undefined,
    STANDARD_QA:
      source.STANDARD_QA !== undefined && source.STANDARD_QA !== null
        ? String(source.STANDARD_QA)
        : undefined,
    STANDARD_REVIEWER:
      source.STANDARD_REVIEWER !== undefined && source.STANDARD_REVIEWER !== null
        ? String(source.STANDARD_REVIEWER)
        : undefined,
  };

  const hasAnyParam = Object.values(selected).some(
    (value) => value !== undefined && String(value).trim() !== "",
  );

  return hasAnyParam ? selected : undefined;
};