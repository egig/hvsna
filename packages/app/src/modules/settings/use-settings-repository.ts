import type { ISettingsRepository } from "../../domain/settings/ISettingsRepository";
import { useRepositories } from "../repositories-context";

export function useSettingsRepository(): ISettingsRepository {
  return useRepositories().settingsRepository;
}
