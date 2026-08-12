import type { IPermissionsProvider } from "../../domain/permissions/IPermissionsProvider";
import { BrowserPermissionsProvider } from "./BrowserPermissionsProvider";

let permissionsInstance: IPermissionsProvider | null = null;

export function initPermissionsProvider(p: IPermissionsProvider): void {
  permissionsInstance = p;
}

export function createPermissionsProvider(): IPermissionsProvider {
  if (permissionsInstance) return permissionsInstance;
  return new BrowserPermissionsProvider();
}
