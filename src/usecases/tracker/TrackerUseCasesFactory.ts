import PouchDB from "pouchdb";
import { TrackerUseCases } from "./TrackerUseCases";
import { createTrackerRepositories } from "../../infra/tracker/TrackerRepositoryFactory";

export function createTrackerUseCases(db: PouchDB.Database): TrackerUseCases {
  const { trackerRepository, trackerLogRepository } =
    createTrackerRepositories(db);

  return new TrackerUseCases(trackerRepository, trackerLogRepository);
}
