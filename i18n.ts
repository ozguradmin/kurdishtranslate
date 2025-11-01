import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type UiLanguage = 'en' | 'tr' | 'ku';

const translations = {
  en: {
    appTitle: 'Kurdish AI Translate',
    appSubtitle: 'Powered by Gemini Flash Lite',
    autoDetect: 'Auto-detect',
    kurdish: 'Kurdish',
    turkish: 'Turkish',
    english: 'English',
    swapLanguages: 'Swap languages',
    sourcePlaceholder: 'Enter text to translate...',
    didYouMean: 'Did you mean:',
    alternativesTitle: 'Alternative Translations',
    meaningTitle: 'Meaning',
    apiError: 'API connection failed. Please check your connection.',
    copyTooltip: 'Copy to clipboard',
    speakTooltip: 'Read text aloud',
    infoTooltip: 'Show meaning and context',
    kurdishNotSupportedForTTS: 'Text-to-speech is not supported for Kurdish.',
  },
  tr: {
    appTitle: 'Kürtçe AI Çevirmen',
    appSubtitle: 'Gemini Flash Lite ile güçlendirilmiştir',
    autoDetect: 'Otomatik Algıla',
    kurdish: 'Kürtçe',
    turkish: 'Türkçe',
    english: 'İngilizce',
    swapLanguages: 'Dilleri değiştir',
    sourcePlaceholder: 'Çevirmek için metin girin...',
    didYouMean: 'Bunu mu demek istediniz:',
    alternativesTitle: 'Alternatif Çeviriler',
    meaningTitle: 'Anlamı',
    apiError: 'API bağlantısı başarısız. Lütfen bağlantınızı kontrol edin.',
    copyTooltip: 'Panoya kopyala',
    speakTooltip: 'Metni seslendir',
    infoTooltip: 'Anlam ve bağlamı göster',
    kurdishNotSupportedForTTS: 'Seslendirme Kürtçe için desteklenmemektedir.',
  },
  ku: {
    appTitle: 'Wergêrê AI Kurdî',
    appSubtitle: 'Bi Gemini Flash Lite hatiye bihêzkirin',
    autoDetect: 'Bixweber Nas bike',
    kurdish: 'Kurdî',
    turkish: 'Tirkî',
    english: 'Îngilîzî',
    swapLanguages: 'Zimanan biguherîne',
    sourcePlaceholder: 'Nivîsê ji bo wergerê binivîse...',
    didYouMean: 'Me منظورا te ev bû:',
    alternativesTitle: 'Wergerên Alternatîf',
    meaningTitle: 'Wate',
    apiError: 'Têkiliya APIyê têk çû. Ji kerema xwe pêwendiya xwe kontrol bikin.',
    copyTooltip: 'Li clipboardê kopî bike',
    speakTooltip: 'Nivîsê bi deng bixwîne',
    infoTooltip: 'Wate û çarçoveyê nîşan bide',
    kurdishNotSupportedForTTS: 'Xwendina bi deng ji bo zimanê Kurdî nayê piştgirî kirin.',
  },
};

type TranslationKey = keyof typeof translations['en'];

interface TranslationContextType {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// FIX: Explicitly typing `TranslationProvider` as a `React.FC` with required `children`
// helps TypeScript correctly identify it as a component that can accept children,
// resolving the type error in index.tsx.
export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<UiLanguage>('tr');

  const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
    let translation = (translations[language] && translations[language][key]) || translations['en'][key];
    if (params) {
        Object.keys(params).forEach(paramKey => {
            translation = translation.replace(`{${paramKey}}`, params[paramKey]);
        });
    }
    return translation;
  }, [language]);

  return React.createElement(
    TranslationContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
