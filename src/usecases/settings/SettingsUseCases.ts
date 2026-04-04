import type { ISettingsRepository } from "../../domain/settings/ISettingsRepository";
import type {
  ILocationProvider,
  GeolocationOptions,
} from "../../domain/settings/ILocationProvider";
import type { ITimezoneProvider } from "../../domain/settings/ITimezoneProvider";
import type {
  GeneralSettings,
  Coordinate,
  LocationResolveType,
} from "../../modules/settings/settings";
import type { Language } from "../../modules/i18n/language";

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: "system",
  notifications: true,
  locationResolvedAt: undefined,
  locationResolveType: undefined,
  coordinate: undefined,
};

export class SettingsUseCases {
  constructor(
    private readonly settingsRepo: ISettingsRepository,
    private readonly locationProvider: ILocationProvider,
    private readonly timezoneProvider: ITimezoneProvider,
  ) {}

  async loadSettings(): Promise<GeneralSettings> {
    const saved = await this.settingsRepo.load();
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : { ...DEFAULT_SETTINGS };
  }

  async updateSettings(
    current: GeneralSettings,
    updates: Partial<GeneralSettings>,
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
    language: Language,
  ): Promise<GeneralSettings> {
    return this.updateSettings(current, { language });
  }

  /** Request permission and get current location. Returns coordinate on success. */
  async requestLocation(options?: GeolocationOptions): Promise<Coordinate> {
    const permission = await this.locationProvider.checkPermission();

    if (permission.state === "denied") {
      throw new Error(permission.message ?? "Location permission denied");
    }

    if (permission.state === "prompt" || permission.state === "unknown") {
      const result = await this.locationProvider.requestPermission();
      if (result.state === "prompt") {
        return this.locationProvider.getCurrentPosition(options);
      }

      if (result.state !== "granted" && result.state !== "unknown") {
        throw new Error(result.message ?? "Location permission denied");
      }
    }

    return this.locationProvider.getCurrentPosition(options);
  }

  /** Get current position without going through the permission flow (permission already granted). */
  async getCurrentPosition(options?: GeolocationOptions): Promise<Coordinate> {
    return this.locationProvider.getCurrentPosition(options);
  }

  async updateLocation(
    current: GeneralSettings,
    coordinate: Coordinate,
    resolveType: LocationResolveType,
  ): Promise<GeneralSettings> {
    return this.updateSettings(current, {
      coordinate,
      locationResolvedAt: new Date().toISOString(),
      locationResolveType: resolveType,
    });
  }

  async setManualLocation(
    current: GeneralSettings,
    latitude: number,
    longitude: number,
  ): Promise<GeneralSettings> {
    const coordinate: Coordinate = { latitude, longitude };
    return this.updateLocation(current, coordinate, "manual");
  }

  async clearLocation(current: GeneralSettings): Promise<GeneralSettings> {
    return this.updateSettings(current, {
      coordinate: undefined,
      locationResolvedAt: undefined,
      locationResolveType: undefined,
    });
  }

  async getTimezoneFromCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    return this.timezoneProvider.getTimezone(latitude, longitude);
  }

  async updateTimezoneFromLocation(
    current: GeneralSettings,
  ): Promise<GeneralSettings> {
    if (!current.coordinate) {
      throw new Error("No location coordinates available");
    }
    const timezone = await this.timezoneProvider.getTimezone(
      current.coordinate.latitude,
      current.coordinate.longitude,
    );
    if (!timezone) {
      throw new Error("Could not determine timezone from location");
    }
    return this.updateSettings(current, { timezone });
  }
}
