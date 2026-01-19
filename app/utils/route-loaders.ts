import { getLocationFromIp, type Location } from '~/lib/location';
import { getClientIP, getDirectIP } from '~/lib/ip';
import { DEFAULT_LOCATION } from './config';

/**
 * Extract location from request using IP-based geolocation
 * Falls back to default location if IP extraction or geolocation fails
 *
 * @param request - The incoming request object
 * @returns Location object with latitude and longitude
 */
export async function getLocationFromRequest(request: Request): Promise<Location> {
  // Try to get IP from request headers
  let ip = getClientIP(request);

  // Fallback to direct IP
  if (!ip) {
    ip = getDirectIP(request);
  }

  // If no IP found, use default location
  if (!ip) {
    return {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude
    };
  }

  // Attempt to get location from IP
  try {
    const location = await getLocationFromIp(ip as string);
    return location;
  } catch (error) {
    // Log error and return default location
    console.error('Failed to get location from IP:', error);
    return {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude
    };
  }
}
