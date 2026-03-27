import React, { useState, useEffect, useRef, useMemo } from "react";
import { TicketEntry } from "../types/index";
import FilterDialog from "../components/FilterDialog";
import {
  useTicketTypes,
  useTicketStatuses,
} from "../hooks/queries/useTicketsQueries";
import { ticketsService } from "../services/tickets.service";
import toast from "react-hot-toast";

type OTicketSortKey =
  | "ticketId"
  | "projectName"
  | "employee"
  | "type"
  | "status"
  | "roles"
  | "week"
  | "month"
  | "createdAt";

type SortDirection = "asc" | "desc";

const OTicket: React.FC = () => {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sort, setSort] = useState<{
    key: OTicketSortKey | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: "asc",
  });

  const [filters, setFilters] = useState({
    search: "",
    ticketTypeId: "",
    ticketStatusId: "",
    sortBy: "",
    sortOrder: "",
    weeks: [] as number[],
    month: 0,
  });

  const { data: ticketTypes = [] } = useTicketTypes();
  const { data: ticketStatuses = [] } = useTicketStatuses();

  const fetchTickets = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await ticketsService.getTickets({
        page,
        perPage,
        projectId: "",
        ticketTypeId: filters.ticketTypeId,
        ticketStatusId: filters.ticketStatusId,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        week: filters.weeks.length > 0 ? filters.weeks : undefined,
        month: filters.month === 0 ? null : filters.month,
      });

      if (response.success && response.data.items) {
        setTickets(response.data.items);
        setTotalPages(response.data.pages);
        setTotalItems(response.data.total);
        setCurrentPage(response.data.page);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch tickets");
    } finally {
      setIsLoading(false);
    }
  };

  // Non-search filters + pagination — fetch immediately
  useEffect(() => {
    fetchTickets(currentPage);
  }, [
    filters.ticketTypeId,
    filters.ticketStatusId,
    filters.sortBy,
    filters.sortOrder,
    filters.weeks,
    filters.month,
    currentPage,
    perPage,
  ]);

  // Search — debounced 800 ms, reset to page 1
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchTickets(1);
    }, 800);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [filters.search]);

  const handleSort = (key: OTicketSortKey) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: OTicketSortKey) => {
    if (sort.key !== key) return "unfold_more";
    return sort.direction === "asc" ? "arrow_upward" : "arrow_downward";
  };

  const sortedTickets = useMemo(() => {
    if (!sort.key) return tickets;
    return [...tickets].sort((a, b) => {
      const getVal = (t: any, k: OTicketSortKey): string | number => {
        switch (k) {
          case "ticketId":
            return t.ticketId ?? "";
          case "projectName":
            return t.projectName ?? "";
          case "employee":
            return t.employeeEngName ?? t.employeeName ?? "";
          case "type":
            return t.ticketTypeName ?? "";
          case "status":
            return t.ticketStatusName ?? "";
          case "roles":
            return Array.isArray(t.roleNames) ? t.roleNames.join(",") : "";
          case "week":
            return t.week ?? 0;
          case "month":
            return t.month ?? 0;
          case "createdAt":
            return t.createdAt ?? "";
        }
      };
      const aVal = getVal(a, sort.key!);
      const bVal = getVal(b, sort.key!);
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [tickets, sort]);

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "bug fix":
      case "bug":
        return "bg-red-100 text-red-700 border-red-200";
      case "task":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "feature":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "refactor":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "hotfix":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "epic":
        return "bg-violet-100 text-violet-700 border-violet-200";
      case "research":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-white text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "inqa":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "closed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "in progress":
        return "bg-cyan-100 text-cyan-700 border-cyan-200";
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const SortTh: React.FC<{
    sortKey: OTicketSortKey;
    align?: "left" | "center";
    children: React.ReactNode;
  }> = ({ sortKey, align = "center", children }) => (
    <th
      className={`py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-${align}`}
    >
      <button
        type="button"
        onClick={() => handleSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-slate-900"
      >
        {children}
        <span className="material-symbols-outlined text-[14px]">
          {getSortIcon(sortKey)}
        </span>
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-6 px-4 sm:px-6 py-6 w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[28px]">
            assignment_turned_in
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">OTicket Task</h1>
            <p className="text-sm text-slate-500">
              View and manage your assigned tickets
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">
              My Tickets
            </h3>
            {isLoading && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="inline-flex w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                Loading...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">
                tune
              </span>
              Filters
            </button>
            <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
              {totalItems} {totalItems === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>
        </div>

        <FilterDialog
          isOpen={isFilterOpen}
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              search: "",
              ticketTypeId: "",
              ticketStatusId: "",
              sortBy: "",
              sortOrder: "",
              weeks: [],
              month: 0,
            })
          }
        />

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-border-light">
              <tr>
                <SortTh sortKey="ticketId">Ticket ID</SortTh>
                <SortTh sortKey="projectName" align="left">
                  Project
                </SortTh>
                <SortTh sortKey="employee" align="left">
                  Employee
                </SortTh>
                <SortTh sortKey="type">Type</SortTh>
                <SortTh sortKey="status">Status</SortTh>
                <SortTh sortKey="roles">Roles</SortTh>
                <SortTh sortKey="week">Week</SortTh>
                <SortTh sortKey="month">Month</SortTh>
                <SortTh sortKey="createdAt">Created</SortTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {isLoading && tickets.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    {Array.from({ length: 9 }).map((__, ci) => (
                      <td key={ci} className="py-4 px-6">
                        <div className="h-4 rounded bg-slate-200 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">
                        inbox
                      </span>
                      <p className="text-slate-500 font-medium">
                        No tickets found
                      </p>
                      <p className="text-slate-400 text-sm">
                        You don't have any assigned tickets
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {ticket.ticketId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-left">
                      <span className="text-sm font-medium text-slate-700">
                        {ticket.projectName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-left">
                      <span className="text-sm text-slate-600">
                        {ticket.employeeEngName || ticket.employeeName || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getTypeColor(ticket.ticketTypeName || "")}`}
                      >
                        {ticket.ticketTypeName || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getStatusColor(ticket.ticketStatusName || "")}`}
                      >
                        {ticket.ticketStatusName || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-wrap gap-1 justify-center items-center">
                        {Array.isArray(ticket.roleNames) &&
                        ticket.roleNames.length > 0 ? (
                          ticket.roleNames.map(
                            (role: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                              >
                                {role}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-xs text-slate-400">
                            No roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs font-semibold text-slate-700">
                        {ticket.week || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs text-slate-600">
                        {ticket.month
                          ? new Date(2000, ticket.month - 1).toLocaleString(
                              "default",
                              { month: "short" },
                            )
                          : "-"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs text-slate-600">
                        {ticket.createdAt
                          ? new Date(ticket.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-light bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Showing{" "}
              <span className="font-semibold">
                {(currentPage - 1) * perPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {Math.min(currentPage * perPage, totalItems)}
              </span>{" "}
              of <span className="font-semibold">{totalItems}</span> tickets
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="h-8 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={isLoading}
                      className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-white"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || isLoading}
                className="h-8 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTicket;
