
import React, { useEffect, useState } from 'react';
import { Page } from '../types';
import axiosInstance from '../helpers/axios';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const getInitials = (fullName: string): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onLogout }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [employeeLoading, setEmployeeLoading] = useState(false);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      setEmployeeLoading(true);
      try {
        const storedUserRaw = localStorage.getItem('user');
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        const employeeUuid = storedUser?.UUID || storedUser?.id;

        if (!employeeUuid) {
          setEmployeeName('Unknown User');
          setEmployeeRole('Member');
          return;
        }

        const response = await axiosInstance.get(`/employees/${employeeUuid}`);
        const employee = response?.data?.data ?? response?.data;

        setEmployeeName(employee?.enFullName || employee?.vnFullName || 'Unknown User');
        setEmployeeRole(employee?.authorizeRole || employee?.description || 'Member');
      } catch (error) {
        console.error('Failed to fetch sidebar employee info:', error);
        setEmployeeName('Unknown User');
        setEmployeeRole('Member');
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployeeInfo();
  }, []);

  const menuItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { id: Page.ODASHBOARD, label: 'ODashboard', icon: 'analytics' },
    { id: Page.RESOURCES, label: 'Users', icon: 'group' },
    { id: Page.PROJECTS, label: 'Projects', icon: 'work' },
    { id: Page.LOGTICKETS, label: 'Log Tickets', icon: 'description' },
    { id: Page.OTICKET, label: 'OTicket', icon: 'assignment' },
    { id: Page.TIMESHEETS, label: 'Logworks', icon: 'schedule' },
  ];

  return (
    <div className="hidden lg:flex w-64 flex-col justify-between border-r border-border-light bg-background-light p-4 shrink-0 h-full">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="bg-primary/10 flex aspect-square h-10 w-10 items-center justify-center rounded-lg text-primary">
            <span className="material-symbols-outlined fill-1">grid_view</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold text-slate-900 tracking-tight">ODC Manager</h1>
            <p className="text-xs font-light text-slate-500">Admin Console</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                window.location.hash = item.id === Page.TIMESHEETS ? 'timesheets-logwork' : item.id;
              }}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${activePage === item.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-600 hover:bg-surface-dark hover:text-slate-900'
                }`}
            >
              <span className={`material-symbols-outlined ${activePage === item.id ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <p className="text-sm font-medium">{item.label}</p>
            </button>
          ))}
        </nav>

        <div>
          <p className="text-[10px] font-light text-slate-400 uppercase tracking-widest px-3 mb-2">System Settings</p>
          <button
            onClick={() => { onNavigate(Page.FORMULACONFIG); window.location.hash = Page.FORMULACONFIG; }}
            className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${activePage === Page.FORMULACONFIG
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-slate-600 hover:bg-surface-dark hover:text-slate-900'
              }`}
          >
            <span className="material-symbols-outlined">functions</span>
            <p className="text-sm font-medium">Formula Config</p>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 border-t border-border-light pt-4 px-1">
          <div className="h-10 w-10 rounded-full border border-border-light bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center">
            {getInitials(employeeLoading ? 'Loading' : employeeName || 'Unknown User')}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{employeeLoading ? 'Loading...' : employeeName || 'Unknown User'}</p>
            <p className="text-xs text-slate-500">{employeeLoading ? 'Loading...' : employeeRole || 'Member'}</p>
          </div>
          <div className="ml-auto relative">
            <button
              className="text-slate-400 hover:text-slate-900"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-label="Open profile menu"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 bottom-10 z-20 w-56 rounded-xl border border-border-light bg-white shadow-xl"
                role="menu"
              >
                <button
                  className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-surface-dark"
                  role="menuitem"
                  onClick={() => {
                    onNavigate(Page.PROFILE);
                    window.location.hash = Page.PROFILE;
                    setIsProfileMenuOpen(false);
                  }}
                >
                  Manage Profile
                </button>
                <div className="h-px bg-border-light"></div>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-surface-dark"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
