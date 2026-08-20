import type { ISessionRepository } from "../../domain/auth/ISessionRepository";
import type { ITokenStore } from "../../domain/auth/ITokenStore";
import type { Session } from "../../domain/auth/Session";
import {
  NoSessionError,
  RefreshUnavailableError,
  SessionExpiredError,
} from "../../domain/auth/AuthErrors";
import type { User } from "../../modules/auth/user";

/**
 * The refresh token is rotate-on-use and shared across every tab (it lives
 * in IndexedDB, see WebSessionRepository), but each tab runs its own
 * AuthService instance. Without cross-tab coordination, two tabs refreshing
 * around the same time race to redeem the same token — the loser gets
 * rejected by the server even though the winner's rotation succeeded a
 * moment earlier. The Web Locks API serializes the read-refresh-write
 * critical section across tabs/windows on the same origin: a tab that was
 * waiting re-reads the (by then already-rotated) token from storage instead
 * of racing on a stale copy. Falls back to running unlocked where
 * navigator.locks isn't available (older Safari, tests).
 */
const REFRESH_LOCK_NAME = "hvsna-auth-refresh";

async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return fn();
  }
  // request()'s callback type permits returning T directly (it doesn't
  // await it for you when T itself is a Promise), so `await` here to
  // flatten the resulting Promise<Promise<T>> down to T.
  return await navigator.locks.request(REFRESH_LOCK_NAME, fn);
}

/** True only when the server itself rejected the refresh token (a genuine
 * auth failure), as opposed to a network/timeout/5xx error reaching it. */
function isAuthRejection(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 401
  );
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
    return withRefreshLock(() => this._doRefreshLocked());
  }

  private async _doRefreshLocked(): Promise<Session> {
    // Re-read inside the lock: another tab may have already rotated this
    // token while we were waiting our turn.
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
    } catch (error) {
      if (isAuthRejection(error)) {
        this.tokenStore.clearAccessToken();
        await this.sessionRepo.clearRefreshToken();
        throw new SessionExpiredError();
      }
      // Network error, timeout, or 5xx reaching /auth/refresh — the token
      // itself hasn't been rejected, so don't destroy the session over it.
      throw new RefreshUnavailableError();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.http.get<BaseResponse<User>>("/me");
    return response.data;
  }

  async verifyEmail(token: string): Promise<void> {
    await this.http.post("/auth/verify-email", { token });
  }

  async resendVerification(): Promise<void> {
    await this.http.post("/auth/resend-verification");
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
      } catch (error) {
        // Only drop the stored refresh token when the server actually
        // rejected it. A RefreshUnavailableError means we simply couldn't
        // reach the server right now (offline, timeout) — leave the token
        // in place so a later retry can still restore the session.
        if (error instanceof SessionExpiredError || error instanceof NoSessionError) {
          await this.sessionRepo.clearRefreshToken();
        }
      }
    }
  }
}
