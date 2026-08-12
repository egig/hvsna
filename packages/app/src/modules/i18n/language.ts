export type Language = "en" | "id";

export interface Translation {
  en: string;
  id: string;
}

export type Translations = {
  [key: string]: Translation;
};

export type TranslationKey = keyof Translations;
