import { api } from '../api/http-client';
import type { ApiError } from '../api/http-client';
import { tokenManager } from './token-manager';
import type { TokenPair } from './token-manager';
import type { User } from '../../modules/auth/user';

// Base response interface from OpenAPI spec
export interface BaseResponse<T = any> {
  code: string;
  message: string;
  data: T;
}

// Error response interface
export interface ErrorResponse {
  code: string;
  message: string;
  data: null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with email and password
  async login(credentials: LoginRequest): Promise<TokenPair> {
    try {
      const response = await api.post<BaseResponse<TokenPair>>('/login', credentials);
      await tokenManager.setTokens(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Register a new user
  async register(userData: RegisterRequest): Promise<TokenPair> {
    try {
      const response = await api.post<BaseResponse<TokenPair>>('/register', userData);
      await tokenManager.setTokens(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh access token
  async refreshToken(): Promise<TokenPair> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<BaseResponse<TokenPair>>('/auth/refresh', { refresh_token: refreshToken });
      await tokenManager.setTokens(response.data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Logout and revoke refresh token
  async logout(): Promise<void> {
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      if (refreshToken) {
        await api.post<BaseResponse<null>>('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn('Logout request failed:', error);
    } finally {
      // Always clear local tokens
      await tokenManager.clearTokens();
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<BaseResponse<User>>('/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    return tokenManager.hasTokens();
  }

  // Initialize auth state (call this on app start)
  async initialize(): Promise<void> {
    try {
      await tokenManager.initialize();
    } catch (error) {
      console.warn('Failed to initialize auth state:', error);
    }
  }

  // Handle API errors consistently
  private handleError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'message' in error) {
      return error as ApiError;
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      };
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const authService = AuthService.getInstance();
export default authService;
