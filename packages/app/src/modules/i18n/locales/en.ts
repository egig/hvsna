// Import module-specific translations
import { taskTranslations } from "../../task/locale";
import { settingsTranslations } from "../../settings/locale";
import { navigationTranslations } from "../../navigation/locale";
import { datetimeTranslations } from "../../datetime";
import { syncTranslations } from "../../sync/locale";
import { commonTranslations } from "../../locale";
import { authTranslations } from "../../auth/locale";
import { subscriptionTranslations } from "../../subscription/locale";
import type { Translations } from "../language";

export const translations: Translations = {
  ...commonTranslations,

  // Module-specific translations
  ...authTranslations,
  ...taskTranslations,
  ...settingsTranslations,
  ...navigationTranslations,
  ...datetimeTranslations,
  ...syncTranslations,
  ...subscriptionTranslations,
};
