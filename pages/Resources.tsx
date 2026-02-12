import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useEmployees } from "../hooks/queries/useUserQueries";
import type { Employee } from "../types";
import CreateEmployeeModal from "../components/modal/CreateEmployeeModal";

interface Ticket {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
}

interface User {
  id: string;
  name: string;
  employeeId: string;
  project: string;
  role: "PM" | "QA" | "BA" | "DEV";
  ee: number;
  status: "Active" | "Inactive";
  avatar: string;
  ticketCount: number;
  logworkHours: number;
  tickets: Ticket[];
}

const Resources: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [statusConfirm, setStatusConfirm] = useState<null | {
    id: string;
    nextStatus: "Active" | "Inactive";
  }>(null);
  const [resetConfirm, setResetConfirm] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination and filters from API
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch employees from API
  const {
    data: employeesData,
    isLoading,
    isError,
    error,
  } = useEmployees({
    page: currentPage,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status:
      selectedStatus === "Active"
        ? true
        : selectedStatus === "Inactive"
          ? false
          : undefined,
  });

  // Debug logging
  useEffect(() => {
    console.log("[Resources] Component mounted, useEmployees hook initialized");
    console.log("[Resources] API Base URL:", import.meta.env.VITE_API_BASE_URL);
    console.log("[Resources] Query params:", {
      page: currentPage,
      per_page: perPage,
      search: debouncedSearch || undefined,
      status:
        selectedStatus === "Active"
          ? true
          : selectedStatus === "Inactive"
            ? false
            : undefined,
    });
    console.log(
      "[Resources] Auth token exists:",
      !!localStorage.getItem("access_token"),
    );
  }, []);

  useEffect(() => {
    console.log("[Resources] API call state:", {
      isLoading,
      isError,
      hasData: !!employeesData,
      error: error,
    });
    if (employeesData) {
      console.log("[Resources] Employees data received:", employeesData);
    }
  }, [isLoading, isError, employeesData, error]);

  const statuses = ["All", "Active", "Inactive"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <div className="flex flex-col gap-8 p-6 md:px-8 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6"></div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 sm:max-w-sm">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === "status" ? null : "status")
                }
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-500 uppercase tracking-widest">
                  Status:
                </span>
                <span className="text-slate-900">{selectedStatus}</span>
                <span className="material-symbols-outlined text-[14px] text-slate-500">
                  {openDropdown === "status" ? "expand_less" : "expand_more"}
                </span>
              </button>
              {openDropdown === "status" && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[140px]">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setOpenDropdown(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        selectedStatus === status
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-slate-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filter Button */}
            {(selectedStatus !== "All" || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatus("All");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  close
                </span>
                Clear
              </button>
            )}
          </div>

          {/* Create User Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg sm:ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create User
          </button>
        </div>
      </div>

      <div className="bg-surface-light border border-border-light rounded-xl overflow-hidden flex flex-col shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-slate-600">Loading employees...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 max-w-md">
              <span className="material-symbols-outlined text-red-500 text-[48px]">
                error
              </span>
              <p className="text-sm text-red-600 font-semibold">
                {(error as any)?.message || "Failed to load employees"}
              </p>
              {import.meta.env.DEV && (
                <details className="text-xs text-slate-600 mt-2">
                  <summary className="cursor-pointer hover:text-slate-900">
                    Debug Info
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-100 rounded text-left overflow-auto max-w-full">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : !employeesData?.data?.items ||
          employeesData.data.items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-[48px]">
                person_off
              </span>
              <p className="text-sm text-slate-600">No employees found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-light">
                  <tr>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Employee Name
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Employee ID
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Email
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Role
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Status
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {employeesData.data.items.map((employee: Employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-6 text-left">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {employee.enFullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {employee.vnFullName}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-mono text-slate-700">
                          {employee.employeeId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <span className="text-sm text-slate-900">
                          {employee.email}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            employee.authorizeRole === "ADMIN"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {employee.authorizeRole}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusConfirm({
                              id: employee.id,
                              nextStatus: employee.status
                                ? "Inactive"
                                : "Active",
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border transition-colors ${
                            employee.status
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                              : "bg-slate-200/30 text-slate-600 border-slate-300/30 hover:bg-slate-200/50"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${employee.status ? "bg-emerald-600" : "bg-slate-400"}`}
                          ></span>
                          {employee.status ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success("Edit feature coming soon!");
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold bg-white hover:bg-primary/10 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            edit
                          </span>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-border-light">
              <div className="text-sm text-slate-600 font-normal">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {(currentPage - 1) * perPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(currentPage * perPage, employeesData.data.total)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {employeesData.data.total}
                </span>{" "}
                results
              </div>
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_left
                  </span>
                </button>

                {/* Page Numbers */}
                {(() => {
                  const totalPages = employeesData.data.pages;
                  const pageNumbers: (number | string)[] = [];
                  const maxVisiblePages = 5;

                  if (totalPages <= maxVisiblePages + 2) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    // Always show first page
                    pageNumbers.push(1);

                    if (currentPage > 3) {
                      pageNumbers.push("...");
                    }

                    // Show pages around current page
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      pageNumbers.push(i);
                    }

                    if (currentPage < totalPages - 2) {
                      pageNumbers.push("...");
                    }

                    // Always show last page
                    pageNumbers.push(totalPages);
                  }

                  return pageNumbers.map((pageNum, idx) => {
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
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          currentPage === pageNum
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "border border-border-light text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(employeesData.data.pages, prev + 1),
                    )
                  }
                  disabled={currentPage === employeesData.data.pages}
                  className="px-3 py-2 rounded-lg border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal for creating new employee */}
      <CreateEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Confirm Status Change
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to set this user to{" "}
                <span className="font-semibold">
                  {statusConfirm.nextStatus}
                </span>
                ?
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusConfirm(null)}
                className="px-3 py-2 rounded-md border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: Implement API mutation to update user status
                  toast.success(
                    `User status changed to ${statusConfirm.nextStatus}!`,
                  );
                  setStatusConfirm(null);
                }}
                className={`px-3 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-colors ${
                  statusConfirm.nextStatus === "Active"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-700 hover:bg-slate-800"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {resetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Confirm Reset
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to reset user{" "}
                <span className="font-semibold">{resetConfirm.name}</span>?
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirm(null)}
                className="px-3 py-2 rounded-md border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success(`User ${resetConfirm.name} has been reset!`);
                  setResetConfirm(null);
                }}
                className="px-3 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-colors bg-red-600 hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">
                User Details
              </h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
              {/* User Avatar and Name */}
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar}
                  className="h-20 w-20 rounded-full border-2 border-primary object-cover"
                  alt={selectedUser.name}
                />
                <div>
                  <h4 className="text-xl font-bold text-slate-900">
                    {selectedUser.name}
                  </h4>
                  <p className="text-sm text-slate-500 font-mono">
                    {selectedUser.employeeId}
                  </p>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Project
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedUser.project}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Role
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      selectedUser.role === "PM"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : selectedUser.role === "QA"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : selectedUser.role === "BA"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                  >
                    {selectedUser.role}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                      selectedUser.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-slate-200/30 text-slate-600 border-slate-300/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === "Active" ? "bg-emerald-600" : "bg-slate-400"}`}
                    ></span>
                    {selectedUser.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                      confirmation_number
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {selectedUser.ticketCount}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                    Logwork Hours
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">
                      schedule
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      {selectedUser.logworkHours}h
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Efficiency
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${selectedUser.ee}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {selectedUser.ee}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Recent Tickets
                  </p>
                  <span className="text-xs text-slate-400">
                    {selectedUser.tickets.length} total
                  </span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedUser.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900 font-mono">
                        {ticket.id}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest ${
                          ticket.status === "Open"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "In Progress"
                              ? "bg-amber-100 text-amber-700"
                              : ticket.status === "Resolved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedUser(null);
                  // TODO: Open edit user modal
                  toast.success("Edit user feature coming soon!");
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  edit
                </span>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
