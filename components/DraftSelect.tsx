import React from "react";

export interface DraftSelectOption {
  value: string;
  label: string;
  prefix?: string;
}

interface DraftSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  options: DraftSelectOption[];
  placeholder: string;
  activeColorClass: string;
  unsetColorClass?: string;
  maxWidth?: string;
  disabled?: boolean;
  resetAfterChange?: boolean;
  displayLabel?: string;
  isUnset?: boolean;
}
const DraftSelect: React.FC<DraftSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  activeColorClass,
  unsetColorClass = "border-amber-300 bg-amber-50 text-amber-600",
  maxWidth = "150px",
  disabled = false,
  resetAfterChange = false,
  displayLabel,
  isUnset,
}) => {
  const isEmpty = isUnset !== undefined ? isUnset : value === "" || value === 0;
  const colorClass = isEmpty ? unsetColorClass : activeColorClass;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
    if (resetAfterChange) {
      setTimeout(() => {
        e.target.value = "";
      }, 0);
    }
  };

  return (
    <div className="relative inline-block w-full" style={{ maxWidth }}>
      <select
        value={isEmpty || resetAfterChange ? "" : value}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold uppercase tracking-tight appearance-none outline-none cursor-pointer transition-all ${colorClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed`}
      >
        <option value="" disabled hidden>
          {displayLabel ?? placeholder}
        </option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.prefix ? `${opt.prefix} ${opt.label}` : opt.label}
          </option>
        ))}
      </select>

      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">
        expand_more
      </span>
    </div>
  );
};

export default DraftSelect;
