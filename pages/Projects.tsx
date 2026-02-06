import React, { useMemo, useState } from 'react';

interface Project {
  id: string;
  name: string;
  pm: string;
  status: 'Active' | 'On Hold' | 'Completed';
  updatedAt: string;
}

const INITIAL_PROJECTS: Project[] = [
  { id: 'PRJ-101', name: 'Alpha ODC Platform', pm: 'Emily Blunt', status: 'Active', updatedAt: 'Feb 02, 2026' },
  { id: 'PRJ-102', name: 'Beta FinTech API', pm: 'David Kim', status: 'On Hold', updatedAt: 'Jan 28, 2026' },
  { id: 'PRJ-103', name: 'Gamma Mobile Suite', pm: 'Sarah Chen', status: 'Active', updatedAt: 'Feb 04, 2026' },
  { id: 'PRJ-104', name: 'Delta Analytics', pm: 'Mike Ross', status: 'Completed', updatedAt: 'Jan 19, 2026' }
];

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formState, setFormState] = useState({ name: '', pm: '' });

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, searchTerm]);

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const name = formState.name.trim();
    const pm = formState.pm.trim();
    if (!name || !pm) return;

    const newProject: Project = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      name,
      pm,
      status: 'Active',
      updatedAt: 'Feb 06, 2026'
    };

    setProjects((prev) => [newProject, ...prev]);
    setFormState({ name: '', pm: '' });
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Projects</h1>
        </div>

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
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Project</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Project Manager</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Status</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{project.name}</span>
                      <span className="text-xs text-slate-500 font-light">{project.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-700 font-normal">{project.pm}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                        project.status === 'Active'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : project.status === 'Completed'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          project.status === 'Active'
                            ? 'bg-primary'
                            : project.status === 'Completed'
                            ? 'bg-emerald-600'
                            : 'bg-amber-600'
                        }`}
                      ></span>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 font-light text-right">{project.updatedAt}</td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td className="py-10 px-6 text-sm text-slate-500" colSpan={4}>
                    No projects found. Try a different search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-lg border border-border-light">
            <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Create Project</h2>
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Project Name</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Enter project name"
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Project Manager</label>
                <input
                  type="text"
                  value={formState.pm}
                  onChange={(event) => setFormState((prev) => ({ ...prev, pm: event.target.value }))}
                  placeholder="Enter PM name"
                  className="w-full h-10 rounded-md border border-border-light bg-surface-light px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-border-light text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-emerald-600 transition-all"
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
