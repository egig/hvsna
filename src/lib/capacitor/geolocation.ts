// Dynamic imports for Capacitor plugins to avoid type errors when not available
let Capacitor: any = null;
let Geolocation: any = null;
let Position: any = null;

try {
  Capacitor = require("@capacitor/core").Capacitor;
  const capacitorGeolocation = require("@capacitor/geolocation");
  Geolocation = capacitorGeolocation.Geolocation;
  Position = capacitorGeolocation.Position;
} catch (error) {
  // Capacitor not available (e.g., during development/testing)
  console.warn("Capacitor not available:", error);
}

import type { Coordinate } from "../../modules/settings/settings";
import {
  CapacitorPermissionManager,
  type PermissionResult,
} from "./permissions";

export interface GeolocationResult extends Coordinate {
  timestamp: number;
  source: "capacitor" | "browser";
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Capacitor geolocation service with browser fallback
 */
export class CapacitorGeolocation {
  /**
   * Check if running on native platform
   */
  static isNativePlatform(): boolean {
    return Capacitor?.isNativePlatform() || false;
  }

  /**
   * Check location permissions
   */
  static async checkPermissions(): Promise<PermissionResult> {
    return CapacitorPermissionManager.checkLocationPermission();
  }

  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<PermissionResult> {
    return CapacitorPermissionManager.requestLocationPermission();
  }

  /**
   * Get current position using Capacitor (native) or browser API
   */
  static async getCurrentPosition(
    options: GeolocationOptions = {},
  ): Promise<GeolocationResult> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000, // 5 minutes
    } = options;

    if (this.isNativePlatform()) {
      return this.getCurrentPositionNative({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
    } else {
      return this.getCurrentPositionBrowser({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });
    }
  }

  /**
   * Get current position using Capacitor native API
   */
  private static async getCurrentPositionNative(
    options: GeolocationOptions,
  ): Promise<GeolocationResult> {
    if (!Geolocation) {
      throw new Error("Capacitor geolocation not available");
    }

    try {
      const position: any = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options.enableHighAccuracy,
        timeout: options.timeout,
        maximumAge: options.maximumAge,
      });

      return this.convertCapacitorPosition(position, "capacitor");
    } catch (error) {
      throw this.handleCapacitorError(error);
    }
  }

  /**
   * Get current position using browser API
   */
  private static async getCurrentPositionBrowser(
    options: GeolocationOptions,
  ): Promise<GeolocationResult> {
    if (!("geolocation" in navigator)) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(this.convertBrowserPosition(position, "browser"));
        },
        (error) => {
          reject(this.handleBrowserError(error));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge,
        },
      );
    });
  }

  /**
   * Watch position changes (for real-time updates)
   */
  static async watchPosition(
    callback: (position: GeolocationResult) => void,
    options: GeolocationOptions = {},
  ): Promise<string> {
    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 300000,
    } = options;

    if (this.isNativePlatform()) {
      if (!Geolocation) {
        throw new Error("Capacitor geolocation not available");
      }

      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy, timeout, maximumAge },
        (position: any, err: any) => {
          if (err) {
            console.error("Geolocation watch error:", err);
            return;
          }
          callback(this.convertCapacitorPosition(position, "capacitor"));
        },
      );
      return watchId.toString();
    } else {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback(this.convertBrowserPosition(position, "browser"));
        },
        (error) => {
          console.error("Geolocation watch error:", error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      );
      return watchId.toString();
    }
  }

  /**
   * Clear position watch
   */
  static async clearWatch(watchId: string): Promise<void> {
    if (this.isNativePlatform()) {
      if (!Geolocation) {
        throw new Error("Capacitor geolocation not available");
      }
      await Geolocation.clearWatch({ id: watchId });
    } else {
      if ("geolocation" in navigator) {
        navigator.geolocation.clearWatch(parseInt(watchId, 10));
      }
    }
  }

  /**
   * Convert Capacitor Position to our GeolocationResult
   */
  private static convertCapacitorPosition(
    position: any,
    source: "capacitor" | "browser",
  ): GeolocationResult {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp,
      source,
    };
  }

  /**
   * Convert browser Position to our GeolocationResult
   */
  private static convertBrowserPosition(
    position: GeolocationPosition,
    source: "capacitor" | "browser",
  ): GeolocationResult {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp,
      source,
    };
  }

  /**
   * Handle Capacitor-specific errors
   */
  private static handleCapacitorError(error: any): Error {
    if (error.message) {
      return new Error(error.message);
    }

    // Handle common Capacitor geolocation error codes
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return new Error("Location permission denied by user");
      case 2: // POSITION_UNAVAILABLE
        return new Error("Location information is unavailable");
      case 3: // TIMEOUT
        return new Error("Location request timed out");
      default:
        return new Error("Unknown error occurred while getting location");
    }
  }

  /**
   * Handle browser geolocation errors
   */
  private static handleBrowserError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error("Location permission denied by user");
      case error.POSITION_UNAVAILABLE:
        return new Error("Location information is unavailable");
      case error.TIMEOUT:
        return new Error("Location request timed out");
      default:
        return new Error("Unknown error occurred while getting location");
    }
  }

  /**
   * Check if location services are enabled (native platforms only)
   */
  static async isLocationEnabled(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return true; // Browser can't determine if location services are enabled
    }

    if (!Geolocation) {
      return false;
    }

    try {
      // Try to get a quick position to check if services are enabled
      await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 1000,
        maximumAge: 0,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
