import { Capacitor } from "@capacitor/core";
import { WebSessionRepository } from "./WebSessionRepository";
import { CapacitorSessionRepository } from "./CapacitorSessionRepository";
import { InMemoryTokenStore } from "./InMemoryTokenStore";
import { AuthUseCases } from "../../usecases/auth/AuthUseCases";
import { api } from "../../modules/api/http-client";
import type { ITokenStore } from "../../domain/auth/ITokenStore";
import type { AuthUseCases as IAuthUseCases } from "../../usecases/auth/AuthUseCases";

let authUseCasesInstance: IAuthUseCases | null = null;
let tokenStoreInstance: ITokenStore | null = null;

export function getTokenStore(): ITokenStore {
  if (!tokenStoreInstance) {
    tokenStoreInstance = new InMemoryTokenStore();
  }
  return tokenStoreInstance;
}

export function getAuthUseCases(): IAuthUseCases {
  if (!authUseCasesInstance) {
    const sessionRepo = Capacitor.isNativePlatform()
      ? new CapacitorSessionRepository()
      : new WebSessionRepository();

    authUseCasesInstance = new AuthUseCases(sessionRepo, getTokenStore(), api);
  }
  return authUseCasesInstance;
}

/** Reset singletons — for testing only */
export function _resetAuthSingletons(): void {
  authUseCasesInstance = null;
  tokenStoreInstance = null;
}
