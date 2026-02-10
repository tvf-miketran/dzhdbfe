import React, { useEffect, useMemo, useState } from 'react';

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
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
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.members-select-dropdown')) {
        setIsMembersOpen(false);
      }
    };

    if (isMembersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMembersOpen]);

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
    if (!bank || !projectManager || validRows.length === 0 || membersAssigned.length === 0 || !startDate) return;

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
    }
    setFormState({
      bank: '',
      projectRows: [{ name: '', code: '' }],
      projectManager: '',
      membersAssigned: [],
      startDate: '',
      endDate: ''
    });
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

          <button
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg"
            onClick={() => setIsCreateOpen(true)}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Project
          </button>
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
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
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
                      onClick={() => handleEditProject(project)}
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
                    onChange={(event) => setFormState((prev) => ({ ...prev, bank: event.target.value }))}
                    className="h-10 w-full rounded-md border border-border-light bg-surface-light px-3 pr-9 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
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
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Project Manager <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.projectManager}
                  onChange={(event) => setFormState((prev) => ({ ...prev, projectManager: event.target.value }))}
                  placeholder="Project manager name"
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
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
              </div>
              <div className="members-select-dropdown relative">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Member's Assigned <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsMembersOpen((prev) => !prev)}
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-left text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary flex items-center justify-between"
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
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.startDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
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
              <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  type="button"
                  className="flex-1 h-10 rounded-lg border border-border-light text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-emerald-600 transition-all"
                >
                  Create
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
