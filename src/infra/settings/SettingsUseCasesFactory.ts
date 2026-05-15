import { SettingsUseCases } from "../../usecases/settings/SettingsUseCases";
import { PouchDBSettingsRepository } from "./PouchDBSettingsRepository";
import { TimeAPITimezoneProvider } from "../location/TimeAPITimezoneProvider";

export function createSettingsUseCases(db: PouchDB.Database): SettingsUseCases {
  return new SettingsUseCases(
    new PouchDBSettingsRepository(db),
    new TimeAPITimezoneProvider()
  );
}
