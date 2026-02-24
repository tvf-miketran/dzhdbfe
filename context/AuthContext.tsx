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
import { getAuthToken, removeAuthToken, setAuthToken } from "../helpers/axios";
import { User } from "../types";

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
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

  const login = useCallback((accessToken: string, userData: User) => {
    console.log(
      "[AuthContext] Login called with token:",
      accessToken?.substring(0, 20) + "...",
    );
    console.log("[AuthContext] User data:", userData);

    // Store token and user in localStorage
    setAuthToken(accessToken);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("user", JSON.stringify(userData));

    // Verify token was stored
    const storedToken = localStorage.getItem("access_token");
    console.log("[AuthContext] Token stored successfully:", !!storedToken);

    // Update state
    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    removeAuthToken();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
