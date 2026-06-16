import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { useRecurringTaskRepository } from "./use-recurring-task-repository";
import { queryKeys } from "../query-keys";
import { useRecurringOccurance } from "./recurring-task-generator";
import { Task } from "@/domain/task";
import type { RecurringTask } from "./recurring-task";

const HORIZON_MS = 365 * 24 * 60 * 60 * 1000;

function toVirtualTask(
  template: RecurringTask,
  nextEpoch: number | null
): Task {
  return new Task({
    id: `vtask_${template.id}_${nextEpoch ?? 0}`,
    isVirtual: true,
    recurringTaskId: template.id,
    name: template.name,
    description: template.description,
    atEpochMillis: nextEpoch ?? undefined,
    atTime: template.atTime,
    recurringType: template.recurringType,
    recurringInterval: template.recurringInterval ?? 1,
    lat: template.lat,
    long: template.long,
    timezone: template.timezone,
    hijriDateOffset: template.hijriDateOffset,
    tags: template.tags ?? [],
    status: 0,
  });
}

export function useRecurringTaskList() {
  const { db } = usePouchDB();
  const recurringRepo = useRecurringTaskRepository();
  const { computeOccurrencesInRange } = useRecurringOccurance();

  const {
    data: tasks = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: queryKeys.recurringTaskList(),
    queryFn: async () => {
      const templates = await recurringRepo.find();

      const now = Date.now();

      return templates
        .map((template) => {
          const occurrences = computeOccurrencesInRange(
            template,
            now,
            now + HORIZON_MS
          );
          const nextEpoch = occurrences.length > 0 ? occurrences[0] : null;
          return { template, nextEpoch };
        })
        .filter(({ nextEpoch }) => nextEpoch !== null)
        .sort((a, b) => a.nextEpoch! - b.nextEpoch!)
        .map(({ template, nextEpoch }) => toVirtualTask(template, nextEpoch));
    },
    enabled: !!db,
  });

  return { tasks, loading, error: error as Error | null };
}
