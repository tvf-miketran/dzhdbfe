import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: 'Active' | 'On Hold' | 'Completed';
  updatedAt: string;
  bank?: string;
  code?: string;
  membersAssigned?: string;
  startDate?: string;
  endDate?: string | null;
}

interface MemberAssignment {
  name: string;
  ee: string;
}

const INITIAL_PROJECTS: Project[] = [
  { id: 'PRJ-101', name: 'Alpha ODC Platform', pm: 'Emily Blunt', status: 'Active', updatedAt: 'Feb 02, 2026' },
  { id: 'PRJ-102', name: 'Beta FinTech API', pm: 'David Kim', status: 'On Hold', updatedAt: 'Jan 28, 2026' },
  { id: 'PRJ-103', name: 'Gamma Mobile Suite', pm: 'Sarah Chen', status: 'Active', updatedAt: 'Feb 04, 2026' },
  { id: 'PRJ-104', name: 'Delta Analytics', pm: 'Mike Ross', status: 'Completed', updatedAt: 'Jan 19, 2026' }
];

const BANK_LIST: string[] = [
  'Vietcombank',
  'BIDV',
  'VietinBank',
  'Techcombank',
  'ACB'
];

const MEMBER_LIST: string[] = [
  'Anh Tran',
  'Bao Nguyen',
  'Chi Pham',
  'Dat Le',
  'Khanh Vo',
  'Linh Nguyen',
  'Minh Tran'
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddMemberMembersOpen, setIsAddMemberMembersOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [addMemberProjectId, setAddMemberProjectId] = useState('');
  const [addMemberProjectName, setAddMemberProjectName] = useState('');
  const [memberDrafts, setMemberDrafts] = useState<MemberAssignment[]>([]);
  const [projectMemberAssignments, setProjectMemberAssignments] = useState<Record<string, MemberAssignment[]>>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formState, setFormState] = useState({
    bank: '',
    projectRows: [{ name: '', code: '' }],
    projectManager: '',
    membersAssigned: [] as string[],
    startDate: '',
    endDate: ''
  });

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let filtered = projects;
    
    // Filter by search term
    if (query) {
      filtered = filtered.filter((project) => project.name.toLowerCase().includes(query));
    }
    
    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter((project) => project.status === selectedStatus);
    }
    
    return filtered;
  }, [projects, searchTerm, selectedStatus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
      if (!target.closest('.members-select-dropdown')) {
        setIsMembersOpen(false);
      }
    };

    if (openDropdown || isMembersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown, isMembersOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.add-member-select-dropdown')) {
        setIsAddMemberMembersOpen(false);
      }
    };

    if (isAddMemberMembersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMemberMembersOpen]);

  const handleOpenAddMember = (project: Project) => {
    setAddMemberProjectId(project.id);
    setAddMemberProjectName(project.name);
    setMemberDrafts(projectMemberAssignments[project.id] ?? []);
    setIsAddMemberMembersOpen(false);
    setIsAddMemberOpen(true);
  };

  const handleCloseAddMember = () => {
    setIsAddMemberOpen(false);
    setIsAddMemberMembersOpen(false);
    setAddMemberProjectId('');
    setAddMemberProjectName('');
    setMemberDrafts([]);
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
    if (!bank) errors.bank = 'Bank is required';
    if (!projectManager) errors.projectManager = 'Project Manager is required';
    if (validRows.length === 0) errors.project = 'At least one project with name and code is required';
    if (membersAssigned.length === 0) errors.members = 'At least one member must be assigned';
    if (!startDate) errors.startDate = 'Start date is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }
    
    setFormErrors({});

    if (editingProjectId) {
      const updatedRow = validRows[0];
      const updatedProject: Project = {
        id: updatedRow.code,
        name: updatedRow.name,
        pm: projectManager,
        status: 'Active',
        updatedAt: startDate,
        bank,
        code: updatedRow.code,
        membersAssigned: membersAssigned.join(', '),
        startDate,
        endDate: endDate || null
      };

      setProjects((prev) =>
        prev.map((project) => (project.id === editingProjectId ? updatedProject : project))
      );
      setEditingProjectId(null);
      toast.success('Project updated successfully!');
    } else {
      const newProjects: Project[] = validRows.map((row) => ({
        id: row.code,
        name: row.name,
        pm: projectManager,
        status: 'Active',
        updatedAt: startDate,
        bank,
        code: row.code,
        membersAssigned: membersAssigned.join(', '),
        startDate,
        endDate: endDate || null
      }));

      setProjects((prev) => [...newProjects, ...prev]);
      toast.success(`${newProjects.length} project${newProjects.length > 1 ? 's' : ''} created successfully!`);
    }
    setFormState({
      bank: '',
      projectRows: [{ name: '', code: '' }],
      projectManager: '',
      membersAssigned: [],
      startDate: '',
      endDate: ''
    });
    setFormErrors({});
    setIsCreateOpen(false);
  };

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setFormState({
      bank: project.bank ?? '',
      projectRows: [{ name: project.name, code: project.code ?? project.id }],
      projectManager: project.pm ?? '',
      membersAssigned: project.membersAssigned
        ? project.membersAssigned.split(', ').filter((value) => value)
        : project.pm
        ? project.pm.split(', ').filter((value) => value)
        : [],
      startDate: project.startDate ?? project.updatedAt ?? '',
      endDate: project.endDate ?? ''
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by project name..."
              className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="relative filter-dropdown">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-500 uppercase tracking-widest">Status:</span>
              <span className="text-slate-900">{selectedStatus}</span>
              <span className="material-symbols-outlined text-[14px] text-slate-500">
                {openDropdown === 'status' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {openDropdown === 'status' && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[140px]">
                {['All', 'Active', 'On Hold', 'Completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedStatus === status ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filter Button */}
          {selectedStatus !== 'All' && (
            <button
              onClick={() => setSelectedStatus('All')}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Clear
            </button>
          )}

          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50"
              onClick={() => setIsAddMemberOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Member
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg"
              onClick={() => setIsCreateOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Project
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-white shadow-lg overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-border-light">
              <tr>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Project</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Project Manager</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Updated</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredProjects.map((project) => (
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
                      <span className="text-sm font-semibold text-slate-900">{project.name}</span>
                      <span className="text-xs text-slate-500 font-light">{project.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-slate-700 font-normal">{project.pm}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="relative inline-flex">
                      <select
                        value={project.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(event) => {
                          const nextStatus = event.target.value as Project['status'];
                          setProjects((prev) =>
                            prev.map((item) =>
                              item.id === project.id ? { ...item, status: nextStatus } : item
                            )
                          );
                        }}
                        className={`h-8 rounded-lg border px-3 text-center text-[11px] font-semibold uppercase tracking-widest outline-none appearance-none cursor-pointer transition-colors shadow-sm ${
                          project.status === 'Active'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : project.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center text-sm text-slate-500 font-light">{project.updatedAt}</td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(project);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td className="py-10 px-6 text-center text-sm text-slate-500" colSpan={5}>
                    No projects found. Try a different search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-border-light h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProjectId ? 'Edit Project' : 'Create Project'}
              </h2>
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Bank <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.bank}
                    onChange={(event) => {
                      setFormState((prev) => ({ ...prev, bank: event.target.value }));
                      if (formErrors.bank) setFormErrors(prev => ({ ...prev, bank: '' }));
                    }}
                    className={`h-10 w-full rounded-md border bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 appearance-none cursor-pointer ${
                      formErrors.bank ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-border-light focus:ring-primary focus:border-primary'
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
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                </div>
                {formErrors.bank && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.bank}</p>
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
                    setFormState((prev) => ({ ...prev, projectManager: event.target.value }));
                    if (formErrors.projectManager) setFormErrors(prev => ({ ...prev, projectManager: '' }));
                  }}
                  placeholder="Project manager name"
                  className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 ${
                    formErrors.projectManager ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-border-light focus:ring-primary focus:border-primary'
                  }`}
                />
                {formErrors.projectManager && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.projectManager}</p>
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
                          projectRows: [...prev.projectRows, { name: '', code: '' }]
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
                    <div key={`${row.code}-${index}`} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] items-center">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(event) =>
                          setFormState((prev) => {
                            const nextRows = [...prev.projectRows];
                            nextRows[index] = { ...nextRows[index], name: event.target.value };
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
                            nextRows[index] = { ...nextRows[index], code: event.target.value };
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
                            const nextRows = prev.projectRows.filter((_, rowIndex) => rowIndex !== index);
                            return { ...prev, projectRows: nextRows };
                          })
                        }
                        className="h-10 w-10 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                        aria-label="Remove project row"
                        disabled={formState.projectRows.length === 1 || Boolean(editingProjectId)}
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                {formErrors.project && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.project}</p>
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
                    formErrors.members ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-border-light focus:ring-primary focus:border-primary'
                  }`}
                >
                  <span className="truncate">
                    {formState.membersAssigned.length === 0
                      ? 'Select members'
                      : formState.membersAssigned.length === 1
                      ? formState.membersAssigned[0]
                      : `${formState.membersAssigned.length} members selected`}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    {isMembersOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isMembersOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto z-20">
                    {MEMBER_LIST.map((member) => {
                      const isChecked = formState.membersAssigned.includes(member);
                      return (
                        <label
                          key={member}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setFormState((prev) => {
                                const nextMembers = isChecked
                                  ? prev.membersAssigned.filter((name) => name !== member)
                                  : [...prev.membersAssigned, member];
                                if (formErrors.members) setFormErrors(prevErrors => ({ ...prevErrors, members: '' }));
                                return { ...prev, membersAssigned: nextMembers };
                              })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="truncate">{member}</span>
                        </label>
                      );
                    })}
                  </div>
                )}                {formErrors.members && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.members}</p>
                )}              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={(event) => {
                    setFormState((prev) => ({ ...prev, startDate: event.target.value }));
                    if (formErrors.startDate) setFormErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  className={`w-full h-10 rounded-md border bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 ${
                    formErrors.startDate ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-border-light focus:ring-primary focus:border-primary'
                  }`}
                />
                {formErrors.startDate && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">End Date</label>
                <input
                  type="date"
                  value={formState.endDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
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
              <h2 className="text-lg font-semibold text-slate-900">Add Member</h2>
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={handleCloseAddMember}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={addMemberProjectId}
                    onChange={(event) => {
                      const nextProjectId = event.target.value;
                      const nextProject = projects.find((item) => item.id === nextProjectId);
                      setAddMemberProjectId(nextProjectId);
                      setAddMemberProjectName(nextProject?.name ?? '');
                      setMemberDrafts(projectMemberAssignments[nextProjectId] ?? []);
                    }}
                    className="h-10 w-full rounded-md border border-border-light bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select project
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                </div>
              </div>
              <div className="relative add-member-select-dropdown">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Member <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddMemberMembersOpen((prev) => !prev)}
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-left text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary flex items-center justify-between"
                >
                  <span className="truncate">
                    {memberDrafts.length === 0
                      ? 'Select members'
                      : memberDrafts.length === 1
                      ? memberDrafts[0].name
                      : `${memberDrafts.length} members selected`}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    {isAddMemberMembersOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isAddMemberMembersOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto z-20">
                    {!addMemberProjectId ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Select a project first.
                      </div>
                    ) : (
                      MEMBER_LIST.map((member) => {
                        const isChecked = memberDrafts.some((entry) => entry.name === member);
                        return (
                          <label
                            key={member}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                setMemberDrafts((prev) =>
                                  isChecked
                                    ? prev.filter((entry) => entry.name !== member)
                                  : [...prev, { name: member, ee: '' }]
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <span className="truncate">{member}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Selected Members
                  </p>
                  {addMemberProjectName && (
                    <span className="text-xs text-slate-500">{addMemberProjectName}</span>
                  )}
                </div>
                <div className="mt-3 space-y-2">
                  {memberDrafts.length === 0 ? (
                    <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg px-4 py-3">
                      No members selected.
                    </div>
                  ) : (
                    memberDrafts.map((entry) => {
                      const eeValue = parseFloat(entry.ee);
                      const hasEEError = !entry.ee.trim() || isNaN(eeValue) || eeValue < 0 || eeValue > 100;
                      
                      return (
                        <div
                          key={entry.name}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                          </div>
                          <div className="flex flex-col">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={entry.ee}
                              onChange={(event) => {
                                let value = event.target.value;
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue) && numValue > 100) {
                                  value = '100';
                                }
                                setMemberDrafts((prev) =>
                                  prev.map((item) =>
                                    item.name === entry.name ? { ...item, ee: value } : item
                                  )
                                );
                              }}
                              placeholder="EE %"
                              className={`h-9 w-20 rounded-md border ${
                                hasEEError ? 'border-red-500' : 'border-border-light'
                              } bg-surface-light px-2 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberDrafts((prev) => prev.filter((item) => item.name !== entry.name))
                            }
                            className="h-9 w-9 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                            aria-label={`Remove ${entry.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
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
                    toast.error('Please select a project first');
                    return;
                  }
                  if (memberDrafts.length === 0) {
                    toast.error('Please select at least one member');
                    return;
                  }
                  
                  // Validate EE values
                  const invalidEE = memberDrafts.find((member) => {
                    const eeValue = parseFloat(member.ee);
                    return !member.ee.trim() || isNaN(eeValue) || eeValue < 0 || eeValue > 100;
                  });
                  
                  if (invalidEE) {
                    toast.error('EE must be a number between 0 and 100%');
                    return;
                  }
                  
                  setProjectMemberAssignments((prev) => ({
                    ...prev,
                    [addMemberProjectId]: memberDrafts
                  }));
                  setProjects((prev) =>
                    prev.map((project) =>
                      project.id === addMemberProjectId
                        ? { ...project, membersAssigned: memberDrafts.map((item) => item.name).join(', ') }
                        : project
                    )
                  );
                  toast.success(`${memberDrafts.length} member${memberDrafts.length > 1 ? 's' : ''} added to project!`);
                  handleCloseAddMember();
                }}
                disabled={!addMemberProjectId || memberDrafts.length === 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {isDetailModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-slate-900">Project Details</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedProject(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0">
              {/* Project Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[24px]">folder</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedProject.name}</h4>
                    <p className="text-sm text-slate-500 font-mono">{selectedProject.id}</p>
                  </div>
                </div>

                {/* Project Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Project Manager</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedProject.pm}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-widest ${
                      selectedProject.status === 'Active'
                        ? 'bg-primary/10 text-primary'
                        : selectedProject.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </div>

                  {selectedProject.bank && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Bank</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedProject.bank}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedProject.updatedAt}</p>
                  </div>

                  {selectedProject.startDate && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Start Date</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedProject.startDate}</p>
                    </div>
                  )}

                  {selectedProject.endDate && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">End Date</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedProject.endDate}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Members List */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Team Members</p>
                  <span className="text-xs text-slate-400">
                    {projectMemberAssignments[selectedProject.id]?.length || 0} members
                  </span>
                </div>
                {projectMemberAssignments[selectedProject.id] && projectMemberAssignments[selectedProject.id].length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                    {projectMemberAssignments[selectedProject.id].map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">Team Member</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">EE:</span>
                          <span className="text-sm font-bold text-primary">{member.ee}%</span>
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
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditProject(selectedProject);
                  setSelectedProject(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-emerald-600 text-sm font-semibold text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
