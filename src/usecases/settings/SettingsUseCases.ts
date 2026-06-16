import type { ISettingsRepository } from "../../domain/settings/ISettingsRepository";
import type { ITimezoneProvider } from "../../domain/location/ITimezoneProvider";
import type { GeneralSettings } from "../../modules/settings/settings";
import type { Language } from "../../modules/i18n/language";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: "system",
  notifications: true,
};

export class SettingsUseCases {
  constructor(
    private readonly settingsRepo: ISettingsRepository,
    private readonly timezoneProvider: ITimezoneProvider
  ) {}

  async loadSettings(): Promise<GeneralSettings> {
    const saved = await this.settingsRepo.load();
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
  }

  async updateSettings(
    current: GeneralSettings,
    updates: Partial<GeneralSettings>
  ): Promise<GeneralSettings> {
    const next = { ...current, ...updates };
    await this.settingsRepo.save(next);
    return next;
  }

  async resetSettings(): Promise<GeneralSettings> {
    await this.settingsRepo.save({ ...DEFAULT_SETTINGS });
    return { ...DEFAULT_SETTINGS };
  }

  async setLanguage(
    current: GeneralSettings,
    language: Language
  ): Promise<GeneralSettings> {
    return this.updateSettings(current, { language });
  }

  async getTimezoneFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    return this.timezoneProvider.getTimezone(latitude, longitude);
  }
}
