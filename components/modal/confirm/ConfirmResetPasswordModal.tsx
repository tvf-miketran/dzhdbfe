import React from "react";

interface ConfirmResetPasswordModalProps {
  isOpen: boolean;
  name: string;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmResetPasswordModal: React.FC<ConfirmResetPasswordModalProps> = ({
  isOpen,
  name,
  isPending,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-1">
            <span className="material-symbols-outlined text-amber-500 text-[28px]">
              lock_reset
            </span>
            <h3 className="text-lg font-semibold text-slate-900">
              Reset Password
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Are you sure you want to reset the password for{" "}
            <span className="font-semibold text-slate-800">{name}</span>
          </p>
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-2 rounded-md border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-3 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-colors bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetPasswordModal;
