
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  activePage: Page;
}

const Header: React.FC<HeaderProps> = ({ activePage }) => {
  const getPageTitle = () => {
    switch (activePage) {
      case Page.DASHBOARD: return 'Resource Dashboard';
      case Page.RESOURCES: return 'User Management';
      case Page.PROJECTS: return 'Projects';
      case Page.LOGTICKETS: return 'Log Tickets';
      case Page.SETTINGS: return 'Configuration';
      case Page.TIMESHEETS: return 'Logwork Management';
      case Page.PROFILE: return 'Personal Information';
      default: return activePage.charAt(0).toUpperCase() + activePage.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border-light bg-background-light/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-400">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h2 className="text-xl font-semibold text-slate-900 leading-relaxed">{getPageTitle()}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:relative md:flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search resources, projects..."
            className="h-9 w-64 rounded-md border border-border-light bg-surface-light px-10 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-surface-dark hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full border-2 border-background-dark bg-primary"></span>
          </button>
          
          <div className="hidden sm:block h-6 w-px bg-border-light mx-1"></div>
          
          <button className="lg:hidden h-9 w-9 overflow-hidden rounded-full border border-border-light">
            <img src="https://picsum.photos/seed/user/40/40" alt="Avatar" className="h-full w-full object-cover" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
