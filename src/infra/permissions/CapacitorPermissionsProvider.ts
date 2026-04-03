import { Geolocation, type PermissionStatus } from "@capacitor/geolocation";
import type { IPermissionsProvider, PermissionResult, PermissionState } from "../../domain/permissions/IPermissionsProvider";

export class CapacitorPermissionsProvider implements IPermissionsProvider {
  async checkLocationPermission(): Promise<PermissionResult> {
    try {
      const permissionStatus: PermissionStatus =
        await Geolocation.checkPermissions();
      return {
        state: this.mapCapacitorPermissionState(permissionStatus.location),
        canRequest: permissionStatus.location !== "denied",
      };
    } catch (error) {
      return {
        state: "unknown",
        canRequest: true,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error checking permissions",
      };
    }
  }

  async requestLocationPermission(): Promise<PermissionResult> {
    try {
      const permissionStatus: PermissionStatus =
        await Geolocation.requestPermissions();
      const state = this.mapCapacitorPermissionState(permissionStatus.location);

      return {
        state,
        canRequest: state !== "denied",
        message: this.getPermissionMessage(state),
      };
    } catch (error) {
      return {
        state: "denied",
        canRequest: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to request location permission",
      };
    }
  }

  private mapCapacitorPermissionState(state: string): PermissionState {
    switch (state) {
      case "granted":
        return "granted";
      case "denied":
        return "denied";
      case "prompt":
        return "prompt";
      default:
        return "unknown";
    }
  }

  private getPermissionMessage(state: PermissionState): string {
    switch (state) {
      case "granted":
        return "Location permission granted";
      case "denied":
        return "Location permission denied. Please enable in device settings.";
      case "prompt":
        return "Location permission required";
      default:
        return "Permission status unknown";
    }
  }
}
