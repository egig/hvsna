import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing the actual module
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

vi.mock("@capacitor/geolocation", () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
}));

// Mock browser geolocation
const mockNavigator = {
  geolocation: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  permissions: {
    query: vi.fn(),
  },
};

Object.defineProperty(global, "navigator", {
  value: mockNavigator,
  writable: true,
});

// Import after mocking
import { CapacitorGeolocation } from "../geolocation";
import { CapacitorPermissionManager } from "../permissions";

describe("CapacitorGeolocation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isNativePlatform", () => {
    it("should return true when on native platform", () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(true);

      expect(CapacitorGeolocation.isNativePlatform()).toBe(true);
    });

    it("should return false when on web platform", () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      expect(CapacitorGeolocation.isNativePlatform()).toBe(false);
    });
  });

  describe("checkPermissions", () => {
    it("should check Capacitor permissions on native platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(true);

      const mockPermissionResult = { state: "granted", canRequest: true };
      vi.spyOn(
        CapacitorPermissionManager,
        "checkPermissions",
      ).mockResolvedValue(mockPermissionResult);

      const result = await CapacitorGeolocation.checkPermissions();
      expect(result).toEqual(mockPermissionResult);
    });

    it("should check browser permissions on web platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      const mockPermissionResult = { state: "prompt", canRequest: true };
      vi.spyOn(
        CapacitorPermissionManager,
        "checkPermissions",
      ).mockResolvedValue(mockPermissionResult);

      const result = await CapacitorGeolocation.checkPermissions();
      expect(result).toEqual(mockPermissionResult);
    });
  });

  describe("getCurrentPosition", () => {
    it("should use Capacitor on native platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      const { Geolocation } = require("@capacitor/geolocation");

      Capacitor.isNativePlatform.mockReturnValue(true);

      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.006,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      Geolocation.getCurrentPosition.mockResolvedValue(mockPosition);

      const result = await CapacitorGeolocation.getCurrentPosition();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        accuracy: 10,
        altitude: undefined,
        altitudeAccuracy: undefined,
        heading: undefined,
        speed: undefined,
        timestamp: mockPosition.timestamp,
        source: "capacitor",
      });
    });

    it("should use browser API on web platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      const mockPosition = {
        coords: {
          latitude: 51.5074,
          longitude: -0.1278,
          accuracy: 15,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      mockNavigator.geolocation.getCurrentPosition.mockImplementation(
        (success) => {
          success(mockPosition);
        },
      );

      const result = await CapacitorGeolocation.getCurrentPosition();

      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
        accuracy: 15,
        altitude: undefined,
        altitudeAccuracy: undefined,
        heading: undefined,
        speed: undefined,
        timestamp: mockPosition.timestamp,
        source: "browser",
      });
    });

    it("should handle browser not supporting geolocation", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      // Remove geolocation from navigator
      delete (navigator as any).geolocation;

      await expect(CapacitorGeolocation.getCurrentPosition()).rejects.toThrow(
        "Geolocation is not supported by this browser",
      );
    });
  });

  describe("error handling", () => {
    it("should handle Capacitor permission denied error", async () => {
      const { Capacitor } = require("@capacitor/core");
      const { Geolocation } = require("@capacitor/geolocation");

      Capacitor.isNativePlatform.mockReturnValue(true);
      Geolocation.getCurrentPosition.mockRejectedValue({ code: 1 });

      await expect(CapacitorGeolocation.getCurrentPosition()).rejects.toThrow(
        "Location permission denied by user",
      );
    });

    it("should handle browser permission denied error", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      mockNavigator.geolocation.getCurrentPosition.mockImplementation(
        (success, reject) => {
          reject({ code: 1 });
        },
      );

      await expect(CapacitorGeolocation.getCurrentPosition()).rejects.toThrow(
        "Location permission denied by user",
      );
    });
  });

  describe("isLocationEnabled", () => {
    it("should return true on web platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      Capacitor.isNativePlatform.mockReturnValue(false);

      const result = await CapacitorGeolocation.isLocationEnabled();
      expect(result).toBe(true);
    });

    it("should check location services on native platform", async () => {
      const { Capacitor } = require("@capacitor/core");
      const { Geolocation } = require("@capacitor/geolocation");

      Capacitor.isNativePlatform.mockReturnValue(true);
      Geolocation.getCurrentPosition.mockResolvedValue({
        coords: { latitude: 0, longitude: 0, accuracy: 10 },
        timestamp: Date.now(),
      });

      const result = await CapacitorGeolocation.isLocationEnabled();
      expect(result).toBe(true);
    });
  });
});
