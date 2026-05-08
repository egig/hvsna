import type {
  Tracker,
  TrackerCreateInput,
  TrackerUpdateInput,
  TrackerQuery,
} from "./Tracker";

export interface ITrackerRepository {
  create(input: TrackerCreateInput): Promise<Tracker>;
  update(id: string, input: TrackerUpdateInput): Promise<Tracker>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Tracker | null>;
  find(query?: TrackerQuery): Promise<Tracker[]>;
  findTrackers(): Promise<Tracker[]>;
}
