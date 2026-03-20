import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  useProjectsPaginated,
  useAllProjects,
  useProjectWithMembers,
  useBanks,
  useProjectRoles,
} from "../hooks/queries/useProjectsQueries";
import { useEmployees } from "../hooks/queries/useUserQueries";
import {
  useAddProjectMembers,
  useCreateBank,
} from "../hooks/mutations/useProjectsMutations";
import { useAuth } from "../context/AuthContext";
import type { ProjectItem, Employee } from "../types/index";
import { Pagination } from "../components/pagination";
import { CreateProjectModal, EditProjectModal } from "../components/modal";

interface MemberAssignment {
  userId: string;
  enFullName: string;
  allocationPercent: string;
  roleId: string;
  projectRole: string;
}

const Projects: React.FC = () => {
  const { user } = useAuth();
  const isMember = (user?.authorize_role ?? "").toUpperCase() !== "ADMIN";

  // Pagination & search
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedBankId, setSelectedBankId] = useState("");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddMemberMembersOpen, setIsAddMemberMembersOpen] = useState(false);
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
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");

  // Ref to prevent double submission
  const isSubmittingRef = useRef(false);

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

  // Fetch banks for filter dropdown
  const { data: banksData } = useBanks();
  const bankList = banksData?.data ?? [];

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
    bank_id: selectedBankId || undefined,
  });

  // Fetch full project list for dropdowns (Add Member modal)
  const { data: allProjectsData } = useAllProjects();
  const allProjects: ProjectItem[] = allProjectsData?.data ?? [];

  const tableProjects: ProjectItem[] = projectsData?.data?.items ?? [];

  // Fetch full detail + members when the detail modal is open
  const { data: projectDetailData, isLoading: isDetailLoading } =
    useProjectWithMembers(selectedProject?.id ?? "");

  // Fetch project detail (incl. existing members) when a project is selected in Add Member modal
  const { data: addMemberProjectDetail, isLoading: isAddMemberProjectLoading } =
    useProjectWithMembers(addMemberProjectId);
  const existingProjectMembers = addMemberProjectDetail?.data?.members ?? [];

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

  const normalizedMemberSearch = memberSearchTerm.trim().toLowerCase();
  const displayedAddMemberEmployees = addMemberEmployees.filter((employee) => {
    if (!normalizedMemberSearch) return true;

    return (
      employee.enFullName?.toLowerCase().includes(normalizedMemberSearch) ||
      employee.vnFullName?.toLowerCase().includes(normalizedMemberSearch) ||
      employee.email?.toLowerCase().includes(normalizedMemberSearch)
    );
  });

  // Fetch project roles for role select in Add Member
  const { data: projectRolesData } = useProjectRoles();
  const projectMemberRoles =
    projectRolesData && projectRolesData.length > 0
      ? projectRolesData
      : [
          { id: "PM", name: "PM" },
          { id: "QA", name: "QA" },
          { id: "BA", name: "BA" },
          { id: "DEV", name: "DEV" },
        ];

  // Mutation: add members to a project
  const { mutate: addProjectMembers, isPending: isAddingMembers } =
    useAddProjectMembers();

  // Mutation: create a new bank
  const { mutate: createBank, isPending: isCreatingBank } = useCreateBank({
    onSuccess: (data) => {
      toast.success(`Bank "${data.data.name}" created successfully!`);
      setNewBankName("");
      setIsAddBankModalOpen(false);
      // Set the newly created bank as selected
      setSelectedBankId(data.data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create bank");
    },
  });

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
    isSubmittingRef.current = false;
    setIsAddMemberOpen(false);
    setIsAddMemberMembersOpen(false);
    setIsConfirmAddMemberOpen(false);
    setAddMemberProjectId("");
    setAddMemberProjectName("");
    setMemberDrafts([]);
    setMemberSearchTerm("");
    setDebouncedMemberSearch("");
  };

  const handleBankSelectChange = (value: string) => {
    if (value === "__add_new_bank__") {
      setIsAddBankModalOpen(true);
    } else {
      setSelectedBankId(value);
      setCurrentPage(1);
    }
  };

  const handleCreateBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) {
      toast.error("Please enter a bank name");
      return;
    }
    createBank({ name: newBankName.trim() });
  };

  const handleCloseAddBankModal = () => {
    setIsAddBankModalOpen(false);
    setNewBankName("");
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

          {/* Bank filter dropdown */}
          <div className="relative">
            <select
              value={selectedBankId}
              onChange={(e) => handleBankSelectChange(e.target.value)}
              className="h-10 rounded-lg border border-border-light bg-white pl-3 pr-8 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer min-w-[160px]"
            >
              <option value="">All Banks</option>
              {bankList.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
              <option
                value="__add_new_bank__"
                className="font-semibold text-primary"
              >
                + Add Bank
              </option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Clear filters button */}
          {(searchTerm || selectedBankId) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedBankId("");
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
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
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
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Project
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Project Manager
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Bank
                    </th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
                      Created At
                    </th>
                    {!isMember && (
                      <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-left">
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
                      <td className="py-4 px-6 text-left">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {project.name}
                          </span>
                          <span className="text-xs text-slate-500 font-light font-mono">
                            {project.projectId}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-left text-sm text-slate-700 font-normal">
                        {project.pmName}
                      </td>
                      <td className="py-4 px-6 text-left text-sm text-slate-700">
                        {project.bankName}
                      </td>
                      <td className="py-4 px-6 text-left text-sm text-slate-500 font-light">
                        {new Date(project.createdAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </td>
                      {!isMember && (
                        <td className="py-4 px-6 text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProjectId(project.id);
                              setIsEditOpen(true);
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

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditProjectModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingProjectId(null);
        }}
        projectId={editingProjectId ?? ""}
      />

      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
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
                        ? "Search by name..."
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
                    ) : displayedAddMemberEmployees.length === 0 ? (
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
                            {displayedAddMemberEmployees.length} result
                            {displayedAddMemberEmployees.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ul className="max-h-52 overflow-y-auto custom-scrollbar">
                          {displayedAddMemberEmployees.map((emp) => {
                            const isChecked = memberDrafts.some(
                              (d) => d.userId === emp.id,
                            );
                            const isAlreadyInProject =
                              existingProjectMembers.some(
                                (m) => m.userId === emp.id,
                              );
                            return (
                              <li key={emp.id}>
                                <button
                                  type="button"
                                  disabled={isAlreadyInProject}
                                  onClick={() => {
                                    if (isAlreadyInProject) return;

                                    // Get default role - ensure it always has a value
                                    let defaultRole =
                                      projectMemberRoles.find(
                                        (role) => role.name === "DEV",
                                      ) ?? projectMemberRoles[0];

                                    // Fallback if projectMemberRoles is empty
                                    if (!defaultRole) {
                                      defaultRole = { id: "DEV", name: "DEV" };
                                    }

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
                                              allocationPercent: "",
                                              roleId: defaultRole.id,
                                              projectRole: defaultRole.name,
                                            },
                                          ],
                                    );
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                    isAlreadyInProject
                                      ? "opacity-50 cursor-not-allowed bg-slate-50"
                                      : isChecked
                                        ? "bg-primary/5 hover:bg-primary/10"
                                        : "hover:bg-slate-50"
                                  }`}
                                >
                                  {/* Checkbox indicator */}
                                  <div
                                    className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                                      isAlreadyInProject
                                        ? "border-slate-300 bg-slate-100"
                                        : isChecked
                                          ? "bg-primary border-primary"
                                          : "border-slate-300"
                                    }`}
                                  >
                                    {isChecked && !isAlreadyInProject && (
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
                                    <p className="text-xs text-slate-400">
                                      {emp.vnFullName}
                                    </p>
                                  </div>
                                  {isAlreadyInProject ? (
                                    <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                                      In Project
                                    </span>
                                  ) : isChecked ? (
                                    <span className="shrink-0 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      Added
                                    </span>
                                  ) : null}
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

              {/* Current members (left) + Selected members (right) */}
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Left: current project members */}
                <div className="basis-[38%] max-w-[38%] min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      In Project
                    </p>
                    {existingProjectMembers.length > 0 && (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                        {existingProjectMembers.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {!addMemberProjectId ? (
                      <div className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                        Select a project to see current members.
                      </div>
                    ) : isAddMemberProjectLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                      </div>
                    ) : existingProjectMembers.length === 0 ? (
                      <div className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                        No members in this project yet.
                      </div>
                    ) : (
                      existingProjectMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">
                              {member.enFullName
                                .split(" ")
                                .slice(-2)
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {member.enFullName}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                            {member.allocationPercent}%
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-slate-200 self-stretch" />

                {/* Right: members being added */}
                <div className="basis-[62%] min-w-0 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Selected Members
                    </p>
                    {memberDrafts.length > 0 && (
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        {memberDrafts.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
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
                            </div>
                            <div className="flex items-start gap-2 shrink-0">
                              <select
                                value={entry.roleId}
                                onChange={(event) => {
                                  const selectedRole =
                                    projectMemberRoles.find(
                                      (role) => role.id === event.target.value,
                                    ) ?? projectMemberRoles[0];

                                  setMemberDrafts((prev) =>
                                    prev.map((item) =>
                                      item.userId === entry.userId
                                        ? {
                                            ...item,
                                            roleId: selectedRole.id,
                                            projectRole: selectedRole.name,
                                          }
                                        : item,
                                    ),
                                  );
                                }}
                                className="h-9 w-[150px] rounded-md border border-border-light bg-surface-light px-2 text-sm font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              >
                                {projectMemberRoles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>

                              <div className="flex flex-col items-end gap-0.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={entry.allocationPercent}
                                  onChange={(event) => {
                                    let value = event.target.value;
                                    // Remove non-numeric characters
                                    value = value.replace(/[^0-9]/g, "");
                                    const numValue = parseInt(value, 10);
                                    if (value && !isNaN(numValue) && numValue > 100) {
                                      value = "100";
                                    }
                                    setMemberDrafts((prev) =>
                                      prev.map((item) =>
                                        item.userId === entry.userId
                                          ? {
                                              ...item,
                                              allocationPercent: value,
                                            }
                                          : item,
                                      ),
                                    );
                                  }}
                                  placeholder="Alloc %"
                                  className={`h-9 w-24 rounded-md border ${
                                    hasAllocError &&
                                    entry.allocationPercent !== ""
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
                              className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                              aria-label={`Remove ${entry.enFullName}`}
                            >
                              <span className="material-symbols-outlined text-[16px]">
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
                  const missingRole = memberDrafts.find((m) => !m.roleId);
                  if (missingRole) {
                    toast.error("Please select role for all members");
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    group_add
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 leading-6">
                    Confirm Add Members
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Add selected members into this project?
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <span>Project</span>
                  <span className="text-primary">
                    {memberDrafts.length} member
                    {memberDrafts.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-slate-800 truncate">
                  {addMemberProjectName}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    Members, Role & Allocation
                  </p>
                </div>
                <ul className="max-h-44 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                  {memberDrafts.map((m) => (
                    <li
                      key={m.userId}
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-slate-700 truncate">
                        {m.enFullName}
                      </span>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                          {m.projectRole}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                          {m.allocationPercent}%
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmAddMemberOpen(false)}
   py             disabled={isAddingMembers}
                  className="h-10 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAddingMembers || isSubmittingRef.current}
                  onClick={() => {
                    // Prevent double submission
                    if (isSubmittingRef.current) return;

                    // Validate project is selected
                    if (!addMemberProjectId || !addMemberProjectId.trim()) {
                      toast.error("Please select a project", {
                        duration: 5000,
                      });
                      return;
                    }

                    // Validate at least one member is selected
                    if (memberDrafts.length === 0) {
                      toast.error("Please add at least one member", {
                        duration: 5000,
                      });
                      return;
                    }

                    // Validate all members have allocation and roleId
                    const invalidMembers = memberDrafts.filter((m) => {
                      const allocVal = parseFloat(m.allocationPercent);
                      const hasValidAlloc =
                        m.allocationPercent.trim() &&
                        !isNaN(allocVal) &&
                        allocVal >= 0 &&
                        allocVal <= 100;
                      const hasValidRole = m.roleId && m.roleId.trim();

                      if (!hasValidAlloc || !hasValidRole) {
                        console.warn(
                          `Invalid member: ${m.enFullName}, allocation: "${m.allocationPercent}", roleId: "${m.roleId}", valid: ${hasValidAlloc && hasValidRole}`,
                        );
                      }

                      return !hasValidAlloc || !hasValidRole;
                    });

                    if (invalidMembers.length > 0) {
                      toast.error(
                        invalidMembers.length === memberDrafts.length
                          ? "All members must have valid allocation and role"
                          : `${invalidMembers.length} member(s) have invalid allocation or role`,
                        { duration: 5000 },
                      );
                      return;
                    }

                    isSubmittingRef.current = true;

                    // Build payload with fallback to "DEV" if roleId is somehow empty
                    const payload = {
                      projectId: addMemberProjectId,
                      payload: {
                        members: memberDrafts.map((m) => {
                          const roleId = m.roleId || "DEV"; // Fallback to DEV
                          return {
                            userId: m.userId,
                            allocationPercent: parseFloat(m.allocationPercent),
                            roleId: roleId,
                          };
                        }),
                      },
                    };

                    addProjectMembers(payload, {
                      onSuccess: (data) => {
                        isSubmittingRef.current = false;
                        toast.success(
                          data.message ||
                            `${memberDrafts.length} member${memberDrafts.length !== 1 ? "s" : ""} added successfully!`,
                        );
                        handleCloseAddMember();
                      },
                      onError: (err: unknown) => {
                        isSubmittingRef.current = false;
                        const apiError = err as any;
                        if (
                          Array.isArray(apiError?.errors) &&
                          apiError.errors.length > 0
                        ) {
                          apiError.errors.forEach((errorMsg: string) => {
                            toast.error(errorMsg, { duration: 5000 });
                          });
                        } else {
                          toast.error(
                            apiError?.message || "Failed to add members",
                          );
                        }
                        setIsConfirmAddMemberOpen(false);
                      },
                    });
                  }}
                  className="h-10 px-5 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
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
                    if (selectedProject) {
                      setEditingProjectId(selectedProject.id);
                      setIsEditOpen(true);
                    }
                    setIsDetailModalOpen(false);
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

      {/* Add Bank Modal */}
      {isAddBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_balance
                </span>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add New Bank
                </h3>
              </div>
              <button
                onClick={handleCloseAddBankModal}
                disabled={isCreatingBank}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleCreateBank} className="p-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">
                  Bank Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="Enter bank name"
                  disabled={isCreatingBank}
                  autoFocus
                  className="h-11 px-4 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseAddBankModal}
                  disabled={isCreatingBank}
                  className="flex-1 h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBank || !newBankName.trim()}
                  className="flex-1 h-10 px-4 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingBank ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                      Add Bank
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
