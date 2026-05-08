import PouchDB from "pouchdb";
import { PouchDBTrackerRepository } from "./PouchDBTrackerRepository";
import { PouchDBTrackerLogRepository } from "./PouchDBTrackerLogRepository";
import type { ITrackerRepository } from "../../domain/tracker/ITrackerRepository";
import type { ITrackerLogRepository } from "../../domain/tracker/ITrackerLogRepository";

export interface ITrackerRepositories {
  trackerRepository: ITrackerRepository;
  trackerLogRepository: ITrackerLogRepository;
}

export function createTrackerRepositories(
  db: PouchDB.Database
): ITrackerRepositories {
  const trackerRepository = new PouchDBTrackerRepository(db);
  const trackerLogRepository = new PouchDBTrackerLogRepository(db);

  return {
    trackerRepository,
    trackerLogRepository,
  };
}
