export type Language = 'ku' | 'tr' | 'en';

export const languageMap: Record<Language, string> = {
  ku: 'Kurdish',
  tr: 'Turkish',
  en: 'English',
};

export interface TranslationResult {
  detectedLanguage: string;
  correctedSourceText: string;
  mainTranslation: string;
  alternativeTranslations: string[];
  meaningExplanation: string;
}