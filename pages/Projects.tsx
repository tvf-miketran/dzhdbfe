import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useProjectsPaginated,
  useAllProjects,
  useProjectWithMembers,
} from "../hooks/queries/useProjectsQueries";
import { useEmployees } from "../hooks/queries/useUserQueries";
import { useAddProjectMembers } from "../hooks/mutations/useProjectsMutations";
import { useAuth } from "../context/AuthContext";
import type { ProjectItem, Employee } from "../types";
import { Pagination } from "../components/pagination";

interface MemberAssignment {
  userId: string;
  enFullName: string;
  employeeId: string;
  allocationPercent: string;
}

const BANK_LIST: string[] = [
  "Vietcombank",
  "BIDV",
  "VietinBank",
  "Techcombank",
  "ACB",
];

const Projects: React.FC = () => {
  const { user } = useAuth();
  const isMember = user?.authorize_role === "MEMBER";
  
  // Pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddMemberMembersOpen, setIsAddMemberMembersOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addMemberProjectId, setAddMemberProjectId] = useState("");
  const [addMemberProjectName, setAddMemberProjectName] = useState("");
  const [memberDrafts, setMemberDrafts] = useState<MemberAssignment[]>([]);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [isConfirmAddMemberOpen, setIsConfirmAddMemberOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(
    null,
  );
  const [formState, setFormState] = useState({
    bank: "",
    projectRows: [{ name: "", code: "" }],
    projectManager: "",
    membersAssigned: [] as string[],
    startDate: "",
    endDate: "",
  });

  // Debounce main search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce member search (Add Member modal)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMemberSearch(memberSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearchTerm]);

  // Fetch paginated projects list
  const {
    data: projectsData,
    isLoading,
    isError,
    error,
  } = useProjectsPaginated({
    page: currentPage,
    per_page: perPage,
    search: debouncedSearch || undefined,
  });

  // Fetch full project list for dropdowns (Add Member modal)
  const { data: allProjectsData } = useAllProjects();
  const allProjects: ProjectItem[] = allProjectsData?.data ?? [];

  const tableProjects: ProjectItem[] = projectsData?.data?.items ?? [];

  // Fetch full detail + members when the detail modal is open
  const { data: projectDetailData, isLoading: isDetailLoading } =
    useProjectWithMembers(selectedProject?.id ?? "");

  // Fetch employees for Add Member modal — uses debounced search term
  const {
    data: addMemberEmployeesData,
    isLoading: isAddMemberEmployeesLoading,
  } = useEmployees({
    per_page: 100,
    search: debouncedMemberSearch || undefined,
  });
  // API may return a flat array (search) or paginated shape (no search) — handle both
  const addMemberEmployees = Array.isArray(addMemberEmployeesData?.data)
    ? (addMemberEmployeesData.data as Employee[])
    : (addMemberEmployeesData?.data?.items ?? []);

  // All employees (no search filter) for the Create Project members picker
  const { data: allEmployeesData } = useEmployees({ per_page: 100 });
  const allEmployees = Array.isArray(allEmployeesData?.data)
    ? (allEmployeesData.data as Employee[])
    : (allEmployeesData?.data?.items ?? []);

  // Mutation: add members to a project
  const { mutate: addProjectMembers, isPending: isAddingMembers } =
    useAddProjectMembers();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".filter-dropdown")) {
        setOpenDropdown(null);
      }
      if (!target.closest(".members-select-dropdown")) {
        setIsMembersOpen(false);
      }
    };

    if (openDropdown || isMembersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown, isMembersOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".add-member-select-dropdown")) {
        setIsAddMemberMembersOpen(false);
      }
    };

    if (isAddMemberMembersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAddMemberMembersOpen]);

  const handleOpenAddMember = (project: ProjectItem) => {
    setAddMemberProjectId(project.id);
    setAddMemberProjectName(project.name);
    setMemberDrafts([]);
    setMemberSearchTerm("");
    setIsAddMemberMembersOpen(false);
    setIsAddMemberOpen(true);
  };

  const handleCloseAddMember = () => {
    setIsAddMemberOpen(false);
    setIsAddMemberMembersOpen(false);
    setIsConfirmAddMemberOpen(false);
    setAddMemberProjectId("");
    setAddMemberProjectName("");
    setMemberDrafts([]);
    setMemberSearchTerm("");
    setDebouncedMemberSearch("");
    setFormErrors({});
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const bank = formState.bank.trim();
    const projectManager = formState.projectManager.trim();
    const membersAssigned = formState.membersAssigned;
    const startDate = formState.startDate.trim();
    const endDate = formState.endDate.trim();
    const validRows = formState.projectRows
      .map((row) => ({ name: row.name.trim(), code: row.code.trim() }))
      .filter((row) => row.name && row.code);

    // Validation
    const errors: Record<string, string> = {};
    if (!bank) errors.bank = "Bank is required";
    if (!projectManager) errors.projectManager = "Project Manager is required";
    if (validRows.length === 0)
      errors.project = "At least one project with name and code is required";
    if (membersAssigned.length === 0)
      errors.members = "At least one member must be assigned";
    if (!startDate) errors.startDate = "Start date is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields");
      return;
    }

    setFormErrors({});

    if (editingProjectId) {
      // TODO: wire to PUT /api/projects/:id mutation
      setEditingProjectId(null);
      toast.success("Project updated successfully!");
    } else {
      // TODO: wire to POST /api/projects mutation
      const count = validRows.length;
      toast.success(
        `${count} project${count > 1 ? "s" : ""} created successfully!`,
      );
    }
    setFormState({
      bank: "",
      projectRows: [{ name: "", code: "" }],
      projectManager: "",
      membersAssigned: [],
      startDate: "",
      endDate: "",
    });
    setFormErrors({});
    setIsCreateOpen(false);
  };

  const handleEditProject = (project: ProjectItem) => {
    setEditingProjectId(project.id);
    setFormState({
      bank: project.bankName ?? "",
      projectRows: [
        { name: project.name, code: project.projectId ?? project.id },
      ],
      projectManager: project.pmName ?? "",
      membersAssigned: [],
      startDate: project.createdAt ? project.createdAt.split("T")[0] : "",
      endDate: "",
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by project name..."
              className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                close
              </span>
              Clear
            </button>
          )}

          <div className="flex items-center gap-2 sm:ml-auto">
            {!isMember && (
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
                onClick={() => setIsAddMemberOpen(true)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                Add Member
              </button>
            )}
            {!isMember && (
              <button
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg"
                onClick={() => setIsCreateOpen(true)}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-white shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-slate-600">Loading projects...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 max-w-md">
              <span className="material-symbols-outlined text-red-500 text-[48px]">
                error
              </span>
              <p className="text-sm text-red-600 font-semibold">
                {(error as any)?.message || "Failed to load projects"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-light">
                  <tr>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Project
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Project Manager
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Bank
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                      Created At
                    </th>
                    {!isMember && (
                      <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {tableProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProject(project);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {project.name}
                          </span>
                          <span className="text-xs text-slate-500 font-light font-mono">
                            {project.projectId}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-slate-700 font-normal">
                        {project.pmName}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-slate-700">
                        {project.bankName}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-slate-500 font-light">
                        {new Date(project.createdAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      {!isMember && (
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              edit
                            </span>
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {tableProjects.length === 0 && (
                    <tr>
                      <td
                        className="py-10 px-6 text-center text-sm text-slate-500"
                        colSpan={5}
                      >
                        No projects found. Try a different search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {projectsData?.data && (
              <Pagination
                currentPage={currentPage}
                totalPages={projectsData.data.pages}
                total={projectsData.data.total}
                perPage={perPage}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProjectId ? "Edit Project" : "Create Project"}
              </h2>
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <form
              onSubmit={handleCreate}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Bank <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formState.bank}
                      onChange={(event) => {
                        setFormState((prev) => ({
                          ...prev,
                          bank: event.target.value,
                        }));
                        if (formErrors.bank)
                          setFormErrors((prev) => ({ ...prev, bank: "" }));
                      }}
                      className={`h-10 w-full rounded-md border bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 appearance-none cursor-pointer ${
                        formErrors.bank
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-border-light focus:ring-primary focus:border-primary"
                      }`}
                    >
                      <option value="" disabled>
                        Select bank
                      </option>
                      {BANK_LIST.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  {formErrors.bank && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.bank}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Project Manager <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formState.projectManager}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        projectManager: event.target.value,
                      }));
                      if (formErrors.projectManager)
                        setFormErrors((prev) => ({
                          ...prev,
                          projectManager: "",
                        }));
                    }}
                    placeholder="Project manager name"
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                      formErrors.projectManager
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.projectManager && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.projectManager}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    {!editingProjectId && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            projectRows: [
                              ...prev.projectRows,
                              { name: "", code: "" },
                            ],
                          }))
                        }
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Add
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {formState.projectRows.map((row, index) => (
                      <div
                        key={`${row.code}-${index}`}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] items-center"
                      >
                        <input
                          type="text"
                          value={row.name}
                          onChange={(event) =>
                            setFormState((prev) => {
                              const nextRows = [...prev.projectRows];
                              nextRows[index] = {
                                ...nextRows[index],
                                name: event.target.value,
                              };
                              return { ...prev, projectRows: nextRows };
                            })
                          }
                          placeholder="Project name"
                          className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <input
                          type="text"
                          value={row.code}
                          onChange={(event) =>
                            setFormState((prev) => {
                              const nextRows = [...prev.projectRows];
                              nextRows[index] = {
                                ...nextRows[index],
                                code: event.target.value,
                              };
                              return { ...prev, projectRows: nextRows };
                            })
                          }
                          placeholder="Project code"
                          className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormState((prev) => {
                              if (prev.projectRows.length === 1) return prev;
                              const nextRows = prev.projectRows.filter(
                                (_, rowIndex) => rowIndex !== index,
                              );
                              return { ...prev, projectRows: nextRows };
                            })
                          }
                          className="h-10 w-10 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                          aria-label="Remove project row"
                          disabled={
                            formState.projectRows.length === 1 ||
                            Boolean(editingProjectId)
                          }
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            close
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  {formErrors.project && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.project}
                    </p>
                  )}
                </div>
                <div className="members-select-dropdown relative">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Member's Assigned <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMembersOpen((prev) => !prev)}
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-left text-sm text-slate-900 outline-none focus:ring-1 flex items-center justify-between ${
                      formErrors.members
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  >
                    <span className="truncate">
                      {formState.membersAssigned.length === 0
                        ? "Select members"
                        : formState.membersAssigned.length === 1
                          ? formState.membersAssigned[0]
                          : `${formState.membersAssigned.length} members selected`}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      {isMembersOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {isMembersOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto z-20">
                      {allEmployees.map((emp) => {
                        const isChecked = formState.membersAssigned.includes(
                          emp.enFullName,
                        );
                        return (
                          <label
                            key={emp.id}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setFormState((prev) => {
                                  const nextMembers = isChecked
                                    ? prev.membersAssigned.filter(
                                        (name) => name !== emp.enFullName,
                                      )
                                    : [...prev.membersAssigned, emp.enFullName];
                                  if (formErrors.members)
                                    setFormErrors((prevErrors) => ({
                                      ...prevErrors,
                                      members: "",
                                    }));
                                  return {
                                    ...prev,
                                    membersAssigned: nextMembers,
                                  };
                                })
                              }
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <div className="min-w-0">
                              <span className="block truncate">
                                {emp.enFullName}
                              </span>
                              <span className="block text-xs text-slate-400 font-mono">
                                {emp.employeeId}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}{" "}
                  {formErrors.members && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.members}
                    </p>
                  )}{" "}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formState.startDate}
                    onChange={(event) => {
                      setFormState((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }));
                      if (formErrors.startDate)
                        setFormErrors((prev) => ({ ...prev, startDate: "" }));
                    }}
                    className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 ${
                      formErrors.startDate
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-border-light focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-xs text-red-600 mt-1">
                      {formErrors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formState.endDate}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  type="submit"
                  className="h-10 rounded-lg bg-primary px-8 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-emerald-600 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                Add Member
              </h2>
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={handleCloseAddMember}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
              {/* Project select */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={addMemberProjectId}
                    onChange={(event) => {
                      const nextProjectId = event.target.value;
                      const nextProject = allProjects.find(
                        (item) => item.id === nextProjectId,
                      );
                      setAddMemberProjectId(nextProjectId);
                      setAddMemberProjectName(nextProject?.name ?? "");
                      setMemberDrafts([]);
                    }}
                    className="h-10 w-full rounded-md border border-border-light bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select project
                    </option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Employee search autocomplete */}
              <div className="relative add-member-select-dropdown">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Add Members <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
                    search
                  </span>
                  <input
                    type="text"
                    value={memberSearchTerm}
                    onChange={(e) => {
                      setMemberSearchTerm(e.target.value);
                      setIsAddMemberMembersOpen(true);
                    }}
                    onFocus={() => setIsAddMemberMembersOpen(true)}
                    placeholder={
                      addMemberProjectId
                        ? "Search by name or employee ID..."
                        : "Select a project first"
                    }
                    disabled={!addMemberProjectId}
                    className="w-full h-10 rounded-md border border-border-light bg-surface-light pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {memberSearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearchTerm("");
                        setIsAddMemberMembersOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        close
                      </span>
                    </button>
                  )}
                </div>

                {/* Results tooltip / popover */}
                {isAddMemberMembersOpen && addMemberProjectId && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-slate-200 bg-white shadow-2xl z-30 overflow-hidden">
                    {isAddMemberEmployeesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      </div>
                    ) : addMemberEmployees.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-[28px]">
                          person_search
                        </span>
                        <p className="text-sm">No employees found</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-1.5 border-b border-slate-100 bg-slate-50">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            {addMemberEmployees.length} result
                            {addMemberEmployees.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ul className="max-h-52 overflow-y-auto custom-scrollbar">
                          {addMemberEmployees.map((emp) => {
                            const isChecked = memberDrafts.some(
                              (d) => d.userId === emp.id,
                            );
                            return (
                              <li key={emp.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMemberDrafts((prev) =>
                                      isChecked
                                        ? prev.filter(
                                            (d) => d.userId !== emp.id,
                                          )
                                        : [
                                            ...prev,
                                            {
                                              userId: emp.id,
                                              enFullName: emp.enFullName,
                                              employeeId: emp.employeeId,
                                              allocationPercent: "",
                                            },
                                          ],
                                    );
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                    isChecked
                                      ? "bg-primary/5 hover:bg-primary/10"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  {/* Checkbox indicator */}
                                  <div
                                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                      isChecked
                                        ? "bg-primary border-primary"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {isChecked && (
                                      <span className="material-symbols-outlined text-white text-[12px] font-bold leading-none">
                                        check
                                      </span>
                                    )}
                                  </div>
                                  {/* Avatar */}
                                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">
                                      {emp.enFullName
                                        .split(" ")
                                        .slice(-2)
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                      {emp.enFullName}
                                    </p>
                                    <p className="text-xs text-slate-400 font-mono">
                                      {emp.employeeId}
                                    </p>
                                  </div>
                                  {isChecked && (
                                    <span className="shrink-0 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      Added
                                    </span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Members with allocationPercent */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Selected Members
                  </p>
                  {addMemberProjectName && (
                    <span className="text-xs text-slate-500">
                      {addMemberProjectName}
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {memberDrafts.length === 0 ? (
                    <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                      No members selected.
                    </div>
                  ) : (
                    memberDrafts.map((entry) => {
                      const allocVal = parseFloat(entry.allocationPercent);
                      const hasAllocError =
                        !entry.allocationPercent.trim() ||
                        isNaN(allocVal) ||
                        allocVal < 0 ||
                        allocVal > 100;

                      return (
                        <div
                          key={entry.userId}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {entry.enFullName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {entry.employeeId}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={entry.allocationPercent}
                              onChange={(event) => {
                                let value = event.target.value;
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue) && numValue > 100) {
                                  value = "100";
                                }
                                setMemberDrafts((prev) =>
                                  prev.map((item) =>
                                    item.userId === entry.userId
                                      ? { ...item, allocationPercent: value }
                                      : item,
                                  ),
                                );
                              }}
                              placeholder="Alloc %"
                              className={`h-9 w-24 rounded-md border ${
                                hasAllocError && entry.allocationPercent !== ""
                                  ? "border-red-400"
                                  : "border-border-light"
                              } bg-surface-light px-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                            />
                            {hasAllocError &&
                              entry.allocationPercent !== "" && (
                                <p className="text-[10px] text-red-500">
                                  0–100
                                </p>
                              )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberDrafts((prev) =>
                                prev.filter(
                                  (item) => item.userId !== entry.userId,
                                ),
                              )
                            }
                            className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            aria-label={`Remove ${entry.enFullName}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              close
                            </span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                className="h-10 rounded-lg bg-primary px-8 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-emerald-600 transition-all disabled:opacity-60"
                onClick={() => {
                  if (!addMemberProjectId) {
                    toast.error("Please select a project first");
                    return;
                  }
                  if (memberDrafts.length === 0) {
                    toast.error("Please select at least one member");
                    return;
                  }
                  const invalidAlloc = memberDrafts.find((m) => {
                    const v = parseFloat(m.allocationPercent);
                    return (
                      !m.allocationPercent.trim() ||
                      isNaN(v) ||
                      v < 0 ||
                      v > 100
                    );
                  });
                  if (invalidAlloc) {
                    toast.error(
                      "Allocation % must be a number between 0 and 100",
                    );
                    return;
                  }
                  setIsConfirmAddMemberOpen(true);
                }}
                disabled={!addMemberProjectId || memberDrafts.length === 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Add Members Modal */}
      {isConfirmAddMemberOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    group_add
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Confirm Add Members
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Add{" "}
                    <span className="font-semibold text-slate-700">
                      {memberDrafts.length} member
                      {memberDrafts.length !== 1 ? "s" : ""}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-700">
                      {addMemberProjectName}
                    </span>
                    ?
                  </p>
                  {/* Summary list */}
                  <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                    {memberDrafts.map((m) => (
                      <li
                        key={m.userId}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-700 truncate">
                          {m.enFullName}
                        </span>
                        <span className="ml-2 shrink-0 font-semibold text-primary">
                          {m.allocationPercent}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmAddMemberOpen(false)}
                  disabled={isAddingMembers}
                  className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAddingMembers}
                  onClick={() => {
                    addProjectMembers(
                      {
                        projectId: addMemberProjectId,
                        payload: {
                          members: memberDrafts.map((m) => ({
                            userId: m.userId,
                            allocationPercent: parseFloat(m.allocationPercent),
                          })),
                        },
                      },
                      {
                        onSuccess: (data) => {
                          toast.success(
                            data.message ||
                              `${memberDrafts.length} member${memberDrafts.length !== 1 ? "s" : ""} added successfully!`,
                          );
                          handleCloseAddMember();
                        },
                        onError: (err: unknown) => {
                          const message =
                            (
                              err as {
                                response?: { data?: { message?: string } };
                              }
                            )?.response?.data?.message ||
                            "Failed to add members. Please try again.";
                          toast.error(message);
                          setIsConfirmAddMemberOpen(false);
                        },
                      },
                    );
                  }}
                  className="h-9 px-5 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isAddingMembers ? (
                    <>
                      <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Adding...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">
                Project Details
              </h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
              {/* Project Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                      folder
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      {selectedProject.name}
                    </h4>
                    <p className="text-sm text-slate-500 font-mono">
                      {selectedProject.projectId}
                    </p>
                  </div>
                </div>

                {/* Project Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                      Project Manager
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedProject.pmName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                      Bank
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedProject.bankName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                      Project Code
                    </p>
                    <p className="text-sm font-semibold text-slate-900 font-mono">
                      {selectedProject.projectId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                      Created At
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(selectedProject.createdAt).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </p>
                  </div>

                  {selectedProject.projectLink && (
                    <div className="col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                        Project Link
                      </p>
                      <a
                        href={selectedProject.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {selectedProject.projectLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Team Members
                  </p>
                  <span className="text-xs text-slate-400">
                    {isDetailLoading
                      ? "..."
                      : (projectDetailData?.data?.memberCount ?? 0)}{" "}
                    members
                  </span>
                </div>

                {isDetailLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : projectDetailData?.data?.members &&
                  projectDetailData.data.members.length > 0 ? (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                    {projectDetailData.data.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              person
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {member.enFullName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {member.vnFullName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400">
                                {member.employeeId}
                              </span>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                  member.authorize_role === "ADMIN"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {member.authorize_role}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              member.status
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-slate-200/50 text-slate-500 border-slate-300/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.status
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {member.status ? "Active" : "Inactive"}
                          </span>
                          <span className="text-xs font-bold text-primary">
                            {member.allocationPercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg">
                    No members assigned to this project yet.
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
              {!isMember && (
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleEditProject(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
