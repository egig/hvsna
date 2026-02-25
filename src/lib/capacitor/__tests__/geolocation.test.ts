import { describe, it, expect, vi, beforeEach } from "vitest";

// Simple test to verify basic functionality without complex mocking
describe("Capacitor Geolocation Basic Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should import CapacitorGeolocation class", async () => {
    const { CapacitorGeolocation } = await import("../geolocation");
    expect(CapacitorGeolocation).toBeDefined();
    expect(typeof CapacitorGeolocation.isNativePlatform).toBe("function");
  });

  it("should import CapacitorPermissionManager class", async () => {
    const { CapacitorPermissionManager } = await import("../permissions");
    expect(CapacitorPermissionManager).toBeDefined();
    expect(typeof CapacitorPermissionManager.isNativePlatform).toBe("function");
  });

  it("should have correct static methods on CapacitorGeolocation", async () => {
    const { CapacitorGeolocation } = await import("../geolocation");

    expect(typeof CapacitorGeolocation.isNativePlatform).toBe("function");
    expect(typeof CapacitorGeolocation.checkPermissions).toBe("function");
    expect(typeof CapacitorGeolocation.requestPermissions).toBe("function");
    expect(typeof CapacitorGeolocation.getCurrentPosition).toBe("function");
    expect(typeof CapacitorGeolocation.watchPosition).toBe("function");
    expect(typeof CapacitorGeolocation.clearWatch).toBe("function");
    expect(typeof CapacitorGeolocation.isLocationEnabled).toBe("function");
  });

  it("should have correct static methods on CapacitorPermissionManager", async () => {
    const { CapacitorPermissionManager } = await import("../permissions");

    expect(typeof CapacitorPermissionManager.isNativePlatform).toBe("function");
    expect(typeof CapacitorPermissionManager.checkLocationPermission).toBe(
      "function",
    );
    expect(typeof CapacitorPermissionManager.requestLocationPermission).toBe(
      "function",
    );
  });

  it("should handle platform detection gracefully", async () => {
    const { CapacitorGeolocation } = await import("../geolocation");

    // This should not throw an error even if Capacitor is not available
    const isNative = CapacitorGeolocation.isNativePlatform();
    expect(typeof isNative).toBe("boolean");
  });
});
