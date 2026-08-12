import { readJsonBody } from "@/lib/request";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { revokeRefreshToken } from "@/lib/tokens";

export async function action({ request }: { request: Request }) {
  try {
    const body = await readJsonBody(request);
    const { refresh_token: refreshToken } = body;
    if (typeof refreshToken === "string") {
      await revokeRefreshToken(refreshToken);
    }
    return jsonOk({});
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
