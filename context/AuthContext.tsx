/**
 * Authentication Context
 * Manages authentication state across the application
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { getAuthToken, removeAuthToken, setAuthToken } from "../helpers/axios";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
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

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = (): boolean => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const accessToken = getAuthToken();

    if (authStatus === "true" && accessToken) {
      setIsAuthenticated(true);
      setToken(accessToken);
      return true;
    } else {
      setIsAuthenticated(false);
      setToken(null);
      return false;
    }
  };

  const login = (accessToken: string) => {
    // Store token in localStorage
    setAuthToken(accessToken);
    localStorage.setItem("isAuthenticated", "true");

    // Update state
    setToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem("isAuthenticated");
    setToken(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    token,
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
