import { requireSyncAuth } from "@/lib/require-auth";
import { readJsonBody } from "@/lib/request";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { applyPush } from "@/lib/sync-push";
import { validatePushBody } from "@/lib/sync-validation";

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireSyncAuth(request);
    const body = await readJsonBody(request);
    const batch = validatePushBody(body);
    return jsonOk(await applyPush(userId, batch));
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
