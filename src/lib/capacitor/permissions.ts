import { Capacitor } from "@capacitor/core";
import { Geolocation, type PermissionStatus } from "@capacitor/geolocation";

export type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export interface PermissionResult {
  state: PermissionState;
  canRequest: boolean;
  message?: string;
}

/**
 * Capacitor permission management for geolocation
 */
export class CapacitorPermissionManager {
  /**
   * Check if running on native platform
   */
  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Get current permission state
   */
  static async checkLocationPermission(): Promise<PermissionResult> {
    if (!this.isNativePlatform()) {
      // For web platforms, we'll need to check browser permissions
      if ("permissions" in navigator) {
        try {
          const permission = await navigator.permissions.query({
            name: "geolocation",
          });
          return {
            state: this.mapBrowserPermissionState(permission.state),
            canRequest: permission.state !== "denied",
          };
        } catch (error) {
          // Browser doesn't support permissions API
          return {
            state: "unknown",
            canRequest: true,
          };
        }
      }
      return {
        state: "unknown",
        canRequest: true,
      };
    }

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

  /**
   * Request location permission
   */
  static async requestLocationPermission(): Promise<PermissionResult> {
    if (!this.isNativePlatform()) {
      // For web platforms, permission is requested when getting location
      return {
        state: "prompt",
        canRequest: true,
      };
    }

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

  /**
   * Map Capacitor permission state to our PermissionState
   */
  private static mapCapacitorPermissionState(state: string): PermissionState {
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

  /**
   * Map browser permission state to our PermissionState
   */
  private static mapBrowserPermissionState(
    state: PermissionState,
  ): PermissionState {
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

  /**
   * Get user-friendly permission message
   */
  private static getPermissionMessage(state: PermissionState): string {
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
