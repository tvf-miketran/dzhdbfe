/**
 * Axios Instance Configuration
 * Pre-configured axios instance with interceptors and error handling
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import {
  API_BASE_URL,
  API_VERSION,
  TIMEOUTS,
  API_ERROR_CODES,
  ENDPOINTS,
} from "../../config/api";

/**
 * Custom error interface for API errors
 */
export interface ApiError {
  message: string;
  msg?: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
  errors?: string[];
}

/**
 * Create axios instance with default configuration
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_VERSION.V1}`,
  timeout: TIMEOUTS.DEFAULT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
      return;
    }

    if (token) {
      promise.resolve(token);
      return;
    }

    promise.reject(new Error("No token available after refresh"));
  });

  failedQueue = [];
};

const extractToken = (payload: any): string | null => {
  const token =
    payload?.access_token ||
    payload?.token ||
    payload?.data?.access_token ||
    payload?.data?.token ||
    payload?.user?.access_token ||
    null;

  return typeof token === "string" && token.length > 0 ? token : null;
};

const extractRefreshToken = (payload: any): string | null => {
  const token =
    payload?.refresh_token ||
    payload?.refreshToken ||
    payload?.data?.refresh_token ||
    payload?.data?.refreshToken ||
    payload?.user?.refresh_token ||
    payload?.user?.refreshToken ||
    null;

  return typeof token === "string" && token.length > 0 ? token : null;
};

const syncCurrentUserProfile = async (accessToken: string): Promise<void> => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_VERSION.V1}${ENDPOINTS.EMPLOYEES.ME}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
      timeout: TIMEOUTS.DEFAULT,
    });

    const profile = response?.data?.data ?? response?.data;
    if (profile) {
      localStorage.setItem("isAuthenticated", "true");
    }
  } catch (syncError) {
    if (import.meta.env.DEV) {
      console.warn("[Axios] Failed to sync current user profile after refresh", syncError);
    }
  }
};

const tryRefreshAccessToken = async (): Promise<string> => {
  const storedRefreshToken = localStorage.getItem("refresh_token");
  const currentAccessToken = localStorage.getItem("access_token");

  const refreshResponse = await axios.post(
    `${API_BASE_URL}${API_VERSION.V1}${ENDPOINTS.AUTH.REFRESH}`,
    storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(currentAccessToken
          ? { Authorization: `Bearer ${currentAccessToken}` }
          : {}),
      },
      timeout: TIMEOUTS.DEFAULT,
    },
  );

  const newAccessToken = extractToken(refreshResponse?.data);
  if (!newAccessToken) {
    throw new Error("Refresh token response does not contain access token");
  }

  localStorage.setItem("access_token", newAccessToken);

  const newRefreshToken = extractRefreshToken(refreshResponse?.data);
  if (newRefreshToken) {
    localStorage.setItem("refresh_token", newRefreshToken);
  }

  await syncCurrentUserProfile(newAccessToken);

  return newAccessToken;
};

const clearAuthStorage = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user");
};

/**
 * Request Interceptor
 * Adds authentication token and other headers to outgoing requests
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // Get authentication token from localStorage
    const token = localStorage.getItem("access_token");

    // Validate token before using it
    if (token && token !== "undefined" && token !== "null" && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token === "undefined" || token === "null") {
      // Clean up invalid token
      console.error("[Axios] Invalid token detected, removing:", token);
      localStorage.removeItem("access_token");
    }

    // Add ngrok bypass header for development
    if (config.headers) {
      config.headers["ngrok-skip-browser-warning"] = "true";
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor
 * Handles successful responses and error responses globally
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error("[API Response Error]", {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (
      error.response?.status === API_ERROR_CODES.UNAUTHORIZED &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (!originalRequest.headers) {
                originalRequest.headers = {};
              }
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshedAccessToken = await tryRefreshAccessToken();
        processQueue(null, refreshedAccessToken);

        if (!originalRequest.headers) {
          originalRequest.headers = {};
        }
        originalRequest.headers.Authorization = `Bearer ${refreshedAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === API_ERROR_CODES.FORBIDDEN) {
      console.error("Access forbidden - insufficient permissions");
      // You can dispatch a notification here
    }

    // Handle 404 Not Found
    if (error.response?.status === API_ERROR_CODES.NOT_FOUND) {
      console.error("Resource not found");
    }

    // Handle 422 Validation Error
    if (error.response?.status === API_ERROR_CODES.VALIDATION_ERROR) {
      console.error("Validation error", error.response.data);
    }

    // Handle 500 Server Error
    if (error.response?.status === API_ERROR_CODES.SERVER_ERROR) {
      console.error("Internal server error");
    }

    // Handle 503 Service Unavailable
    if (error.response?.status === API_ERROR_CODES.SERVICE_UNAVAILABLE) {
      console.error("Service temporarily unavailable");
    }

    // Handle Network Errors
    if (!error.response) {
      console.error("Network error - please check your connection");
    }

    // Transform error to consistent format
    const apiError: ApiError = {
      message:
        error.response?.data?.message ||
        error.response?.data?.msg ||
        error.message ||
        "An unexpected error occurred",
      statusCode: error.response?.status,
      code: error.code,
      details: error.response?.data?.details,
      errors: error.response?.data?.errors,
    };

    return Promise.reject(apiError);
  },
);

/**
 * Helper function to set auth token
 */
export const setAuthToken = (token: string): void => {
  if (!token || token === "undefined" || token === "null") {
    console.error("[setAuthToken] Invalid token provided:", token);
    removeAuthToken();
    return;
  }
  localStorage.setItem("access_token", token);
};

export const setRefreshToken = (token: string): void => {
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem("refresh_token");
    return;
  }
  localStorage.setItem("refresh_token", token);
};

/**
 * Helper function to remove auth token
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

/**
 * Helper function to get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("access_token");
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refresh_token");
};

/**
 * Export configured axios instance
 */
export default axiosInstance;
