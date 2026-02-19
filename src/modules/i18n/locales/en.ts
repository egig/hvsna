
// Import module-specific translations
import { taskTranslations } from "../../task/locale";
import { settingsTranslations } from "../../settings/locale";
import { navigationTranslations } from "../../navigation/locale";
import { datetimeTranslations } from "../../common/datetime";
import { syncTranslations } from "../../sync/locale";
import { onboardingTranslations } from "../../onboarding/locale";
import { homeTranslations } from "../../home/locale";
import { logTranslations } from "../../log/locale";
import { commonTranslations } from "../../common/locale";
import { authTranslations } from "../../auth/locale";
import type { Translations } from "../language";

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
