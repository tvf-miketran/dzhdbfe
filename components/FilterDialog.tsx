import React from 'react';

export interface FilterState {
  search: string;
  ticketTypeId: string;
  ticketStatusId: string;
  sortBy: string;
  sortOrder: string;
  weeks: number[];
  month: number;
}

interface FilterDialogProps {
  isOpen: boolean;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  isOpen,
  filters,
  onFilterChange,
  onReset,
}) => {
  if (!isOpen) return null;

  const handleWeekToggle = (week: number) => {
    const updatedWeeks = filters.weeks.includes(week)
      ? filters.weeks.filter(w => w !== week)
      : [...filters.weeks, week].sort((a, b) => a - b);
    onFilterChange({ ...filters, weeks: updatedWeeks });
  };

  return (
    <div className="px-6 py-4 border-b border-border-light bg-white space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search tickets..."
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        {/* Ticket Type */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Ticket Type
          </label>
          <select
            value={filters.ticketTypeId}
            onChange={(e) => onFilterChange({ ...filters, ticketTypeId: e.target.value })}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="feature">Feature</option>
            <option value="bug">Bug Fix</option>
            <option value="refactor">Refactor</option>
            <option value="hotfix">Hotfix</option>
            <option value="research">Research</option>
          </select>
        </div>

        {/* Ticket Status */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Status
          </label>
          <select
            value={filters.ticketStatusId}
            onChange={(e) => onFilterChange({ ...filters, ticketStatusId: e.target.value })}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="inqa">In QA</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Default</option>
            <option value="created_at">Created Date</option>
            <option value="updated_at">Updated Date</option>
            <option value="code">Ticket ID</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Order
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => onFilterChange({ ...filters, sortOrder: e.target.value })}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            <option value="">Default</option>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Month */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => onFilterChange({ ...filters, month: parseInt(e.target.value) })}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 appearance-none outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
          >
            {Array.from({ length: 13 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>
                {m === 0 ? 'All Months' : new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">
          Weeks
        </label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => i + 1).map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => handleWeekToggle(week)}
              className={`h-9 px-4 rounded-lg border text-sm font-semibold transition-all ${
                filters.weeks.includes(week)
                  ? 'bg-primary text-white border-primary'
                  : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Filters */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FilterDialog;
