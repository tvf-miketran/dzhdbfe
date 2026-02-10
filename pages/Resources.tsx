
import React, { useState, useEffect } from 'react';
import { USER_PROJECTS_MOCK } from '../data/mock';

interface User {
  id: string;
  name: string;
  employeeId: string;
  project: string;
  role: 'PM' | 'QA' | 'BA' | 'DEV';
  ee: number;
  status: 'Active' | 'Inactive';
  avatar: string;
}

const USERS: User[] = [
  { id: '1', name: 'Sarah Chen', employeeId: 'TECH001', project: 'E-Commerce Platform', role: 'DEV', ee: 85, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '2', name: 'Mike Ross', employeeId: 'TECH002', project: 'Mobile App', role: 'QA', ee: 90, status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=mike' },
  { id: '3', name: 'Jessica Lee', employeeId: 'TECH003', project: 'CRM System', role: 'QA', ee: 95, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=jessica' },
  { id: '4', name: 'David Kim', employeeId: 'TECH004', project: 'Dashboard', role: 'DEV', ee: 80, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=david' },
  { id: '5', name: 'Emily Blunt', employeeId: 'TECH005', project: 'E-Commerce Platform', role: 'PM', ee: 100, status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=emily' },
];

const Resources: React.FC = () => {
  const [users, setUsers] = useState<User[]>(USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('DEV');
  const [selectedProject, setSelectedProject] = useState<string>('E-Commerce Platform');
  const [selectedStatus, setSelectedStatus] = useState<string>('Active');
  const [statusConfirm, setStatusConfirm] = useState<null | { id: string; nextStatus: 'Active' | 'Inactive' }>(null);
  const [resetConfirm, setResetConfirm] = useState<null | { id: string; name: string }>(null);
  const [formErrors, setFormErrors] = useState<{ project?: string; role?: string; eeByProject?: Record<string, string> }>({});
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const initialFormData = {
    nameVi: '',
    nameEn: '',
    employeeId: '',
    roleIds: [] as Array<'PM' | 'QA' | 'BA' | 'DEV'>,
    projectIds: [] as string[],
    eeByProject: {} as Record<string, string>,
    skills: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const roles = ['All', 'PM', 'QA', 'BA', 'DEV'];
  const roleOptions: Array<'PM' | 'QA' | 'BA' | 'DEV'> = ['PM', 'QA', 'BA', 'DEV'];
  const projects = ['All', 'E-Commerce Platform', 'Mobile App', 'CRM System', 'Dashboard'];
  const statuses = ['All', 'Active', 'Inactive'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.project-select-dropdown')) {
        setIsProjectDropdownOpen(false);
      }
    };

    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.role-select-dropdown')) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
    setIsProjectDropdownOpen(false);
    setIsRoleDropdownOpen(false);
    setFormData(initialFormData);
  };

  const getProjectName = (projectId: string) =>
    USER_PROJECTS_MOCK.find((project) => project.id === projectId)?.name ?? projectId;

  const toggleRoleSelection = (roleId: 'PM' | 'QA' | 'BA' | 'DEV') => {
    setFormData((prev) => {
      const isSelected = prev.roleIds.includes(roleId);
      const nextRoleIds = isSelected
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId];

      return {
        ...prev,
        roleIds: nextRoleIds
      };
    });

    setFormErrors((prev) => {
      if (!prev.role) return prev;
      const nextErrors = { ...prev } as { project?: string; role?: string; eeByProject?: Record<string, string> };
      delete nextErrors.role;
      return nextErrors;
    });
  };

  const toggleProjectSelection = (projectId: string) => {
    setFormData((prev) => {
      const isSelected = prev.projectIds.includes(projectId);
      const nextProjectIds = isSelected
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId];

      const nextEeByProject = { ...prev.eeByProject };
      if (isSelected) {
        delete nextEeByProject[projectId];
      }

      return {
        ...prev,
        projectIds: nextProjectIds,
        eeByProject: nextEeByProject
      };
    });

    setFormErrors((prev) => {
      if (!prev.project && !prev.eeByProject) return prev;
      const nextErrors = { ...prev } as { project?: string; eeByProject?: Record<string, string> };
      if (nextErrors.project) {
        delete nextErrors.project;
      }
      if (nextErrors.eeByProject && nextErrors.eeByProject[projectId]) {
        const { [projectId]: _removed, ...rest } = nextErrors.eeByProject;
        nextErrors.eeByProject = rest;
        if (Object.keys(rest).length === 0) {
          delete nextErrors.eeByProject;
        }
      }
      return nextErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { project?: string; role?: string; eeByProject?: Record<string, string> } = {};
    if (formData.projectIds.length === 0) {
      nextErrors.project = 'Please select at least one project.';
    }

    if (formData.roleIds.length === 0) {
      nextErrors.role = 'Please select at least one role.';
    }

    const eeErrors: Record<string, string> = {};
    formData.projectIds.forEach((projectId) => {
      const value = formData.eeByProject[projectId];
      const parsed = Number(value);
      if (value === undefined || value === '') {
        eeErrors[projectId] = 'EE% is required.';
        return;
      }
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        eeErrors[projectId] = 'EE% must be between 0 and 100.';
      }
    });

    if (Object.keys(eeErrors).length > 0) {
      nextErrors.eeByProject = eeErrors;
    }

    if (nextErrors.project || nextErrors.role || nextErrors.eeByProject) {
      setFormErrors(nextErrors);
      return;
    }

    setFormErrors({});
    // Handle form submission here
    console.log('New user:', {
      ...formData,
      fullName: {
        vi: formData.nameVi,
        en: formData.nameEn
      },
      roles: formData.roleIds,
      skills: formData.skills,
      projects: formData.projectIds.map((projectId) => ({
        id: projectId,
        name: getProjectName(projectId),
        ee: Number(formData.eeByProject[projectId])
      }))
    });
    handleCloseModal();
  };

  const selectedProjects = USER_PROJECTS_MOCK.filter((project) =>
    formData.projectIds.includes(project.id)
  );

  return (
    <div className="flex flex-col gap-8 p-6 md:px-8 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="flex-1 xl:max-w-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by employee name..."
              className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Filters and Create Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="relative filter-dropdown">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'role' ? null : 'role')}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-500 uppercase tracking-widest">Role:</span>
              <span className="text-slate-900">{selectedRole}</span>
              <span className="material-symbols-outlined text-[14px] text-slate-500">
                {openDropdown === 'role' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {openDropdown === 'role' && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[140px]">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedRole === role ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Filter */}
          <div className="relative filter-dropdown">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
                  <span className="text-slate-500 uppercase tracking-widest">Project:</span>
              <span className="text-slate-900 max-w-[120px] truncate">{selectedProject}</span>
              <span className="material-symbols-outlined text-[14px] text-slate-500">
                {openDropdown === 'project' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {openDropdown === 'project' && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[200px]">
                {projects.map((project) => (
                  <button
                    key={project}
                    onClick={() => {
                      setSelectedProject(project);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedProject === project ? 'bg-primary/10 text-primary font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            )}
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
                {statuses.map((status) => (
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

          {/* Create User Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors text-white shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create User
          </button>
        </div>
      </div>

      <div className="bg-surface-light border border-border-light rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-border-light">
              <tr>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Employee Name</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Employee ID</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Project</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Role</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Efficiency %</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Reset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <img src={user.avatar} className="h-10 w-10 rounded-full border border-border-light object-cover group-hover:scale-105 transition-transform" alt={user.name} />
                      <div className="font-semibold text-slate-900 text-sm">{user.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm font-mono text-slate-700">{user.employeeId}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-sm text-slate-900">{user.project}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      user.role === 'PM' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      user.role === 'QA' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      user.role === 'BA' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[80px]">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${user.ee}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 min-w-[40px]">{user.ee}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setStatusConfirm({
                          id: user.id,
                          nextStatus: user.status === 'Active' ? 'Inactive' : 'Active'
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border transition-colors ${
                        user.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-200/30 text-slate-600 border-slate-300/30 hover:bg-slate-200/50'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                      {user.status}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => setResetConfirm({ id: user.id, name: user.name })}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500 text-red-600 text-xs font-semibold bg-white hover:bg-red-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">undo</span>
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50 flex items-center justify-between border-t border-border-light">
          <div className="text-sm text-slate-600 font-normal">
            Showing <span className="font-semibold text-slate-900">1</span> to <span className="font-semibold text-slate-900">5</span> of <span className="font-semibold text-slate-900">124</span> results
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-border-light text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors disabled:opacity-50">Previous</button>
            <button className="px-4 py-2 rounded-lg bg-primary text-xs font-semibold text-white hover:bg-emerald-600 shadow-lg shadow-primary/20 transition-all">Next</button>
          </div>
        </div>
      </div>

      {/* Modal for creating new user */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">Create New User</h2>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
              {/* Employee names */}
              <div>
                <label htmlFor="nameVi" className="block text-sm font-medium text-slate-700 mb-2">
                  Vietnamese Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameVi"
                  type="text"
                  value={formData.nameVi}
                  onChange={(e) => setFormData({ ...formData, nameVi: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nguyen Van A"
                  required
                />
              </div>

              <div>
                <label htmlFor="nameEn" className="block text-sm font-medium text-slate-700 mb-2">
                  English Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameEn"
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Alex Nguyen"
                  required
                />
              </div>

              {/* Employee email */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-2">
                  Employee Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                  placeholder="TECH001"
                  required
                />
              </div>

              {/* Project */}
              <div className="project-select-dropdown relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsProjectDropdownOpen((prev) => !prev)}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 text-left outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all flex items-center justify-between"
                >
                  <span className="truncate">
                    {formData.projectIds.length === 0
                      ? 'Select project'
                      : formData.projectIds.length === 1
                      ? getProjectName(formData.projectIds[0])
                      : `${formData.projectIds.length} projects selected`}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    {isProjectDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isProjectDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto z-20">
                    {USER_PROJECTS_MOCK.map((project) => {
                      const isChecked = formData.projectIds.includes(project.id);
                      return (
                        <label
                          key={project.id}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProjectSelection(project.id)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="truncate">{project.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {formErrors.project && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.project}</p>
                )}
              </div>

              {/* Role */}
              <div className="role-select-dropdown relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 text-left outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all flex items-center justify-between"
                >
                  <span className="truncate">
                    {formData.roleIds.length === 0
                      ? 'Select role'
                      : formData.roleIds.length === 1
                      ? formData.roleIds[0]
                      : `${formData.roleIds.length} roles selected`}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-slate-400">
                    {isRoleDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-slate-200 bg-white shadow-xl max-h-52 overflow-y-auto z-20">
                    {roleOptions.map((role) => {
                      const isChecked = formData.roleIds.includes(role);
                      return (
                        <label
                          key={role}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRoleSelection(role)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span className="truncate">{role}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {formErrors.role && (
                  <p className="mt-2 text-xs text-red-600">{formErrors.role}</p>
                )}
              </div>

              {/* EE% by project */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  EE% by project <span className="text-red-500">*</span>
                </label>
                {selectedProjects.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Select a project to enter EE.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProjects.map((project) => {
                      const errorMessage = formErrors.eeByProject?.[project.id];
                      return (
                        <div key={project.id}>
                          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                            EE% - {project.name}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={formData.eeByProject[project.id] ?? ''}
                              onChange={(e) => {
                                const nextValue = e.target.value;
                                const parsed = Number(nextValue);
                                const clamped = Number.isNaN(parsed)
                                  ? nextValue
                                  : Math.max(0, Math.min(parsed, 100)).toString();
                                setFormData((prev) => ({
                                  ...prev,
                                  eeByProject: {
                                    ...prev.eeByProject,
                                    [project.id]: clamped
                                  }
                                }));
                                if (formErrors.eeByProject?.[project.id]) {
                                  setFormErrors((prev) => {
                                    const nextErrors = { ...prev } as {
                                      project?: string;
                                      eeByProject?: Record<string, string>;
                                    };
                                    if (nextErrors.eeByProject) {
                                      const { [project.id]: _removed, ...rest } = nextErrors.eeByProject;
                                      nextErrors.eeByProject = rest;
                                      if (Object.keys(rest).length === 0) {
                                        delete nextErrors.eeByProject;
                                      }
                                    }
                                    return nextErrors;
                                  });
                                }
                              }}
                              className={`w-full h-11 px-4 pr-10 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
                                errorMessage ? 'border-red-400' : 'border-slate-300'
                              }`}
                              placeholder="0"
                              aria-invalid={Boolean(errorMessage)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">%</span>
                          </div>
                          {errorMessage && (
                            <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-2">
                  Skills
                </label>
                <textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  placeholder="React, TypeScript, API testing..."
                />
              </div>

              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 px-4 rounded-lg bg-primary text-white font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {statusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Confirm Status Change</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to set this user to <span className="font-semibold">{statusConfirm.nextStatus}</span>?
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
                  setUsers((prev) =>
                    prev.map((user) =>
                      user.id === statusConfirm.id
                        ? { ...user, status: statusConfirm.nextStatus }
                        : user
                    )
                  );
                  setStatusConfirm(null);
                }}
                className={`px-3 py-2 rounded-md text-xs font-semibold text-white shadow-md transition-colors ${
                  statusConfirm.nextStatus === 'Active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-slate-700 hover:bg-slate-800'
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
              <h3 className="text-lg font-semibold text-slate-900">Confirm Reset</h3>
              <p className="text-sm text-slate-500 mt-1">
                Are you sure you want to reset user <span className="font-semibold">{resetConfirm.name}</span>?
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
    </div>
  );
};

export default Resources;
