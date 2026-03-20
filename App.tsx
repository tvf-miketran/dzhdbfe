import React, { useState, useEffect } from "react";
import { Page } from "./types/index";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import ODashboard from "./pages/ODashboard";
import Resources from "./pages/Resources";
import Projects from "./pages/Projects";
import LogTickets from "./pages/LogTickets";
import OTicket from "./pages/OTicket";
import Logwork from "./pages/Logwork";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import FormulaConfig from "./pages/FormulaConfig";
import { useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { User } from "./types";

type AppRole = "ADMIN" | "MEMBER";

const normalizeRole = (role?: string | null): AppRole =>
  role?.toUpperCase() === "ADMIN" ? "ADMIN" : "MEMBER";

const getDefaultPageByRole = (role?: string | null): Page =>
  normalizeRole(role) === "ADMIN" ? Page.ODASHBOARD : Page.DASHBOARD;

const isPageHiddenForRole = (page: Page, role: AppRole): boolean => {
  if (role === "ADMIN") {
    return page === Page.DASHBOARD || page === Page.LOGTICKETS;
  }

  return page === Page.ODASHBOARD;
};

const getStoredRole = (): AppRole => {
  const storedUserRaw = localStorage.getItem("user");

  if (!storedUserRaw) return "MEMBER";

  try {
    const storedUser = JSON.parse(storedUserRaw);
    return normalizeRole(storedUser?.authorize_role);
  } catch {
    return "MEMBER";
  }
};

const App: React.FC = () => {
  const { isAuthenticated, logout: authLogout, checkAuth, user } = useAuth();
  const [activePage, setActivePage] = useState<Page>(() =>
    getDefaultPageByRole(getStoredRole()),
  );
  const [currentView, setCurrentView] = useState<string>("default"); // 'default', 'performance', 'logwork'

  const handleNavigate = (nextPage: Page) => {
    const currentRole = normalizeRole(user?.authorize_role ?? getStoredRole());

    if (isPageHiddenForRole(nextPage, currentRole)) {
      const defaultPage = getDefaultPageByRole(currentRole);
      setActivePage(defaultPage);
      setCurrentView("default");
      window.location.hash = defaultPage;
      return;
    }

    setActivePage(nextPage);
  };

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Handle login
  const handleLogin = (loggedInUser: User) => {
    // Auth context handles token storage
    checkAuth();

    const defaultPage = getDefaultPageByRole(loggedInUser?.authorize_role);

    // Redirect to role-based default page on login
    setActivePage(defaultPage);
    setCurrentView("default");
    window.location.hash = defaultPage;
  };

  // Handle logout
  const handleLogout = () => {
    authLogout();
    setActivePage(Page.DASHBOARD);
  };

  // Simple hash-based "routing" logic within the app to support navigation states
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const currentRole = normalizeRole(
        user?.authorize_role ?? getStoredRole(),
      );

      if (hash === Page.ODASHBOARD && currentRole !== "ADMIN") {
        setActivePage(Page.DASHBOARD);
        setCurrentView("default");
        window.location.hash = Page.DASHBOARD;
        return;
      }

      if (hash === Page.DASHBOARD && currentRole === "ADMIN") {
        setActivePage(Page.ODASHBOARD);
        setCurrentView("default");
        window.location.hash = Page.ODASHBOARD;
        return;
      }

      if (hash === Page.LOGTICKETS && currentRole === "ADMIN") {
        setActivePage(Page.ODASHBOARD);
        setCurrentView("default");
        window.location.hash = Page.ODASHBOARD;
        return;
      }

      if (hash.startsWith("timesheets-logwork")) {
        setActivePage(Page.TIMESHEETS);
        setCurrentView("logwork");
      } else if (Object.values(Page).includes(hash as Page)) {
        setActivePage(hash as Page);
        setCurrentView("default");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const currentRole = normalizeRole(user?.authorize_role ?? getStoredRole());
    if (isPageHiddenForRole(activePage, currentRole)) {
      const defaultPage = getDefaultPageByRole(currentRole);
      setActivePage(defaultPage);
      setCurrentView("default");
      window.location.hash = defaultPage;
    }
  }, [isAuthenticated, user, activePage]);

  const renderContent = () => {
    if (activePage === Page.TIMESHEETS && currentView === "logwork") {
      return <Logwork />;
    }

    switch (activePage) {
      case Page.DASHBOARD:
        return <Dashboard />;
      case Page.ODASHBOARD:
        return <ODashboard />;
      case Page.RESOURCES:
        return <Resources />;
      case Page.PROJECTS:
        return <Projects />;
      case Page.LOGTICKETS:
        return <LogTickets />;
      case Page.OTICKET:
        return <OTicket />;
      case Page.TIMESHEETS:
        return <Logwork />;
      case Page.FORMULACONFIG:
        return <FormulaConfig />;
      case Page.PROFILE:
        return <Profile />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="material-symbols-outlined text-6xl mb-4">
              construction
            </span>
            <p className="text-xl">
              This page ({activePage}) is currently under construction.
            </p>
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
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
