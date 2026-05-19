import type { Coordinate } from "@/domain/location/coordinate";
import type { ITimezoneProvider } from "../../domain/location/ITimezoneProvider";
import type {
  ILocationDriver,
  GeolocationOptions,
} from "@/domain/location/ILocationManager";

export class LocationUseCases {
  constructor(
    private readonly locationManager: ILocationDriver,
    private readonly timezoneProvider: ITimezoneProvider
  ) {}

  /** Request permission and get current location. Returns coordinate on success. */
  async requestLocation(options?: GeolocationOptions): Promise<Coordinate> {
    const permission = await this.locationManager.checkPermission();
    if (permission.state === "denied") {
      throw new Error(permission.message ?? "Location permission denied");
    }

    if (permission.state === "prompt" || permission.state === "unknown") {
      const result = await this.locationManager.requestPermission();
      if (result.state === "prompt") {
        return this.locationManager.getCurrentPosition(options);
      }

      if (result.state !== "granted" && result.state !== "unknown") {
        throw new Error(result.message ?? "Location permission denied");
      }
    }

    return this.locationManager.getCurrentPosition(options);
  }

  /** Get current position without going through the permission flow (permission already granted). */
  async getCurrentPosition(options?: GeolocationOptions): Promise<Coordinate> {
    return this.locationManager.getCurrentPosition(options);
  }

  async getTimezoneFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    return this.timezoneProvider.getTimezone(latitude, longitude);
  }
}
