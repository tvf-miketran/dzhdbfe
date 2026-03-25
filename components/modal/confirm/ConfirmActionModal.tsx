import React from "react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  isPending?: boolean;
  variant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon = "help",
  isPending = false,
  variant = "primary",
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const iconToneClass =
    variant === "danger"
      ? "bg-red-100 text-red-600"
      : "bg-primary/10 text-primary";

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-primary hover:bg-emerald-600";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${iconToneClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {icon}
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`h-10 rounded-lg px-5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${confirmButtonClass}`}
          >
            {isPending ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
