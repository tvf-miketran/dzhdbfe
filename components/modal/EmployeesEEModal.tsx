import React, { useEffect, useState } from "react";
import { formulasService } from "../../services";
import type { EmployeeEEItem } from "../../services/formulas.service";

interface EmployeesEEModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmployeesEEModal: React.FC<EmployeesEEModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<EmployeeEEItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await formulasService.getListEmployeesEE();
        if (!cancelled) {
          setData(res.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load employees EE data.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const sortedData = [...data].sort((a, b) => b.totalEE - a.totalEE);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500 text-[24px]">
            group
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">
              Employees EE Detail
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              {sortedData.length} employee{sortedData.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-400 text-[20px]">
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-slate-400 text-[28px]">
                sync
              </span>
              <span className="ml-2 text-sm text-slate-500">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-sm text-red-500">
              {error}
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No data available.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    #
                  </th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Employee Name
                  </th>
                  <th className="text-right py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Total EE (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-medium">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.enFullName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                      {item.totalEE}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesEEModal;
