import { Capacitor } from "@capacitor/core";
import type { INetworkProvider } from "../../domain/network/INetworkProvider";
import { CapacitorNetworkProvider } from "./CapacitorNetworkProvider";
import { BrowserNetworkProvider } from "./BrowserNetworkProvider";

let networkInstance: INetworkProvider | null = null;

export function initNetworkProvider(p: INetworkProvider): void {
  networkInstance = p;
}

export function createNetworkProvider(): INetworkProvider {
  if (networkInstance) return networkInstance;
  return Capacitor.isNativePlatform()
    ? new CapacitorNetworkProvider()
    : new BrowserNetworkProvider();
}
