import type { Coordinate } from "../../modules/settings/settings";

export interface LocationPermissionResult {
  state: "granted" | "denied" | "prompt" | "unknown";
  message?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface ILocationManager {
  checkPermission(): Promise<LocationPermissionResult>;
  requestPermission(): Promise<LocationPermissionResult>;
  getCurrentPosition(options?: GeolocationOptions): Promise<Coordinate>;
}
