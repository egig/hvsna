import type { GeneralSettings } from "../../modules/settings/settings";

export interface ISettingsRepository {
  load(): Promise<GeneralSettings | null>;
  save(settings: GeneralSettings): Promise<void>;
}
