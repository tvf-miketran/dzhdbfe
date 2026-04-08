import React, { useEffect, useState } from "react";
import { Page } from "../types/index";
import axiosInstance from "../helpers/axios";
import { useAuth } from "../context/AuthContext";
import { ENDPOINTS } from "../config/api";
import logoVer3 from "../img/techvify_logo_ver3.jpg";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

type SidebarRole = "ADMIN" | "MEMBER";

const normalizeRole = (role?: string | null): SidebarRole =>
  role?.toUpperCase() === "ADMIN" ? "ADMIN" : "MEMBER";

const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  onLogout,
  isMobileOpen = false,
  onClose,
}) => {
  const { user } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeRole, setEmployeeRole] = useState("");
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const roleFromStorage = (() => {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.authorize_role as string | undefined;
    } catch {
      return undefined;
    }
  })();

  const currentRole = normalizeRole(
    user?.authorize_role ?? roleFromStorage ?? employeeRole,
  );

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      setEmployeeLoading(true);
      try {
        const response = await axiosInstance.get(ENDPOINTS.EMPLOYEES.ME);
        const employee = response?.data?.data ?? response?.data;

        setEmployeeName(
          employee?.enFullName || employee?.vnFullName || "Unknown User",
        );
        setEmployeeRole(
          employee?.authorizeRole ||
            employee?.authorize_role ||
            employee?.description ||
            "Member",
        );
      } catch (error) {
        console.error("Failed to fetch sidebar employee info:", error);
        const storedUserRaw = localStorage.getItem("user");
        if (storedUserRaw) {
          try {
            const storedUser = JSON.parse(storedUserRaw);
            setEmployeeName(
              storedUser?.enFullName ||
                storedUser?.vnFullName ||
                storedUser?.name ||
                "Unknown User",
            );
            setEmployeeRole(
              storedUser?.authorizeRole ||
                storedUser?.authorize_role ||
                storedUser?.description ||
                "Member",
            );
          } catch {
            setEmployeeName("Unknown User");
            setEmployeeRole("Member");
          }
        } else {
          setEmployeeName("Unknown User");
          setEmployeeRole("Member");
        }
      } finally {
        setEmployeeLoading(false);
      }
    };

    fetchEmployeeInfo();

    const handleUserUpdated = () => {
      fetchEmployeeInfo();
    };

    window.addEventListener("auth:user-updated", handleUserUpdated);
    return () => {
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  const menuItems = [
    { id: Page.DASHBOARD, label: "Dashboard", icon: "dashboard" },
    { id: Page.ODASHBOARD, label: "ODashboard", icon: "analytics" },
    { id: Page.RESOURCES, label: "Users", icon: "group" },
    { id: Page.PROJECTS, label: "Projects", icon: "work" },
    { id: Page.LOGTICKETS, label: "Log Tickets", icon: "description" },
    { id: Page.OTICKET, label: "OTicket", icon: "assignment" },
    { id: Page.TIMESHEETS, label: "Logworks", icon: "schedule" },
  ].filter((item) => {
    if (currentRole === "ADMIN") {
      return item.id !== Page.DASHBOARD && item.id !== Page.LOGTICKETS;
    }

    return item.id !== Page.ODASHBOARD && item.id !== Page.OTICKET;
  });

  useEffect(() => {
    const hiddenPage =
      currentRole === "ADMIN" ? Page.DASHBOARD : Page.ODASHBOARD;

    if (activePage === hiddenPage) {
      const defaultPage =
        currentRole === "ADMIN" ? Page.ODASHBOARD : Page.DASHBOARD;
      onNavigate(defaultPage);
      window.location.hash = defaultPage;
    }
  }, [activePage, currentRole, onNavigate]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col justify-between border-r border-border-light bg-background-light p-4 h-full transition-transform duration-300 lg:static lg:translate-x-0 lg:flex ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:shrink-0`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2 py-2">
              <div className="flex aspect-square h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <img
                  src={logoVer3}
                  alt="DZH INTERNAL logo"
                  className="h-full w-full object-contain p-1"
                />
            </div>
            <div className="flex flex-col flex-1">
              <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                DZH INTERNAL
              </h1>
            </div>
            <button
              className="lg:hidden flex items-center text-slate-400 hover:text-slate-900"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <span className="material-symbols-outlined leading-none text-[20px]">
                close
              </span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  window.location.hash =
                    item.id === Page.TIMESHEETS
                      ? "timesheets-logwork"
                      : item.id;
                  onClose?.();
                }}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  activePage === item.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-600 hover:bg-surface-dark hover:text-slate-900"
                }`}
              >
                <span
                  className={`material-symbols-outlined ${activePage === item.id ? "fill-1" : ""}`}
                >
                  {item.icon}
                </span>
                <p className="text-sm font-medium">{item.label}</p>
              </button>
            ))}
          </nav>

          {currentRole === "ADMIN" && (
            <div>
              <p className="text-[10px] font-light text-slate-400 uppercase tracking-widest px-3 mb-2">
                System Settings
              </p>
              <button
                onClick={() => {
                  onNavigate(Page.EXPORTEXCEL);
                  window.location.hash = Page.EXPORTEXCEL;
                  onClose?.();
                }}
                className={`w-full mb-1 group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  activePage === Page.EXPORTEXCEL
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-600 hover:bg-surface-dark hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined">download</span>
                <p className="text-sm font-medium">Excel</p>
              </button>
              <button
                onClick={() => {
                  onNavigate(Page.FORMULACONFIG);
                  window.location.hash = Page.FORMULACONFIG;
                  onClose?.();
                }}
                className={`w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  activePage === Page.FORMULACONFIG
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-slate-600 hover:bg-surface-dark hover:text-slate-900"
                }`}
              >
                <span className="material-symbols-outlined">functions</span>
                <p className="text-sm font-medium">Formula Config</p>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-t border-border-light pt-4 px-1">
            <div className="h-10 w-10 rounded-full border border-border-light bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center">
              {getInitials(
                employeeLoading ? "Loading" : employeeName || "Unknown User",
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {employeeLoading
                  ? "Loading..."
                  : employeeName || "Unknown User"}
              </p>
              <p className="text-xs text-slate-500">
                {employeeLoading ? "Loading..." : employeeRole || "Member"}
              </p>
            </div>
            <div className="ml-auto relative">
              <button
                className="text-slate-400 hover:text-slate-900"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="Open profile menu"
              >
                <span className="material-symbols-outlined text-[18px]">
                  more_vert
                </span>
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
                      onClose?.();
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
    </>
  );
};

export default Sidebar;
