import { signAccessToken } from "@/lib/jwt";
import { readJsonBody } from "@/lib/request";
import { ApiError, jsonOk, jsonUnexpectedError } from "@/lib/response";
import { rotateRefreshToken, TokenReuseDetectedError } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const { refresh_token: refreshToken } = body;
    if (typeof refreshToken !== "string") {
      throw new ApiError(400, "INVALID_REQUEST", "refresh_token is required");
    }

    let rotated;
    try {
      rotated = await rotateRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof TokenReuseDetectedError) {
        throw new ApiError(
          401,
          "TOKEN_REUSE_DETECTED",
          "Refresh token reuse detected; session revoked"
        );
      }
      throw error;
    }
    if (!rotated) {
      throw new ApiError(401, "TOKEN_EXPIRED", "Refresh token is invalid or expired");
    }

    const accessToken = await signAccessToken(rotated.userId);

    return jsonOk({ access_token: accessToken, refresh_token: rotated.refreshToken });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
