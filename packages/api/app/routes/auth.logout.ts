import { handlePreflight, withCors } from "@/lib/cors";
import { readJsonBody } from "@/lib/request";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { revokeRefreshToken } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const body = await readJsonBody(request);
    const { refresh_token: refreshToken } = body;
    if (typeof refreshToken === "string") {
      await revokeRefreshToken(refreshToken);
    }
    return withCors(request, jsonOk({}));
  } catch (error) {
    return withCors(request, jsonUnexpectedError(error));
  }
}
