
export type Language = 'auto' | 'ku' | 'tr' | 'en';

export const languageMap: Record<Language, string> = {
  auto: 'Auto Detect',
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
