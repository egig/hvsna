import dayjs from "dayjs";
import type { Task, TaskUpdateInput } from "@/domain/task";
import type { RecurringTask, RecurringTaskUpdateInput } from "./recurring-task";
import type { RepeatConfig } from "./task-form-types";

export function repeatFromTemplate(
  task: Pick<Task, "recurringType" | "recurringInterval">,
  template?: RecurringTask | null,
): RepeatConfig {
  return {
    recurringType: template?.recurringType ?? task.recurringType ?? "none",
    interval: template?.recurringInterval ?? task.recurringInterval ?? 1,
    end: template?.recurringEnd ?? "never",
    endDate:
      template?.recurringEndEpoch != null
        ? dayjs(template.recurringEndEpoch).format("YYYY-MM-DD")
        : null,
    endOccurrences: template?.recurringEndOccurrences ?? 1,
    useGregorian: template?.useGregorian ?? false,
  };
}

export function repeatToTemplate(
  repeat: RepeatConfig,
): RecurringTaskUpdateInput {
  return {
    recurringType: repeat.recurringType,
    recurringInterval: repeat.interval,
    recurringEnd: repeat.end,
    recurringEndEpoch:
      repeat.end === "on_date" && repeat.endDate
        ? dayjs(repeat.endDate).endOf("day").valueOf()
        : null,
    recurringEndOccurrences:
      repeat.end === "after_occurrences" ? repeat.endOccurrences : null,
    useGregorian: repeat.useGregorian,
  };
}

export function isTaskEditUnchanged(
  task: Task,
  input: TaskUpdateInput,
  repeat: RepeatConfig,
  initialRepeat: RepeatConfig,
): boolean {
  const tags = (value: string[] | null | undefined) =>
    JSON.stringify([...(value ?? [])].sort());
  return (
    input.name === (task.name ?? "") &&
    (input.description ?? "") === (task.description ?? "") &&
    input.atEpochMillis === task.atEpochMillis &&
    (input.atTime ?? "") === (task.atTime ?? "") &&
    tags(input.tags) === tags(task.tags) &&
    JSON.stringify(repeatToTemplate(repeat)) ===
      JSON.stringify(repeatToTemplate(initialRepeat))
  );
}
