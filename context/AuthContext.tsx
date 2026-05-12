/**
 * Authentication Context
 * Manages authentication state across the application
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  getAuthToken,
  removeAuthToken,
  setAuthToken,
  setRefreshToken,
} from "../helpers/axios";
import { User } from "../types/index";
import axiosInstance from "../helpers/axios";
import { ENDPOINTS } from "../config/api";
import { resetQueries } from "../store/QueryProvider";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const checkAuth = useCallback((): boolean => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const accessToken = getAuthToken();
    const storedUser = localStorage.getItem("user");

    if (authStatus === "true" && accessToken) {
      setIsAuthenticated(true);
      setToken(accessToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
      return true;
    } else {
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  const login = useCallback(
    (accessToken: string, userData: User, refreshToken?: string) => {
    // Store token and user in localStorage
    setAuthToken(accessToken);
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(userData));

    // Verify token was stored
    // Update state
    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    },
    [],
  );

  const logout = useCallback(() => {
    removeAuthToken();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    resetQueries();
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const handleUserUpdated = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse updated user data:", error);
      }
    };

    window.addEventListener("auth:user-updated", handleUserUpdated);
    return () => {
      window.removeEventListener("auth:user-updated", handleUserUpdated);
    };
  }, []);

  // Periodic check for user status (every 10 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkUserStatus = async () => {
      try {
        // Use shared axios instance and /employees/me so we only check current logged-in account
        const response = await axiosInstance.get(ENDPOINTS.EMPLOYEES.ME);

        // Support both response shapes: { status: false, ... } and { data: { status: false, ... } }
        const profile = response?.data?.data ?? response?.data;
        const accountStatus = profile?.status;

        if (accountStatus === false) {
          console.warn(
            "[AuthContext] Current user account is inactive, logging out...",
          );
          logout();
          window.location.href = "/";
        }
      } catch (error) {
        const statusCode = (error as any)?.statusCode;

        // Unauthorized / forbidden means token or session is no longer valid
        if (statusCode === 401 || statusCode === 403) {
          logout();
          window.location.href = "/";
          return;
        }

        console.error("[AuthContext] Error checking user status:", error);
      }
    };

    // Check immediately on mount
    checkUserStatus();

    // Then check every 2 minutes
    const interval = setInterval(checkUserStatus, 120000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, logout]);

  const value: AuthContextType = {
    isAuthenticated,
    token,
    user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
