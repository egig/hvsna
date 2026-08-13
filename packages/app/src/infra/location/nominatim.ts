import { api } from "../../modules/api/http-client";

interface BaseResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface NominatimReverseResult {
  display_name: string;
  address: {
    county?: string;
    city?: string;
    municipality?: string;
    town?: string;
    display_name?: string;
  };
}

export interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimReverseResult | null> {
  try {
    const response = await api.get<BaseResponse<NominatimReverseResult>>(
      "/geocode/reverse",
      { params: { lat, lon } }
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function searchLocations(
  query: string
): Promise<NominatimSearchResult[]> {
  const response = await api.get<BaseResponse<NominatimSearchResult[]>>(
    "/geocode/search",
    { params: { q: query } }
  );
  return response.data;
}
