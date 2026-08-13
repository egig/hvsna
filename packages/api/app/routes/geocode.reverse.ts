import { fetchNominatim, parseLatLon } from "@/lib/nominatim";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const lat = parseLatLon(url.searchParams.get("lat"), "lat");
    const lon = parseLatLon(url.searchParams.get("lon"), "lon");

    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: "jsonv2",
      zoom: "10",
    });
    const data = await fetchNominatim("/reverse", params);

    return jsonOk(data);
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
