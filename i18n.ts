import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type UiLanguage = 'en' | 'tr' | 'ku';

const translations = {
  en: {
    appTitle: 'KurdishAI',
    kurdish: 'Kurdish',
    turkish: 'Turkish',
    english: 'English',
    ku: 'Kurdish',
    tr: 'Turkish',
    en: 'English',
    swapLanguages: 'Swap languages',
    sourcePlaceholder: 'Enter text...',
    didYouMean: 'Did you mean:',
    alternativesToggle: 'Alternative translations',
    meaningTitle: 'Meaning & Context',
    apiError: 'API connection failed. Please check your connection and API Key.',
    apiKeyMissingError: 'API Key is not configured. Please set it up in your deployment environment.',
    copyTooltip: 'Copy to clipboard',
    speakTooltip: 'Read text aloud',
    infoTooltip: 'Show meaning and context',
    kurdishNotSupportedForTTS: 'Text-to-speech is not supported for Kurdish.',
    footerCredit: 'App coded by @ozguradmin',
  },
  tr: {
    appTitle: 'KürtçeAI',
    kurdish: 'Kürtçe',
    turkish: 'Türkçe',
    english: 'İngilizce',
    ku: 'Kürtçe',
    tr: 'Türkçe',
    en: 'İngilizce',
    swapLanguages: 'Dilleri değiştir',
    sourcePlaceholder: 'Metin girin...',
    didYouMean: 'Bunu mu demek istediniz:',
    alternativesToggle: 'Alternatif çeviriler',
    meaningTitle: 'Anlam ve Bağlam',
    apiError: 'API bağlantısı başarısız. Lütfen bağlantınızı ve API anahtarınızı kontrol edin.',
    apiKeyMissingError: 'API Anahtarı yapılandırılmamış. Lütfen dağıtım ortamınızda ayarlayın.',
    copyTooltip: 'Panoya kopyala',
    speakTooltip: 'Metni seslendir',
    infoTooltip: 'Anlam ve bağlamı göster',
    kurdishNotSupportedForTTS: 'Seslendirme Kürtçe için desteklenmemektedir.',
    footerCredit: 'Uygulama @ozguradmin tarafından kodlanmıştır',
  },
  ku: {
    appTitle: 'KurdîAI',
    kurdish: 'Kurdî',
    turkish: 'Tirkî',
    english: 'Îngilîzî',
    ku: 'Kurdî',
    tr: 'Tirkî',
    en: 'Îngilîzî',
    swapLanguages: 'Zimanan biguherîne',
    sourcePlaceholder: 'Nivîsê binivîse...',
    didYouMean: 'Me منظورا te ev bû:',
    alternativesToggle: 'Wergerên alternatîf',
    meaningTitle: 'Wate û Çarçove',
    apiError: 'Têkiliya APIyê têk çû. Ji kerema xwe pêwendiya xwe û mifteya APIya xwe kontrol bikin.',
    apiKeyMissingError: 'Mifteya APIyê nehatiye veavakirin. Ji kerema xwe wê di hawîrdora xweya bicîhkirinê de saz bikin.',
    copyTooltip: 'Li clipboardê kopî bike',
    speakTooltip: 'Nivîsê bi deng bixwîne',
    infoTooltip: 'Wate û çarçoveyê nîşan bide',
    kurdishNotSupportedForTTS: 'Xwendina bi deng ji bo zimanê Kurdî nayê piştgirî kirin.',
    footerCredit: 'Serlêdan ji hêla @ozguradmin ve hatî kod kirin',
  },
};

type TranslationKey = keyof typeof translations['en'];

interface TranslationContextType {
  language: UiLanguage;
  setLanguage: (language: UiLanguage) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

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