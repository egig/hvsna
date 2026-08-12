/**
 * Location interface
 */
export interface Location {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  region?: string;
}

/**
 * API response interface from ipapi.co
 */
export interface IpApiResponse {
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  country_name: string;
  ip: string;
  postal: string;
  timezone: string;
  utc_offset: string;
  country_calling_code: string;
  currency: string;
  languages: string;
  asn: string;
  org: string;
}

/**
 * HTTP client interface for dependency injection
 */
export interface HttpClient {
  get(url: string): Promise<any>;
}

/**
 * Real implementation using fetch API
 */
export class FetchHttpClient implements HttpClient {
  async get(url: string): Promise<any> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Location service interface
 */
export interface LocationService {
  getLocationFromIp(ip?: string): Promise<Location>;
}

/**
 * Location service implementation
 */
export class IpLocationService implements LocationService {
  private httpClient: HttpClient;
  private readonly baseUrl = "https://ipapi.co";

  constructor(httpClient: HttpClient = new FetchHttpClient()) {
    this.httpClient = httpClient;
  }

  async getLocationFromIp(ip?: string): Promise<Location> {
    const url = ip ? `${this.baseUrl}/${ip}/json/` : `${this.baseUrl}/json/`;

    try {
      const data: IpApiResponse = await this.httpClient.get(url);

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        region: data.region,
      };
    } catch (error) {
      throw new Error(
        `Failed to get location from IP: ${ip} ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

/**
 * Convenience function to get location from IP
 * @param ip - Optional IP address (uses current IP if not provided)
 * @returns Promise<Location>
 */
export async function getLocationFromIp(ip?: string): Promise<Location> {
  const locationService = new IpLocationService();
  return locationService.getLocationFromIp(ip);
}
