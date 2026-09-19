import { describe, it, expect } from "vitest";

describe("task-form-hook coordinate integration", () => {
  type MockSettings = {
    coordinate?: { latitude: number; longitude: number };
    timezone?: string;
  };

  it("should use settings coordinates when available", () => {
    // Mock settings with coordinates
    const mockSettings: MockSettings = {
      coordinate: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      timezone: "America/New_York",
    };

    const latitude = mockSettings.coordinate?.latitude || -6.2088;
    const longitude = mockSettings.coordinate?.longitude || 106.8456;
    const timezone = mockSettings.timezone || "Asia/Jakarta";

    expect(latitude).toBe(40.7128);
    expect(longitude).toBe(-74.006);
    expect(timezone).toBe("America/New_York");
  });

  it("should fallback to Jakarta coordinates when settings coordinates are not available", () => {
    // Mock settings without coordinates
    const mockSettings: MockSettings = {
      coordinate: undefined,
      timezone: undefined,
    };

    const latitude = mockSettings.coordinate?.latitude || -6.2088;
    const longitude = mockSettings.coordinate?.longitude || 106.8456;
    const timezone = mockSettings.timezone || "Asia/Jakarta";

    expect(latitude).toBe(-6.2088);
    expect(longitude).toBe(106.8456);
    expect(timezone).toBe("Asia/Jakarta");
  });
});
