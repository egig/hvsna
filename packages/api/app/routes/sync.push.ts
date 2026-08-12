import { requireAuth } from "@/lib/require-auth";
import { readJsonBody } from "@/lib/request";
import { jsonOk, jsonUnexpectedError } from "@/lib/response";
import { pushRecurringTasks, pushSettings, pushTasks } from "@/lib/sync-push";
import {
  validateRecurringTaskRows,
  validateSettingsRows,
  validateTaskRows,
} from "@/lib/sync-validation";

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireAuth(request);
    const body = await readJsonBody(request);

    const recurringTaskRows = validateRecurringTaskRows(body.recurring_tasks);
    const taskRows = validateTaskRows(body.tasks);
    const settingsRows = validateSettingsRows(body.settings);

    // recurring_tasks first: tasks.recurring_task_id FK-references it, so a
    // recurring task created offline in the same push as its instances must
    // land before them.
    const recurringTasksResult = await pushRecurringTasks(userId, recurringTaskRows);
    const tasksResult = await pushTasks(userId, taskRows);
    const settingsResult = await pushSettings(userId, settingsRows);

    return jsonOk({
      recurring_tasks: recurringTasksResult,
      tasks: tasksResult,
      settings: settingsResult,
    });
  } catch (error) {
    return jsonUnexpectedError(error);
  }
}
