import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  total,
  perPage,
  onPageChange,
}) => {
  const maxVisiblePages = 5;
  const pageNumbers: (number | string)[] = [];

  if (totalPages <= maxVisiblePages + 2) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    }

    pageNumbers.push(totalPages);
  }

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  return (
    <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-border-light">
      <div className="text-sm text-slate-600 font-normal">
        Showing <span className="font-semibold text-slate-900">{from}</span> to{" "}
        <span className="font-semibold text-slate-900">{to}</span> of{" "}
        <span className="font-semibold text-slate-900">{total}</span> results
      </div>
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">
            chevron_left
          </span>
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((pageNum, idx) => {
          if (pageNum === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-3 py-2 text-slate-400"
              >
                {pageNum}
              </span>
            );
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum as number)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentPage === pageNum
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "border border-border-light text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
