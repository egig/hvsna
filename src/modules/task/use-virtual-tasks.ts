import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import { buildVirtualTasksForRange } from "./recurring-task-generator";
import type { RecurringTask } from "./recurring-task";

export function useVirtualTasks(startEpoch: number, endEpoch: number) {
  const { db } = usePouchDB();

  return useQuery({
    queryKey: ["virtual-tasks", startEpoch, endEpoch],
    queryFn: async () => {
      // All recurring task templates
      const response = await db.allDocs({
        include_docs: true,
        startkey: "rtask_",
        endkey: "rtask_\uffff",
      });

      const templates = response.rows
        .filter((row: any) => row.doc && row.doc.baseDateEpoch)
        .map((row: any) => row.doc as RecurringTask);

      const taskRepository = new PouchDBTaskRepository(db);
      return await buildVirtualTasksForRange(
        templates,
        taskRepository,
        startEpoch,
        endEpoch
      );
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}
