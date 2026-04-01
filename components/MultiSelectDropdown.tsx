import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

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

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

const MENU_MAX_HEIGHT = 288; 
const MENU_GAP = 4; 

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
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const computePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward =
      spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow;

    setMenuPosition({
      top: openUpward
        ? rect.top + window.scrollY - MENU_GAP - MENU_MAX_HEIGHT
        : rect.bottom + window.scrollY + MENU_GAP,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUpward,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    computePosition();

    const handleScroll = () => computePosition();
    const handleResize = () => computePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, computePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
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

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            zIndex: 9999,
          }}
          className={`bg-white border border-slate-200 rounded-lg shadow-xl max-h-72 overflow-y-auto custom-scrollbar ${menuClassName}`}
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
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-600">{label}</label>
      )}

      <button
        ref={triggerRef}
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

      {menu}
    </div>
  );
};

export default MultiSelectDropdown;
