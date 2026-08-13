import { ApiError } from "./response";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "hvsna/1.0 (contact: egigundari@gmail.com)";
const REQUEST_TIMEOUT_MS = 8000;

export const DEFAULT_SEARCH_LIMIT = 8;
export const MIN_SEARCH_LIMIT = 1;
export const MAX_SEARCH_LIMIT = 20;

export function parseLatLon(raw: string | null, field: "lat" | "lon"): number {
  const parsed = raw !== null ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, "INVALID_PARAM", `Query parameter "${field}" must be a number`);
  }
  return parsed;
}

export function parseSearchQuery(raw: string | null): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    throw new ApiError(400, "INVALID_PARAM", 'Query parameter "q" is required');
  }
  return trimmed;
}

export function clampSearchLimit(raw: string | null): number {
  const parsed = raw !== null ? Number(raw) : DEFAULT_SEARCH_LIMIT;
  if (!Number.isFinite(parsed)) return DEFAULT_SEARCH_LIMIT;
  return Math.min(MAX_SEARCH_LIMIT, Math.max(MIN_SEARCH_LIMIT, Math.trunc(parsed)));
}

export async function fetchNominatim(path: string, params: URLSearchParams): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${NOMINATIM_BASE}${path}?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(502, "UPSTREAM_ERROR", "Failed to reach Nominatim");
  }

  if (!response.ok) {
    throw new ApiError(502, "UPSTREAM_ERROR", `Nominatim request failed (${response.status})`);
  }

  return response.json();
}
