import React, { useRef } from "react";

interface DateInputProps {
  /** Current value in YYYY-MM-DD format */
  value: string;
  /** Called with YYYY-MM-DD when changed, or "" when cleared */
  onChange: (value: string) => void;
  className?: string;
}

/** YYYY-MM-DD → DD/MM/YYYY for display */
const isoToDisplay = (iso: string): string => {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className,
}) => {
  const nativeRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value); // already YYYY-MM-DD from native picker
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div
      className="relative cursor-pointer"
      onClick={() => nativeRef.current?.showPicker?.()}
    >
      {/* Visible display layer */}
      <div
        className={`${className} flex items-center pointer-events-none select-none`}
      >
        {value ? (
          <span>{isoToDisplay(value)}</span>
        ) : (
          <span className="text-slate-400">DD/MM/YYYY</span>
        )}
      </div>

      {/* Native date input — invisible but functional, positioned over the display */}
      <input
        ref={nativeRef}
        type="date"
        value={value}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        tabIndex={-1}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-600"
          aria-label="Clear date"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}

      {/* Calendar icon */}
      {!value && (
        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
          calendar_today
        </span>
      )}
    </div>
  );
};

export default DateInput;
