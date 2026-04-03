import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FetchHttpClient,
  IpLocationService,
  getLocationFromIp,
} from "../location";
import type {
  Location,
  IpApiResponse,
  HttpClient,
  LocationService,
} from "../location";

// Mock data
const mockIpApiResponse: IpApiResponse = {
  latitude: 40.7128,
  longitude: -74.006,
  city: "New York",
  region: "New York",
  country: "US",
  country_name: "United States",
  ip: "192.168.1.1",
  postal: "10001",
  timezone: "America/New_York",
  utc_offset: "-05:00",
  country_calling_code: "+1",
  currency: "USD",
  languages: "en-US,es-US,haw,fr",
  asn: "AS7922",
  org: "Comcast Cable Communications, LLC",
};

const mockLocation: Location = {
  latitude: 40.7128,
  longitude: -74.006,
  city: "New York",
  country: "United States",
  region: "New York",
};

describe("Location Service", () => {
  describe("HttpClient Interface", () => {
    it("should define the expected interface", () => {
      const httpClient: HttpClient = {
        get: vi.fn(),
      };

      expect(httpClient).toHaveProperty("get");
      expect(typeof httpClient.get).toBe("function");
    });
  });

  describe("FetchHttpClient", () => {
    let fetchHttpClient: FetchHttpClient;
    let fetchMock: any;

    beforeEach(() => {
      fetchMock = vi.fn();
      global.fetch = fetchMock;
      fetchHttpClient = new FetchHttpClient();
    });

    it("should make a successful GET request", async () => {
      const mockResponse = { data: "test" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const result = await fetchHttpClient.get("https://example.com/api");

      expect(fetchMock).toHaveBeenCalledWith("https://example.com/api");
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when response is not ok", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        fetchHttpClient.get("https://example.com/api"),
      ).rejects.toThrow("HTTP error! status: 404");
    });

    it("should handle network errors", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        fetchHttpClient.get("https://example.com/api"),
      ).rejects.toThrow("Network error");
    });
  });

  describe("IpLocationService", () => {
    let locationService: LocationService;
    let mockHttpClient: HttpClient;

    beforeEach(() => {
      mockHttpClient = {
        get: vi.fn() as any,
      };
      locationService = new IpLocationService(mockHttpClient);
    });

    it("should get location without IP (current IP)", async () => {
      (mockHttpClient.get as any).mockResolvedValueOnce(mockIpApiResponse);

      const result = await locationService.getLocationFromIp();

      expect(mockHttpClient.get).toHaveBeenCalledWith("https://ipapi.co/json/");
      expect(result).toEqual(mockLocation);
    });

    it("should get location with specific IP", async () => {
      const testIp = "192.168.1.1";
      (mockHttpClient.get as any).mockResolvedValueOnce(mockIpApiResponse);

      const result = await locationService.getLocationFromIp(testIp);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `https://ipapi.co/${testIp}/json/`,
      );
      expect(result).toEqual(mockLocation);
    });

    it("should handle API errors gracefully", async () => {
      const errorMessage = "API Error";
      (mockHttpClient.get as any).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await expect(locationService.getLocationFromIp()).rejects.toThrow(
        `Failed to get location from IP: undefined ${errorMessage}`,
      );
    });

    it("should handle unknown errors", async () => {
      (mockHttpClient.get as any).mockRejectedValueOnce("Unknown error");

      await expect(locationService.getLocationFromIp()).rejects.toThrow(
        "Failed to get location from IP: undefined Unknown error",
      );
    });

    it("should use default FetchHttpClient when none provided", () => {
      const serviceWithDefault = new IpLocationService();
      expect(serviceWithDefault).toBeInstanceOf(IpLocationService);
    });
  });

  describe("getLocationFromIp convenience function", () => {
    let fetchMock: any;

    beforeEach(() => {
      fetchMock = vi.fn();
      global.fetch = fetchMock;
    });

    it("should work with default implementation", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIpApiResponse),
      });

      const result = await getLocationFromIp();

      expect(fetchMock).toHaveBeenCalledWith("https://ipapi.co/json/");
      expect(result).toEqual(mockLocation);
    });

    it("should work with specific IP", async () => {
      const testIp = "192.168.1.1";
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIpApiResponse),
      });

      const result = await getLocationFromIp(testIp);

      expect(fetchMock).toHaveBeenCalledWith(
        `https://ipapi.co/${testIp}/json/`,
      );
      expect(result).toEqual(mockLocation);
    });
  });

  describe("Data transformation", () => {
    it("should correctly transform API response to Location interface", async () => {
      const mockHttpClient = {
        get: vi.fn().mockResolvedValue(mockIpApiResponse) as any,
      };
      const locationService = new IpLocationService(mockHttpClient);

      const result = await locationService.getLocationFromIp();

      expect(result).toEqual({
        latitude: mockIpApiResponse.latitude,
        longitude: mockIpApiResponse.longitude,
        city: mockIpApiResponse.city,
        country: mockIpApiResponse.country_name,
        region: mockIpApiResponse.region,
      });
    });

    it("should handle missing optional fields", async () => {
      const partialResponse: Partial<IpApiResponse> = {
        latitude: 40.7128,
        longitude: -74.006,
        city: "",
        region: "",
        country: "US",
        country_name: "",
      };

      const mockHttpClient = {
        get: vi.fn().mockResolvedValue(partialResponse) as any,
      };
      const locationService = new IpLocationService(mockHttpClient);

      const result = await locationService.getLocationFromIp();

      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
        city: "",
        country: "",
        region: "",
      });
    });
  });
});
