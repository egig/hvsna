import { Geolocation, type Position } from "@capacitor/geolocation";
import type {
  ILocationProvider,
  LocationPermissionResult,
  GeolocationOptions,
} from "../../domain/settings/ILocationProvider";
import type { Coordinate } from "../../modules/settings/settings";

export class NativeLocationProvider implements ILocationProvider {
  async checkPermission(): Promise<LocationPermissionResult> {
    try {
      const status = await Geolocation.checkPermissions();
      return { state: this.mapState(status.location) };
    } catch (err) {
      return {
        state: "unknown",
        message: err instanceof Error ? err.message : undefined,
      };
    }
  }

  async requestPermission(): Promise<LocationPermissionResult> {
    try {
      const status = await Geolocation.requestPermissions();
      return { state: this.mapState(status.location) };
    } catch (err) {
      return {
        state: "denied",
        message:
          err instanceof Error ? err.message : "Failed to request permission",
      };
    }
  }

  async getCurrentPosition(
    options: GeolocationOptions = {},
  ): Promise<Coordinate> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000,
    } = options;

    let position: Position;
    try {
      position = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
    } catch (err: any) {
      throw this.mapError(err);
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
    };
  }

  private mapState(state: string): LocationPermissionResult["state"] {
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

  private mapError(err: any): Error {
    if (err?.message) return new Error(err.message);
    switch (err?.code) {
      case 1:
        return new Error("Location permission denied");
      case 2:
        return new Error("Location unavailable");
      case 3:
        return new Error("Location request timed out");
      default:
        return new Error("Failed to get location");
    }
  }
}
