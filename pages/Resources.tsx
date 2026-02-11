import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
}

interface User {
  id: string;
  name: string;
  employeeId: string;
  project: string;
  role: 'PM' | 'QA' | 'BA' | 'DEV';
  ee: number;
  status: 'Active' | 'Inactive';
  avatar: string;
  ticketCount: number;
  logworkHours: number;
  tickets: Ticket[];
}

const USERS: User[] = [
  { id: '1', name: 'Sarah Chen', employeeId: 'TECH001', project: 'E-Commerce Platform', role: 'DEV', ee: 85, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=sarah', ticketCount: 24, logworkHours: 152, tickets: [
    { id: 'OCD-101', title: 'Fix login authentication bug', status: 'Resolved' },
    { id: 'OCD-102', title: 'Implement payment gateway', status: 'In Progress' },
    { id: 'OCD-103', title: 'Update user profile page', status: 'Closed' },
    { id: 'OCD-104', title: 'Add product search feature', status: 'Open' },
  ] },
  { id: '2', name: 'Mike Ross', employeeId: 'TECH002', project: 'Mobile App', role: 'QA', ee: 90, status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=mike', ticketCount: 18, logworkHours: 128, tickets: [
    { id: 'OCD-201', title: 'Test user registration flow', status: 'Closed' },
    { id: 'OCD-202', title: 'Verify push notifications', status: 'Resolved' },
    { id: 'OCD-203', title: 'Check app performance', status: 'In Progress' },
  ] },
  { id: '3', name: 'Jessica Lee', employeeId: 'TECH003', project: 'CRM System', role: 'QA', ee: 95, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=jessica', ticketCount: 31, logworkHours: 168, tickets: [
    { id: 'OCD-301', title: 'Test contact management', status: 'Closed' },
    { id: 'OCD-302', title: 'Verify email integration', status: 'Resolved' },
    { id: 'OCD-303', title: 'Test reporting features', status: 'In Progress' },
    { id: 'OCD-304', title: 'Check data export', status: 'Open' },
  ] },
  { id: '4', name: 'David Kim', employeeId: 'TECH004', project: 'Dashboard', role: 'DEV', ee: 80, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=david', ticketCount: 15, logworkHours: 140, tickets: [
    { id: 'OCD-401', title: 'Create analytics dashboard', status: 'In Progress' },
    { id: 'OCD-402', title: 'Add chart components', status: 'Closed' },
    { id: 'OCD-403', title: 'Implement filters', status: 'Open' },
  ] },
  { id: '5', name: 'Emily Blunt', employeeId: 'TECH005', project: 'E-Commerce Platform', role: 'PM', ee: 100, status: 'Inactive', avatar: 'https://i.pravatar.cc/150?u=emily', ticketCount: 42, logworkHours: 160, tickets: [
    { id: 'OCD-501', title: 'Define sprint requirements', status: 'Closed' },
    { id: 'OCD-502', title: 'Review and approve designs', status: 'Resolved' },
    { id: 'OCD-503', title: 'Coordinate with stakeholders', status: 'In Progress' },
    { id: 'OCD-504', title: 'Plan next release', status: 'Open' },
  ] },
];

const Resources: React.FC = () => {
  const [users, setUsers] = useState<User[]>(USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [statusConfirm, setStatusConfirm] = useState<null | { id: string; nextStatus: 'Active' | 'Inactive' }>(null);
  const [resetConfirm, setResetConfirm] = useState<null | { id: string; name: string }>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const initialFormData = {
    nameVi: '',
    nameEn: '',
    employeeId: '',
    skills: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  const roles = ['All', 'PM', 'QA', 'BA', 'DEV'];
  const projects = ['All', 'E-Commerce Platform', 'Mobile App', 'CRM System', 'Dashboard'];
  const statuses = ['All', 'Active', 'Inactive'];

  // Filter users based on selected filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = selectedRole === 'All' || user.role === selectedRole;
      const matchesProject = selectedProject === 'All' || user.project === selectedProject;
      const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;
      return matchesRole && matchesProject && matchesStatus;
    });
  }, [users, selectedRole, selectedProject, selectedStatus]);

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.nameVi.trim()) errors.nameVi = 'Vietnamese name is required';
    if (!formData.nameEn.trim()) errors.nameEn = 'English name is required';
    if (!formData.employeeId.trim()) {
      errors.employeeId = 'Employee email is required';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.employeeId.trim())) {
        errors.employeeId = 'Invalid email format';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fill in all required fields');
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
      skills: formData.skills
    });
    toast.success('User created successfully!');
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:px-8 md:pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
      </div>

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
                className="w-full h-10 rounded-lg border border-border-light bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Clear Filter Button */}
            {(selectedRole !== 'All' || selectedProject !== 'All' || selectedStatus !== 'All') && (
              <button
                onClick={() => {
                  setSelectedRole('All');
                  setSelectedProject('All');
                  setSelectedStatus('All');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
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
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user);
                    setIsDetailModalOpen(true);
                  }}
                >
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setStatusConfirm({
                          id: user.id,
                          nextStatus: user.status === 'Active' ? 'Inactive' : 'Active'
                        });
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetConfirm({ id: user.id, name: user.name });
                      }}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
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
              {/* Vietnamese Name */}
              <div>
                <label htmlFor="nameVi" className="block text-sm font-medium text-slate-700 mb-2">
                  Vietnamese Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameVi"
                  type="text"
                  value={formData.nameVi}
                  onChange={(e) => {
                    setFormData({ ...formData, nameVi: e.target.value });
                    if (formErrors.nameVi) setFormErrors(prev => ({ ...prev, nameVi: '' }));
                  }}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                    formErrors.nameVi ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="Nguyen Van A"
                />
                {formErrors.nameVi && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nameVi}</p>
                )}
              </div>

              {/* English Name */}
              <div>
                <label htmlFor="nameEn" className="block text-sm font-medium text-slate-700 mb-2">
                  English Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="nameEn"
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => {
                    setFormData({ ...formData, nameEn: e.target.value });
                    if (formErrors.nameEn) setFormErrors(prev => ({ ...prev, nameEn: '' }));
                  }}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${
                    formErrors.nameEn ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="Alex Nguyen"
                />
                {formErrors.nameEn && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.nameEn}</p>
                )}
              </div>

              {/* Employee Email */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-2">
                  Employee Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="employeeId"
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeId: e.target.value });
                    if (formErrors.employeeId) setFormErrors(prev => ({ ...prev, employeeId: '' }));
                  }}
                  className={`w-full h-11 px-4 rounded-lg border bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all font-mono ${
                    formErrors.employeeId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300 focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="employee@company.com"
                />
                {formErrors.employeeId && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.employeeId}</p>
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
              <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-white">
                <button
                  type="submit"
                  className="h-11 rounded-lg bg-primary px-8 text-white font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20"
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
                  toast.success(`User status changed to ${statusConfirm.nextStatus}!`);
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
              <h3 className="text-lg font-semibold text-slate-900">User Details</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
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
                  <h4 className="text-xl font-bold text-slate-900">{selectedUser.name}</h4>
                  <p className="text-sm text-slate-500 font-mono">{selectedUser.employeeId}</p>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Project</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedUser.project}</p>
                </div>
                
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Role</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    selectedUser.role === 'PM' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    selectedUser.role === 'QA' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    selectedUser.role === 'BA' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {selectedUser.role}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                    selectedUser.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-slate-200/30 text-slate-600 border-slate-300/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                    {selectedUser.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Tickets</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">confirmation_number</span>
                    <span className="text-lg font-bold text-slate-900">{selectedUser.ticketCount}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Logwork Hours</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">schedule</span>
                    <span className="text-lg font-bold text-slate-900">{selectedUser.logworkHours}h</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Efficiency</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all" 
                        style={{ width: `${selectedUser.ee}%` }}
                      ></div>
                    </div>
                    <span className="text-lg font-bold text-primary">{selectedUser.ee}%</span>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Recent Tickets</p>
                  <span className="text-xs text-slate-400">{selectedUser.tickets.length} total</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                  {selectedUser.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-900 font-mono">{ticket.id}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest ${
                        ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                        ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                        ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
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
                  toast.success('Edit user feature coming soon!');
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

export default Resources;
