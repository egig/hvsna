import type { Translations } from "../modules/common/language";

// Import module-specific translations
import { commonTranslations } from "../modules/common/locale";
import { authTranslations } from "../modules/auth/locale";
import { taskTranslations } from "../modules/task/locale";
import { settingsTranslations } from "../modules/settings/locale";
import { navigationTranslations } from "../modules/navigation/locale";
import { datetimeTranslations } from "../modules/common/datetime";
import { syncTranslations } from "../modules/sync/locale";
import { onboardingTranslations } from "../modules/onboarding/locale";
import { homeTranslations } from "../modules/home/locale";
import { logTranslations } from "../modules/log/locale";

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
