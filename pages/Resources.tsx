import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useEmployees } from "../hooks/queries/useUserQueries";
import { useProjectWithMembers } from "../hooks/queries/useProjectsQueries";
import {
  useToggleEmployeeStatus,
  useResetEmployeePassword,
} from "../hooks/mutations/useUserMutations";
import { useAuth } from "../context/AuthContext";
import type { Employee, EmployeeProject } from "../types";
import CreateEmployeeModal from "../components/modal/CreateEmployeeModal";
import EditEmployeeModal from "../components/modal/EditEmployeeModal";
import UserDetailModal from "../components/modal/UserDetailModal";
import {
  ConfirmStatusModal,
  ConfirmResetPasswordModal,
} from "../components/modal/confirm";
import { Pagination } from "../components/pagination";
import ProjectFilter from "../components/ProjectFilter";

const Resources: React.FC = () => {
  const { user } = useAuth();
  const isMember = user?.authorize_role === "MEMBER";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Pagination and filters from API
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("All");

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
    isLoading: isEmployeesLoading,
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

  // Fetch project detail with members when a project filter is active
  const { data: projectDetailData, isLoading: isProjectMembersLoading } =
    useProjectWithMembers(selectedProject === "All" ? "" : selectedProject);

  const isLoading = isEmployeesLoading || isProjectMembersLoading;

  // Derive the employee rows shown in the table
  const displayedEmployees: Employee[] = (() => {
    if (selectedProject !== "All") {
      // Map project members to Employee shape for the table
      const members = projectDetailData?.data?.members ?? [];
      const projectName = projectDetailData?.data?.name ?? null;
      return members
        .filter((m) => {
          if (selectedStatus === "Active") return m.status === true;
          if (selectedStatus === "Inactive") return m.status === false;
          return true;
        })
        .filter((m) => {
          if (!debouncedSearch) return true;
          const q = debouncedSearch.toLowerCase();
          return (
            m.enFullName.toLowerCase().includes(q) ||
            m.vnFullName.toLowerCase().includes(q)
          );
        })
        .map((m) => ({
          id: m.userId,
          email: m.email,
          vnFullName: m.vnFullName,
          enFullName: m.enFullName,
          authorizeRole: m.authorize_role,
          status: m.status,
          description: null,
          createdAt: m.joinedAt,
          updatedAt: m.joinedAt,
          projects: [
            {
              projectId: selectedProject,
              projectName,
              projectKey: null,
              roleId: (m as any).roleId ?? null,
              roleName: (m as any).roleName ?? null,
              allocationPercent: m.allocationPercent,
              joinedAt: m.joinedAt,
            },
          ],
        }));
    }
    return employeesData?.data?.items ?? [];
  })();

  const displayedEmployeeRows: Array<{
    employee: Employee;
    project: EmployeeProject | null;
    isFirst: boolean;
    rowSpan: number;
  }> = (() => {
    const rows = displayedEmployees.flatMap((employee) => {
      // Check if employee has valid projects
      const hasProjects = employee.projects && Array.isArray(employee.projects) && employee.projects.length > 0;
      const projects = hasProjects ? employee.projects : [null];

      return projects.map((project, index) => ({
        employee,
        project,
        isFirst: index === 0,
        rowSpan: projects.length,
      }));
    });
    
    return rows;
  })();

  // Toggle employee status mutation
  const toggleStatusMutation = useToggleEmployeeStatus();

  // Reset employee password mutation
  const resetPasswordMutation = useResetEmployeePassword();

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

            {/* Project Filter */}
            <ProjectFilter
              selectedProject={selectedProject}
              onChange={(projectId) => {
                setSelectedProject(projectId);
                setCurrentPage(1);
              }}
            />

            {/* Clear Filter Button */}
            {(selectedStatus !== "All" ||
              searchQuery ||
              selectedProject !== "All") && (
              <button
                onClick={() => {
                  setSelectedStatus("All");
                  setSearchQuery("");
                  setSelectedProject("All");
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
          {!isMember && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg sm:ml-auto"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create User
            </button>
          )}
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
        ) : !displayedEmployeeRows.length ? (
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
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Email
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Project Name
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Role in Project
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Role
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Status
                    </th>
                    {!isMember && (
                      <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {displayedEmployeeRows.map(({ employee, project, isFirst, rowSpan }, index) => (
                    <tr
                      key={`${employee.id}-${project?.projectId ?? "no-project"}-${project?.roleId ?? "no-role"}-${index}`}
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      {isFirst && (
                        <td rowSpan={rowSpan} className="py-4 px-6 text-left align-middle">
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {employee.enFullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {employee.vnFullName}
                            </div>
                          </div>
                        </td>
                      )}
                      {isFirst && (
                        <td rowSpan={rowSpan} className="py-4 px-6 text-left align-middle">
                          <span className="text-sm text-slate-900">
                            {employee.email}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-6 text-left">
                        <div className="text-sm text-slate-900">
                          {project?.projectName ? project.projectName : (
                            <span className="text-slate-400 italic">No project</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <div className="text-sm text-slate-900">
                          {project?.roleName ? project.roleName : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </div>
                      </td>
                      {isFirst && (
                        <td rowSpan={rowSpan} className="py-4 px-6 text-center align-middle">
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
                      )}
                      {isFirst && (
                        <td rowSpan={rowSpan} className="py-4 px-6 text-center align-middle">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isMember) {
                                setStatusConfirm({
                                  id: employee.id,
                                  nextStatus: employee.status
                                    ? "Inactive"
                                    : "Active",
                                });
                              }
                            }}
                            disabled={isMember}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border transition-colors ${
                              isMember
                                ? "opacity-60 cursor-not-allowed"
                                : ""
                            } ${
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
                      )}
                      {!isMember && isFirst && (
                        <td rowSpan={rowSpan} className="py-4 px-6 text-center align-middle">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResetConfirm({
                                  id: employee.id,
                                  name: employee.enFullName,
                                });
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-500 text-amber-600 text-xs font-semibold bg-white hover:bg-amber-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                lock_reset
                              </span>
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditEmployeeId(employee.id);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-primary text-primary text-xs font-semibold bg-white hover:bg-primary/10 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                edit
                              </span>
                              Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination – hidden when filtered by a specific project */}
            {selectedProject === "All" && employeesData && (
              <Pagination
                currentPage={currentPage}
                totalPages={employeesData.data.pages}
                total={employeesData.data.total}
                perPage={perPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {/* Modal for creating new employee */}
      <CreateEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal for editing an employee */}
      <EditEmployeeModal
        isOpen={!!editEmployeeId}
        employeeId={editEmployeeId}
        onClose={() => setEditEmployeeId(null)}
      />

      <ConfirmStatusModal
        isOpen={!!statusConfirm}
        nextStatus={statusConfirm?.nextStatus ?? "Active"}
        isPending={toggleStatusMutation.isPending}
        onCancel={() => setStatusConfirm(null)}
        onConfirm={() => {
          if (!statusConfirm) return;
          toggleStatusMutation.mutate(statusConfirm.id, {
            onSuccess: (res) => {
              const newStatus = res.data.status ? "Active" : "Inactive";
              toast.success(
                res.message || `User status changed to ${newStatus}!`,
              );
              setStatusConfirm(null);
            },
            onError: (err: any) => {
              toast.error(
                err?.response?.data?.message ||
                  "Failed to update status. Please try again.",
              );
              setStatusConfirm(null);
            },
          });
        }}
      />

      <ConfirmResetPasswordModal
        isOpen={!!resetConfirm}
        name={resetConfirm?.name ?? ""}
        isPending={resetPasswordMutation.isPending}
        onCancel={() => setResetConfirm(null)}
        onConfirm={() => {
          if (!resetConfirm) return;
          resetPasswordMutation.mutate(resetConfirm.id, {
            onSuccess: (res) => {
              toast.success(
                res.message ||
                  `Password reset successfully for ${resetConfirm.name}.`,
              );
              setResetConfirm(null);
            },
            onError: (err: any) => {
              toast.error(
                err?.response?.data?.message ||
                  "Failed to reset password. Please try again.",
              );
              setResetConfirm(null);
            },
          });
        }}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default Resources;
