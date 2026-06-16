import { Capacitor } from "@capacitor/core";
import { WebSessionRepository } from "./WebSessionRepository";
import { CapacitorSessionRepository } from "./CapacitorSessionRepository";
import { InMemoryTokenStore } from "./InMemoryTokenStore";
import { AuthService } from "./AuthService";
import { api } from "../../modules/api/http-client";
import type { ITokenStore } from "../../domain/auth/ITokenStore";
import type { ISessionRepository } from "../../domain/auth/ISessionRepository";

let authServiceInstance: AuthService | null = null;
let tokenStoreInstance: ITokenStore | null = null;

export function getTokenStore(): ITokenStore {
  if (!tokenStoreInstance) {
    tokenStoreInstance = new InMemoryTokenStore();
  }
  return tokenStoreInstance;
}

export function initAuthService(sessionRepo: ISessionRepository): void {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(sessionRepo, getTokenStore(), api);
  }
}

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    const sessionRepo = Capacitor.isNativePlatform()
      ? new CapacitorSessionRepository()
      : new WebSessionRepository();

    authServiceInstance = new AuthService(sessionRepo, getTokenStore(), api);
  }
  return authServiceInstance;
}

/** Reset singletons — for testing only */
export function _resetAuthSingletons(): void {
  authServiceInstance = null;
  tokenStoreInstance = null;
}
