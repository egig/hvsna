import { useMemo } from "react";
import { usePouchDB } from "../../pouchdb";
import { PouchDBRecurringTaskRepository } from "../../infra/task/PouchDBRecurringTaskRepository";

export function useRecurringTaskRepository(): PouchDBRecurringTaskRepository {
  const { db } = usePouchDB();
  return useMemo(() => new PouchDBRecurringTaskRepository(db), [db]);
}
