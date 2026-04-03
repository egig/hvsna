import { secureStorage } from '../storage/secure-storage';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Access token operations (stored in memory)
  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  // Refresh token operations (stored in persistent storage)
  async getRefreshToken(): Promise<string | null> {
    return secureStorage.getRefreshToken();
  }

  async setRefreshToken(token: string): Promise<void> {
    await secureStorage.setRefreshToken(token);
  }

  async clearRefreshToken(): Promise<void> {
    await secureStorage.removeRefreshToken();
  }

  // Token pair operations
  async setTokens(tokens: TokenPair): Promise<void> {
    this.setAccessToken(tokens.access_token);
    await this.setRefreshToken(tokens.refresh_token);
  }

  async clearTokens(): Promise<void> {
    this.clearAccessToken();
    await this.clearRefreshToken();
  }

  // Check if we have valid tokens
  async hasTokens(): Promise<boolean> {
    const hasAccessToken = !!this.getAccessToken();
    const hasRefreshToken = !!(await this.getRefreshToken());
    return hasAccessToken && hasRefreshToken;
  }

  // Check if access token is expired (simple check - in production, you'd decode JWT)
  isAccessTokenExpired(): boolean {
    // For now, we'll rely on the server to tell us if the token is expired
    // In a more sophisticated implementation, you'd decode the JWT and check the exp claim
    return false;
  }

  // Get authorization header
  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const token = this.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Refresh access token using refresh token
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Refresh token is invalid or expired
          await this.clearTokens();
          throw new Error('Refresh token expired');
        }
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokens: TokenPair = await response.json();
      await this.setTokens(tokens);
      
      return tokens.access_token;
    } catch (error) {
      // If refresh fails, clear tokens and propagate error
      await this.clearTokens();
      throw error;
    }
  }

  // Initialize tokens from storage (call this on app start)
  async initialize(): Promise<void> {
    const refreshToken = await this.getRefreshToken();
    if (refreshToken && !this.getAccessToken()) {
      // We have a refresh token but no access token, try to refresh
      try {
        await this.refreshAccessToken();
      } catch (error) {
        // Refresh failed, clear the invalid refresh token
        await this.clearRefreshToken();
        console.warn('Failed to refresh access token on initialization:', error);
      }
    }
  }
}

export const tokenManager = TokenManager.getInstance();
export default tokenManager;
