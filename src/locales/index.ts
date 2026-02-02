import { en } from './en';
import { id } from './id';

export const translations = {
  en,
  id,
} as const;

export type TranslationKey = keyof typeof en;
