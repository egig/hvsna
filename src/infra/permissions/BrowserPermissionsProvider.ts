import type { IPermissionsProvider, PermissionResult, PermissionState } from "../../domain/permissions/IPermissionsProvider";

export class BrowserPermissionsProvider implements IPermissionsProvider {
  async checkLocationPermission(): Promise<PermissionResult> {
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

  async requestLocationPermission(): Promise<PermissionResult> {
    // For web platforms, permission is requested when getting location
    return {
      state: "prompt",
      canRequest: true,
    };
  }

  private mapBrowserPermissionState(
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
}
