import type { ISessionRepository } from "../../domain/auth/ISessionRepository";
import type { ITokenStore } from "../../domain/auth/ITokenStore";
import type { Session } from "../../domain/auth/Session";
import {
  NoSessionError,
  SessionExpiredError,
} from "../../domain/auth/AuthErrors";
import type { User } from "../../modules/auth/user";

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

export interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

/** Minimal HTTP interface — no axios dependency in the auth service */
export interface AuthHttpPort {
  post<T>(url: string, data?: unknown): Promise<T>;
  get<T>(url: string): Promise<T>;
}

export class AuthService {
  private refreshPromise: Promise<Session> | null = null;

  constructor(
    private readonly sessionRepo: ISessionRepository,
    private readonly tokenStore: ITokenStore,
    private readonly http: AuthHttpPort
  ) {}

  async login(credentials: LoginRequest): Promise<User> {
    const response = await this.http.post<BaseResponse<Session>>(
      "/login",
      credentials
    );
    this.tokenStore.setAccessToken(response.data.access_token);
    await this.sessionRepo.saveRefreshToken(response.data.refresh_token);
    const userResponse = await this.http.get<BaseResponse<User>>("/me");
    return userResponse.data;
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await this.http.post<BaseResponse<Session>>(
      "/register",
      userData
    );
    this.tokenStore.setAccessToken(response.data.access_token);
    await this.sessionRepo.saveRefreshToken(response.data.refresh_token);
    const userResponse = await this.http.get<BaseResponse<User>>("/me");
    return userResponse.data;
  }

  async logout(): Promise<void> {
    const refreshToken = await this.sessionRepo.getRefreshToken();
    if (refreshToken) {
      try {
        await this.http.post("/auth/logout", { refresh_token: refreshToken });
      } catch {
        // best-effort: clear local tokens regardless of server response
      }
    }
    this.tokenStore.clearAccessToken();
    await this.sessionRepo.clearRefreshToken();
  }

  async refreshSession(): Promise<Session> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this._doRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async _doRefresh(): Promise<Session> {
    const refreshToken = await this.sessionRepo.getRefreshToken();
    if (!refreshToken) throw new NoSessionError();
    try {
      const response = await this.http.post<BaseResponse<Session>>(
        "/auth/refresh",
        {
          refresh_token: refreshToken,
        }
      );
      this.tokenStore.setAccessToken(response.data.access_token);
      await this.sessionRepo.saveRefreshToken(response.data.refresh_token);
      return response.data;
    } catch {
      this.tokenStore.clearAccessToken();
      await this.sessionRepo.clearRefreshToken();
      throw new SessionExpiredError();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.http.get<BaseResponse<User>>("/me");
    return response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const hasAccess = !!this.tokenStore.getAccessToken();
    const hasRefresh = !!(await this.sessionRepo.getRefreshToken());
    return hasAccess && hasRefresh;
  }

  async initialize(): Promise<void> {
    const refreshToken = await this.sessionRepo.getRefreshToken();
    if (refreshToken && !this.tokenStore.getAccessToken()) {
      try {
        await this.refreshSession();
      } catch {
        await this.sessionRepo.clearRefreshToken();
      }
    }
  }
}
