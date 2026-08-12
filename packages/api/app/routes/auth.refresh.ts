import { handlePreflight, withCors } from "@/lib/cors";
import { signAccessToken } from "@/lib/jwt";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { rotateRefreshToken } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  try {
    const body = await readJsonBody(request);
    const { refresh_token: refreshToken } = body;
    if (typeof refreshToken !== "string") {
      throw new ApiError(400, "INVALID_REQUEST", "refresh_token is required");
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      throw new ApiError(401, "TOKEN_EXPIRED", "Refresh token is invalid or expired");
    }

    const accessToken = await signAccessToken(rotated.userId);

    return withCors(
      request,
      jsonOk({ access_token: accessToken, refresh_token: rotated.refreshToken })
    );
  } catch (error) {
    return withCors(request, jsonUnexpectedError(error));
  }
}
