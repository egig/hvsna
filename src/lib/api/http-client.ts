import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenManager } from '../auth/token-manager';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Create axios instance
export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authHeader = tokenManager.getAuthHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const responseData = error.response?.data as any;

    // Handle TOKEN_EXPIRED errors
    const isTokenExpired = error.response?.status === 401 && responseData?.code === 'TOKEN_EXPIRED';
    if (isTokenExpired && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true; // Mark that we've tried to refresh

      try {
        // Try to refresh the token
        await tokenManager.refreshAccessToken();
        
        // Get the new token and retry the original request
        const authHeader = tokenManager.getAuthHeader();
        if (authHeader.Authorization && originalRequest.headers) {
          originalRequest.headers.Authorization = authHeader.Authorization;
        }
        
        return httpClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, token is invalid
        await tokenManager.clearTokens();
        
        // Don't redirect here - let the auth context handle it
        // Just propagate the error so components can handle it
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden errors - don't retry, just propagate
    if (error.response?.status === 403) {
      const apiError: ApiError = {
        message: 'Access forbidden',
        status: 403,
        code: 'FORBIDDEN',
      };
      return Promise.reject(apiError);
    }

    // Handle other errors
    const apiError: ApiError = {
      message: responseData?.message || error.message || 'Request failed',
      status: error.response?.status,
      code: error.code,
    };

    return Promise.reject(apiError);
  }
);

// Helper functions for common API calls
export const api = {
  get: <T = any>(url: string, config?: any) => httpClient.get<T>(url, config).then(res => res.data),
  post: <T = any>(url: string, data?: any, config?: any) => httpClient.post<T>(url, data, config).then(res => res.data),
  put: <T = any>(url: string, data?: any, config?: any) => httpClient.put<T>(url, data, config).then(res => res.data),
  delete: <T = any>(url: string, config?: any) => httpClient.delete<T>(url, config).then(res => res.data),
  patch: <T = any>(url: string, data?: any, config?: any) => httpClient.patch<T>(url, data, config).then(res => res.data),
};

export default httpClient;
