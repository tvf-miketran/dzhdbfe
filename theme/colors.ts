// Design tokens — keep in sync with Tailwind config in index.html

export const token = {
  primary: "#0060ff",
  backgroundLight: "#ffffff",
  surfaceLight: "#ffffff",
  surfaceDark: "#f3f4f6",
  surfaceHover: "#eeeff2",
  borderLight: "#e5e7eb",
  borderDark: "#d1d5db",
} as const;

// Card
export const card = "rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden";
export const cardHeader = "px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-4 flex-wrap";
export const cardHeaderMuted = "px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap";

// Table
export const tableHead = "bg-slate-50 border-b border-slate-200";
export const th = "px-4 py-3 font-semibold text-slate-600 whitespace-nowrap text-sm";
export const thBordered = `${th} border-r border-slate-200`;
export const tableRow = "border-b border-slate-100 hover:bg-slate-50 transition-colors";
export const td = "px-4 py-3 text-slate-700 text-sm";
export const tdBordered = `${td} border-r border-slate-100`;

// Typography
export const heading = "text-slate-900 font-semibold text-lg";
export const subtitle = "text-slate-500 text-sm mt-0.5";
export const textPrimary = "text-[#0060ff]";

// Role badges
export const badgeDev = "bg-blue-50 text-blue-700 border border-blue-200";
export const badgeQA = "bg-emerald-50 text-emerald-700 border border-emerald-200";
export const badgeBA = "bg-purple-50 text-purple-700 border border-purple-200";
export const badgeDefault = "bg-slate-100 text-slate-600 border border-slate-200";

// Completion % colours
export const completionFull = "text-emerald-600 font-semibold";
export const completionHigh = "text-blue-600 font-semibold";
export const completionMid = "text-amber-600 font-semibold";
export const completionLow = "text-red-600 font-semibold";

// Inputs / dropdowns
export const input = "h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";
export const dropdownTrigger = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30 transition-colors flex items-center justify-between gap-3 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed";
export const dropdownMenu = "absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-72 overflow-y-auto custom-scrollbar";
export const dropdownItem = "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left";
export const dropdownItemActive = "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-primary bg-primary/5 font-medium transition-colors text-left";
