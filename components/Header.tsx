import React from "react";
import { Page } from "../types/index";

interface HeaderProps {
  activePage: Page;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ activePage, onMenuClick }) => {
  const getPageTitle = () => {
    switch (activePage) {
      case Page.DASHBOARD:
        return "Resource Dashboard";
      case Page.RESOURCES:
        return "User Management";
      case Page.PROJECTS:
        return "Projects";
      case Page.LOGTICKETS:
        return "Log Tickets";
      case Page.FORMULACONFIG:
        return "Configuration";
      case Page.EXPORTEXCEL:
        return "Export Excel";
      case Page.TIMESHEETS:
        return "Logwork Management";
      case Page.PROFILE:
        return "Personal Information";
      default:
        return activePage.charAt(0).toUpperCase() + activePage.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border-light bg-background-light/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden flex items-center text-slate-400"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined leading-none">menu</span>
        </button>
        <h2 className="text-xl font-semibold text-slate-900 leading-relaxed">
          {getPageTitle()}
        </h2>
      </div>
    </header>
  );
};

export default Header;
