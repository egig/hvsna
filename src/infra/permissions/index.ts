import { Capacitor } from "@capacitor/core";
import type { IPermissionsProvider } from "../../domain/permissions/IPermissionsProvider";
import { CapacitorPermissionsProvider } from "./CapacitorPermissionsProvider";
import { BrowserPermissionsProvider } from "./BrowserPermissionsProvider";

export function createPermissionsProvider(): IPermissionsProvider {
  return Capacitor.isNativePlatform()
    ? new CapacitorPermissionsProvider()
    : new BrowserPermissionsProvider();
}
