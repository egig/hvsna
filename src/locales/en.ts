import type { Translations } from "../lib/types/language";

// Import module-specific translations
import { commonTranslations } from "./modules/common";
import { authTranslations } from "./modules/auth";
import { taskTranslations } from "./modules/task";
import { settingsTranslations } from "./modules/settings";
import { navigationTranslations } from "./modules/navigation";
import { datetimeTranslations } from "./modules/datetime";
import { syncTranslations } from "./modules/sync";
import { onboardingTranslations } from "./modules/onboarding";
import { homeTranslations } from "./modules/home";
import { logTranslations } from "./modules/log";

export const translations: Translations = {
  // Common translations (shared across modules)
  ...commonTranslations,

  // Module-specific translations
  ...authTranslations,
  ...taskTranslations,
  ...settingsTranslations,
  ...navigationTranslations,
  ...datetimeTranslations,
  ...syncTranslations,
  ...onboardingTranslations,
  ...homeTranslations,
  ...logTranslations,
};
