
import React, { useState, useEffect } from 'react';
import { Page } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Projects from './pages/Projects';
import LogTickets from './pages/LogTickets';
import Performance from './pages/Performance';
import Logwork from './pages/Logwork';
import Profile from './pages/Profile';
import Login from './pages/Login';
import FormulaConfig from './pages/FormulaConfig';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);
  const [currentView, setCurrentView] = useState<string>('default'); // 'default', 'performance', 'logwork'

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    setActivePage(Page.DASHBOARD);
  };

  // Simple hash-based "routing" logic within the app to support navigation states
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('settings-performance')) {
        setActivePage(Page.SETTINGS);
        setCurrentView('performance');
      } else if (hash.startsWith('timesheets-logwork')) {
        setActivePage(Page.TIMESHEETS);
        setCurrentView('logwork');
      } else if (Object.values(Page).includes(hash as Page)) {
        setActivePage(hash as Page);
        setCurrentView('default');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderContent = () => {
    if (activePage === Page.SETTINGS && currentView === 'performance') {
      return <Performance />;
    }
    if (activePage === Page.TIMESHEETS && currentView === 'logwork') {
      return <Logwork />;
    }

    switch (activePage) {
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.RESOURCES:
        return <Resources />;
      case Page.PROJECTS:
        return <Projects />;
      case Page.LOGTICKETS:
        return <LogTickets />;
      case Page.TIMESHEETS:
        return <Logwork />;
      case Page.SETTINGS:
        return <Performance />;
      case Page.FORMULACONFIG:
        return <FormulaConfig />;
      case Page.PROFILE:
        return <Profile />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <p className="text-xl">This page ({activePage}) is currently under construction.</p>
          </div>
        );
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-background-light overflow-hidden font-sans">
      <Sidebar activePage={activePage} onNavigate={setActivePage} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activePage={activePage} />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
