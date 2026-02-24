import React from "react";

interface ConfirmStatusModalProps {
  isOpen: boolean;
  nextStatus: "Active" | "Inactive";
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmStatusModal: React.FC<ConfirmStatusModalProps> = ({
  isOpen,
  nextStatus,
  isPending,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Confirm Status Change
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Are you sure you want to set this user to{" "}
            <span className="font-semibold">{nextStatus}</span>?
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
            className={`px-3 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              nextStatus === "Active"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-slate-700 hover:bg-slate-800"
            }`}
          >
            {isPending ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStatusModal;
