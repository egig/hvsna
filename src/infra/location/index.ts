import { BrowserLocationDriver } from "./BrowserLocationDriver";
import type { ILocationDriver } from "@/domain/location/ILocationManager";

let locationInstance: ILocationDriver | null = null;

export function initLocationProvider(p: ILocationDriver): void {
  locationInstance = p;
}

export function createLocationProvider(): ILocationDriver {
  if (locationInstance) return locationInstance;
  return new BrowserLocationDriver();
}
