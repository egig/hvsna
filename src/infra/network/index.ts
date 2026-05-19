import { Capacitor } from "@capacitor/core";
import type { INetworkDriver } from "../../domain/network/INetworkProvider";
import { CapacitorNetworkDriver } from "./CapacitorNetworkDriver";
import { BrowserNetworkDriver } from "./BrowserNetworkDriver";

let networkInstance: INetworkDriver | null = null;

export function initNetworkProvider(p: INetworkDriver): void {
  networkInstance = p;
}

export function createNetworkProvider(): INetworkDriver {
  if (networkInstance) return networkInstance;
  return Capacitor.isNativePlatform()
    ? new CapacitorNetworkDriver()
    : new BrowserNetworkDriver();
}
