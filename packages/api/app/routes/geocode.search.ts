import { clampSearchLimit, fetchNominatim, parseSearchQuery } from "@/lib/nominatim";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const q = parseSearchQuery(url.searchParams.get("q"));
    const limit = clampSearchLimit(url.searchParams.get("limit"));

    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      limit: String(limit),
      addressdetails: "0",
    });
    const data = await fetchNominatim("/search", params);

    return jsonOk(data);
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
