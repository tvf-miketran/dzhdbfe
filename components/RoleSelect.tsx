import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface RoleSelectOption {
  value: string;
  label: string;
}

interface RoleSelectProps {
  selectedRoles: string[];
  options: RoleSelectOption[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  maxWidth?: string;
  isLoading?: boolean;
}

const RoleSelect: React.FC<RoleSelectProps> = ({
  selectedRoles,
  options,
  onToggle,
  disabled = false,
  maxWidth = "160px",
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const computeMenuStyle = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 160),
      zIndex: 9999,
    });
  };

  const handleToggleOpen = () => {
    if (disabled) return;
    if (!isOpen) computeMenuStyle();
    setIsOpen((o) => !o);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => computeMenuStyle();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen]);

  const isEmpty = selectedRoles.length === 0;

  const triggerColorClass = isEmpty
    ? "border-amber-300 bg-amber-50 text-amber-600"
    : "border-blue-300 bg-[#E8EFFF] text-blue-700";

  let displayLabel: string;
  if (isLoading) {
    displayLabel = "Loading...";
  } else if (isEmpty) {
    displayLabel = "Choose role";
  } else if (selectedRoles.length === 1) {
    displayLabel = selectedRoles[0];
  } else {
    displayLabel = `${selectedRoles[0]} +${selectedRoles.length - 1}`;
  }

  const menu =
    isOpen && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">
                No roles available
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = selectedRoles.includes(opt.label);
                return (
                  <div
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onToggle(opt.value);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-3.5 flex-shrink-0 font-bold">
                      {isSelected ? "✓" : ""}
                    </span>
                    <span>{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative inline-block w-full" style={{ maxWidth }}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggleOpen}
          disabled={disabled}
          className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold uppercase tracking-tight text-left truncate outline-none transition-all ${triggerColorClass} disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed ${!disabled ? "cursor-pointer hover:brightness-95" : ""}`}
        >
          {displayLabel}
        </button>

        <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">
          expand_more
        </span>
      </div>

      {menu}
    </>
  );
};

export default RoleSelect;
