import React from "react";
import type { Employee } from "../../types/index";

interface UserDetailModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  employee,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-slate-900">
            Employee Details
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 custom-scrollbar">
          {/* User Avatar and Name */}
          <div className="flex items-center gap-4">
            <div
              className={`h-20 w-20 rounded-full ${getAvatarColor(employee.id)} flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-lg`}
            >
              {getInitials(employee.enFullName)}
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">
                {employee.enFullName}
              </h4>
              <p className="text-sm text-slate-600">{employee.vnFullName}</p>
            </div>
          </div>

          {/* Employee Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="col-span-full">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Email Address
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-900">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  mail
                </span>
                <a
                  href={`mailto:${employee.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {employee.email}
                </a>
              </div>
            </div>

            {/* Role */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Role
              </p>
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold ${
                  employee.authorizeRole === "ADMIN"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                <span className="material-symbols-outlined text-[16px] mr-1">
                  {employee.authorizeRole === "ADMIN"
                    ? "admin_panel_settings"
                    : "person"}
                </span>
                {employee.authorizeRole}
              </span>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                Status
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest border ${
                  employee.status
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-slate-200/30 text-slate-600 border-slate-300/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${employee.status ? "bg-emerald-600" : "bg-slate-400"}`}
                ></span>
                {employee.status ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Description */}
            {employee.description && (
              <div className="col-span-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {employee.description}
                </p>
              </div>
            )}

            {/* Projects */}
            {employee.projects && employee.projects.length > 0 && (
              <div className="col-span-full">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                  Projects
                </p>
                <div className="space-y-2">
                  {employee.projects.map((project, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {project.projectName || "N/A"}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Role ID: {project.roleId || "N/A"}
                        </p>
                        {project.roleName && (
                          <p className="text-xs text-slate-600">
                            Role: {project.roleName}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-900">
                          {project.allocationPercent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
