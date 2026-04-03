import { Capacitor } from "@capacitor/core";
import type { ILocationProvider } from "../../domain/settings/ILocationProvider";
import { NativeLocationProvider } from "./NativeLocationProvider";
import { BrowserLocationProvider } from "./BrowserLocationProvider";

export function createLocationProvider(): ILocationProvider {
  return Capacitor.isNativePlatform()
    ? new NativeLocationProvider()
    : new BrowserLocationProvider();
}
