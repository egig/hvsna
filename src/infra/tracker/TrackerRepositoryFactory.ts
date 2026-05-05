import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import { PouchDBTrackerRepository } from "./PouchDBTrackerRepository";

export function createTrackerRepository(
  db: PouchDB.Database
): ITrackerRepository {
  return new PouchDBTrackerRepository(db);
}
