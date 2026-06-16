import { useMemo } from "react";
import { usePouchDB } from "../../pouchdb";
import { PouchDBSettingsRepository } from "../../infra/settings/PouchDBSettingsRepository";

export function useSettingsRepository(): PouchDBSettingsRepository {
  const { db } = usePouchDB();
  return useMemo(() => new PouchDBSettingsRepository(db), [db]);
}
