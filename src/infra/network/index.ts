import { Capacitor } from "@capacitor/core";
import type { INetworkProvider } from "../../domain/network/INetworkProvider";
import { CapacitorNetworkProvider } from "./CapacitorNetworkProvider";
import { BrowserNetworkProvider } from "./BrowserNetworkProvider";

export function createNetworkProvider(): INetworkProvider {
  return Capacitor.isNativePlatform()
    ? new CapacitorNetworkProvider()
    : new BrowserNetworkProvider();
}
