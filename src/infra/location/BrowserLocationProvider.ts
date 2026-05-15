import type { Coordinate } from "@/domain/location/coordinate";
import type {
  ILocationManager,
  LocationPermissionResult,
  GeolocationOptions,
} from "@/domain/location/ILocationManager";

export class BrowserLocationProvider implements ILocationManager {
  async checkPermission(): Promise<LocationPermissionResult> {
    if (!("permissions" in navigator)) {
      return { state: "unknown" };
    }
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return { state: result.state as LocationPermissionResult["state"] };
    } catch {
      return { state: "unknown" };
    }
  }

  async requestPermission(): Promise<LocationPermissionResult> {
    // Browser permission is implicitly requested when calling getCurrentPosition.
    // We can't request it without triggering the actual position call.
    return { state: "prompt" };
  }

  async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<Coordinate> {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation is not supported by this browser");
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000,
    } = options;

    return new Promise<Coordinate>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
          });
        },
        (err) => reject(this.mapError(err)),
        { enableHighAccuracy, timeout, maximumAge }
      );
    });
  }

  private mapError(err: GeolocationPositionError): Error {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return new Error("Location permission denied");
      case err.POSITION_UNAVAILABLE:
        return new Error("Location unavailable");
      case err.TIMEOUT:
        return new Error("Location request timed out");
      default:
        return new Error("Failed to get location");
    }
  }
}
