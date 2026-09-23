import { requireSyncAuth } from "@/lib/require-auth";
import { readJsonBody } from "@/lib/request";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { pushRecurringTasks, pushSettings, pushTags, pushTasks } from "@/lib/sync-push";
import {
  validateRecurringTaskRows,
  validateSettingsRows,
  validateTagRows,
  validateTaskRows,
} from "@/lib/sync-validation";

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireSyncAuth(request);
    const body = await readJsonBody(request);

    const tagRows = validateTagRows(body.tags);
    const recurringTaskRows = validateRecurringTaskRows(body.recurring_tasks);
    const taskRows = validateTaskRows(body.tasks);
    const settingsRows = validateSettingsRows(body.settings);

    // tags first: task_tags/recurring_task_tags FK-reference it, so a tag
    // created offline in the same push as the task/recurring task using it
    // must land before their tag_ids are applied. recurring_tasks before
    // tasks for the same reason (tasks.recurring_task_id FK-references it).
    const tagsResult = await pushTags(userId, tagRows);
    const recurringTasksResult = await pushRecurringTasks(userId, recurringTaskRows);
    const tasksResult = await pushTasks(userId, taskRows);
    const settingsResult = await pushSettings(userId, settingsRows);

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
