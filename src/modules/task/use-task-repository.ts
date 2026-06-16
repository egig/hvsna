import { useMemo } from "react";
import { usePouchDB } from "../../pouchdb";
import { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";

export function useTaskRepository(): PouchDBTaskRepository {
  const { db } = usePouchDB();
  return useMemo(() => new PouchDBTaskRepository(db), [db]);
}
