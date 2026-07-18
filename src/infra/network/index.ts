import type { INetworkDriver } from "../../domain/network/INetworkProvider";
import { BrowserNetworkDriver } from "./BrowserNetworkDriver";

let networkInstance: INetworkDriver | null = null;

export function initNetworkProvider(p: INetworkDriver): void {
  networkInstance = p;
}

export function createNetworkProvider(): INetworkDriver {
  if (networkInstance) return networkInstance;
  return new BrowserNetworkDriver();
}
