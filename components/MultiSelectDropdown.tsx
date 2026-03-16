import React, { useEffect, useMemo, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectLabelContext {
  selectedValues: string[];
  selectedOptions: MultiSelectOption[];
  options: MultiSelectOption[];
  isAllSelected: boolean;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  showSelectAll?: boolean;
  selectAllLabel?: string;
  allSelectedLabel?: string;
  multiSelectedSuffix?: string;
  renderLabel?: (context: MultiSelectLabelContext) => string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select",
  disabled = false,
  label,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  showSelectAll = false,
  selectAllLabel = "Select all",
  allSelectedLabel = "All",
  multiSelectedSuffix = "items selected",
  renderLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedSelectedValues = useMemo(() => {
    const selectedSet = new Set(selectedValues);
    return options
      .filter((option) => selectedSet.has(option.value))
      .map((option) => option.value);
  }, [options, selectedValues]);

  const selectedOptions = useMemo(
    () =>
      options.filter((option) =>
        normalizedSelectedValues.includes(option.value),
      ),
    [options, normalizedSelectedValues],
  );

  const isAllSelected =
    options.length > 0 && normalizedSelectedValues.length === options.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  const handleToggleValue = (value: string) => {
    if (disabled) return;

    const isSelected = normalizedSelectedValues.includes(value);
    const nextValues = isSelected
      ? normalizedSelectedValues.filter(
          (selectedValue) => selectedValue !== value,
        )
      : [...normalizedSelectedValues, value];

    const orderedValues = options
      .filter((option) => nextValues.includes(option.value))
      .map((option) => option.value);
    onChange(orderedValues);
  };

  const handleToggleAll = () => {
    if (disabled) return;
    if (isAllSelected) {
      onChange([]);
      return;
    }
    onChange(options.map((option) => option.value));
  };

  const defaultLabel = useMemo(() => {
    if (selectedOptions.length === 0) return placeholder;
    if (isAllSelected) return allSelectedLabel;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `${selectedOptions.length} ${multiSelectedSuffix}`;
  }, [
    allSelectedLabel,
    isAllSelected,
    multiSelectedSuffix,
    placeholder,
    selectedOptions,
  ]);

  const triggerLabel =
    renderLabel?.({
      selectedValues: normalizedSelectedValues,
      selectedOptions,
      options,
      isAllSelected,
    }) ?? defaultLabel;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-600">{label}</label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={`h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-between gap-3 ${buttonClassName}`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="material-symbols-outlined text-[18px] text-slate-500">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-72 overflow-y-auto custom-scrollbar ${menuClassName}`}
        >
          {showSelectAll && (
            <button
              type="button"
              onClick={handleToggleAll}
              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-3"
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                readOnly
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30 pointer-events-none"
              />
              <span className="font-medium">{selectAllLabel}</span>
            </button>
          )}

          {options.map((option) => {
            const isChecked = normalizedSelectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleToggleValue(option.value)}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30 pointer-events-none"
                />
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
