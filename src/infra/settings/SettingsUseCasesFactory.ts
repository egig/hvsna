import { SettingsUseCases } from "../../use-cases/settings/SettingsUseCases";
import { PouchDBSettingsRepository } from "./PouchDBSettingsRepository";
import { createLocationProvider } from "./CapacitorLocationProvider";
import { TimeAPITimezoneProvider } from "./TimeAPITimezoneProvider";

export function createSettingsUseCases(db: PouchDB.Database): SettingsUseCases {
  return new SettingsUseCases(
    new PouchDBSettingsRepository(db),
    createLocationProvider(),
    new TimeAPITimezoneProvider(),
  );
}
