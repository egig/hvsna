import { Capacitor } from "@capacitor/core";
import type { IPermissionsProvider } from "../../domain/permissions/IPermissionsProvider";
import { CapacitorPermissionsProvider } from "./CapacitorPermissionsProvider";
import { BrowserPermissionsProvider } from "./BrowserPermissionsProvider";

let permissionsInstance: IPermissionsProvider | null = null;

export function initPermissionsProvider(p: IPermissionsProvider): void {
  permissionsInstance = p;
}

export function createPermissionsProvider(): IPermissionsProvider {
  if (permissionsInstance) return permissionsInstance;
  return Capacitor.isNativePlatform()
    ? new CapacitorPermissionsProvider()
    : new BrowserPermissionsProvider();
}
