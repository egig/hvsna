import { Capacitor } from "@capacitor/core";
import type { ILocationProvider } from "../../domain/settings/ILocationProvider";
import { NativeLocationProvider } from "./NativeLocationProvider";
import { BrowserLocationProvider } from "./BrowserLocationProvider";

let locationInstance: ILocationProvider | null = null;

export function initLocationProvider(p: ILocationProvider): void {
  locationInstance = p;
}

export function createLocationProvider(): ILocationProvider {
  if (locationInstance) return locationInstance;
  return Capacitor.isNativePlatform()
    ? new NativeLocationProvider()
    : new BrowserLocationProvider();
}
