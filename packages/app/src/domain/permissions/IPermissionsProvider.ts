export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export interface PermissionResult {
  state: PermissionState;
  canRequest: boolean;
  message?: string;
}

export interface IPermissionsProvider {
  checkLocationPermission(): Promise<PermissionResult>;
  requestLocationPermission(): Promise<PermissionResult>;
}
