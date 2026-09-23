import { requireSyncAuth } from "@/lib/require-auth";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { applyPull, clampPullLimit, parsePullCursors } from "@/lib/sync-pull";

export async function loader({ request }: { request: Request }) {
  try {
    const userId = await requireSyncAuth(request);
    const url = new URL(request.url);
    const limit = clampPullLimit(url.searchParams.get("limit"));
    const cursors = parsePullCursors(url.searchParams);
    return jsonOk(await applyPull(userId, cursors, limit));
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
