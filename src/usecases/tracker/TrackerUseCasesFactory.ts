import { createTrackerRepository } from "../../infra/tracker/TrackerRepositoryFactory";
import { TrackerUseCases } from "./TrackerUseCases";

export function createTrackerUseCases(db: PouchDB.Database): TrackerUseCases {
  const repository = createTrackerRepository(db);
  return new TrackerUseCases(repository);
}
