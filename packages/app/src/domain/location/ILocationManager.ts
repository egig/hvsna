import type { Coordinate } from "./coordinate";

export interface LocationPermissionResult {
  state: "granted" | "denied" | "prompt" | "unknown";
  message?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface ILocationDriver {
  checkPermission(): Promise<LocationPermissionResult>;
  requestPermission(): Promise<LocationPermissionResult>;
  getCurrentPosition(options?: GeolocationOptions): Promise<Coordinate>;
}
