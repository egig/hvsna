import { requireSyncAuth } from "@/lib/require-auth";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import {
  clampPullLimit,
  parseCursor,
  pullRecurringTasks,
  pullSettings,
  pullTags,
  pullTasks,
} from "@/lib/sync-pull";

export async function loader({ request }: { request: Request }) {
  try {
    const userId = await requireSyncAuth(request);
    const url = new URL(request.url);
    const limit = clampPullLimit(url.searchParams.get("limit"));
    const tasksCursor = parseCursor(url.searchParams.get("tasks_cursor"));
    const recurringTasksCursor = parseCursor(url.searchParams.get("recurring_tasks_cursor"));
    const settingsCursor = parseCursor(url.searchParams.get("settings_cursor"));
    const tagsCursor = parseCursor(url.searchParams.get("tags_cursor"));

    const [tagsResult, recurringTasksResult, tasksResult, settingsResult] = await Promise.all([
      pullTags(userId, tagsCursor, limit),
      pullRecurringTasks(userId, recurringTasksCursor, limit),
      pullTasks(userId, tasksCursor, limit),
      pullSettings(userId, settingsCursor, limit),
    ]);

    return jsonOk({
      tags: tagsResult,
      recurring_tasks: recurringTasksResult,
      tasks: tasksResult,
      settings: settingsResult,
    });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
