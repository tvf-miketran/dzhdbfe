
import React, { useState, useEffect } from 'react';

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
  const [formErrors, setFormErrors] = useState<{ ee?: string }>({});
  
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    project: '',
    role: 'DEV' as 'PM' | 'QA' | 'BA' | 'DEV',
    ee: ''
  });

  const roles = ['All', 'PM', 'QA', 'BA', 'DEV'];
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eeValue = Number(formData.ee);
    if (Number.isNaN(eeValue) || eeValue < 0 || eeValue > 100) {
      setFormErrors({ ee: 'EE% phải trong khoảng 0 đến 100.' });
      return;
    }
    setFormErrors({});
    // Handle form submission here
    console.log('New user:', formData);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      employeeId: '',
      project: '',
      role: 'DEV',
      ee: ''
    });
  };

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
            Tạo User
          </button>
        </div>
      </div>

      <div className="bg-surface-light border border-border-light rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-border-light">
              <tr>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Employee Name</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Employee ID</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Project</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Role</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Efficiency %</th>
                <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} className="h-10 w-10 rounded-full border border-border-light object-cover group-hover:scale-105 transition-transform" alt={user.name} />
                      <div className="font-semibold text-slate-900 text-sm">{user.name}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm font-mono text-slate-700">{user.employeeId}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-900">{user.project}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      user.role === 'PM' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                      user.role === 'QA' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      user.role === 'BA' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[80px]">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${user.ee}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-slate-700 min-w-[40px]">{user.ee}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-900">Tạo User Mới</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tên nhân viên */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Tên nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>

              {/* Mã nhân viên */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-slate-700 mb-2">
                  Mã nhân viên <span className="text-red-500">*</span>
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

              {/* Tên dự án */}
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-slate-700 mb-2">
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <input
                  id="project"
                  type="text"
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="E-Commerce Platform"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'PM' | 'QA' | 'BA' | 'DEV' })}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  required
                >
                  <option value="DEV">DEV</option>
                  <option value="QA">QA</option>
                  <option value="BA">BA</option>
                  <option value="PM">PM</option>
                </select>
              </div>

              {/* EE% */}
              <div>
                <label htmlFor="ee" className="block text-sm font-medium text-slate-700 mb-2">
                  EE% <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="ee"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ee}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      const parsed = Number(nextValue);
                      const clamped = Number.isNaN(parsed)
                        ? nextValue
                        : Math.max(0, Math.min(parsed, 100)).toString();
                      setFormData({ ...formData, ee: clamped });
                      if (formErrors.ee) {
                        setFormErrors({});
                      }
                    }}
                    className="w-full h-11 px-4 pr-10 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="0"
                    aria-invalid={Boolean(formErrors.ee)}
                    aria-describedby={formErrors.ee ? 'ee-error' : undefined}
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">%</span>
                </div>
                {formErrors.ee ? (
                  <p id="ee-error" className="text-xs text-red-500 mt-1">
                    {formErrors.ee}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Nhập giá trị từ 0 đến 100</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 px-4 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 px-4 rounded-lg bg-primary text-white font-medium hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20"
                >
                  Tạo User
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
    </div>
  );
};

export default Resources;
