import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { translateText } from './services/geminiService';
import { Language, TranslationResult } from './types';
import { useTranslation } from './i18n';

// Debounce hook to prevent API calls on every keystroke
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const App = () => {
    const { t, language: uiLang, setLanguage: setUiLang } = useTranslation();
    const [sourceText, setSourceText] = useState('');
    const [sourceLang, setSourceLang] = useState<Language>('auto');
    const [targetLang, setTargetLang] = useState<Language>('ku');
    const [result, setResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [isMeaningVisible, setIsMeaningVisible] = useState(false);

    const debouncedSourceText = useDebounce(sourceText, 750);
    const lastRequestRef = useRef('');

    const performTranslation = useCallback(async () => {
        const requestKey = `${debouncedSourceText}:${sourceLang}:${targetLang}:${uiLang}`;
        if (!debouncedSourceText.trim() || lastRequestRef.current === requestKey) {
            if (!debouncedSourceText.trim()) {
                setResult(null);
                setError('');
            }
            return;
        }

        setIsLoading(true);
        setError('');
        lastRequestRef.current = requestKey;

        try {
            const translation = await translateText(debouncedSourceText, sourceLang, targetLang, uiLang);
            setResult(translation);
            setIsMeaningVisible(false);
        } catch (e: any) {
            if (e.message === 'API_KEY_MISSING') {
                setError(t('apiKeyMissingError'));
            } else {
                setError(t('apiError'));
            }
            setResult(null);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSourceText, sourceLang, targetLang, uiLang, t]);

    useEffect(() => {
        performTranslation();
    }, [performTranslation]);

    useEffect(() => {
        if (sourceLang !== 'auto' && sourceLang === targetLang) {
            const newTargetLang = sourceLang === 'ku' ? 'en' : 'ku';
            setTargetLang(newTargetLang);
        }
    }, [sourceLang, targetLang]);

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(result?.mainTranslation || '');
    };

    const handleCorrectionClick = () => {
        if (result?.correctedSourceText) {
            setSourceText(result.correctedSourceText);
        }
    };
    
    const handleAlternativeClick = (alternative: string) => {
        if(result) {
            const currentMain = result.mainTranslation;
            const newAlternatives = result.alternativeTranslations.filter(t => t !== alternative);
            newAlternatives.push(currentMain);
            setResult({
                ...result,
                mainTranslation: alternative,
                alternativeTranslations: newAlternatives,
            });
        }
    };

    const copyToClipboard = (text: string | undefined, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedStates({ [id]: true });
        setTimeout(() => setCopiedStates({ [id]: false }), 2000);
    };

    const speakText = (text: string | undefined) => {
        if (!text || typeof window.speechSynthesis === 'undefined') return;
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<string, string> = { 'en': 'en-US', 'tr': 'tr-TR' };
        
        const detectedLang = result?.detectedLanguage?.toLowerCase();
        const currentLang = detectedLang?.startsWith('english') ? 'en' : targetLang;

        if (langMap[currentLang]) {
            utterance.lang = langMap[currentLang];
        }
        window.speechSynthesis.speak(utterance);
    };

    const isSourceKurdish = useMemo(() => {
        const detectedLang = result?.detectedLanguage?.toLowerCase();
        return sourceLang === 'ku' || (sourceLang === 'auto' && !!detectedLang && detectedLang.startsWith('kurdish'));
    }, [sourceLang, result]);
    
    const isTargetKurdish = useMemo(() => targetLang === 'ku', [targetLang]);

    return (
        <>
            <header className="p-4 pt-6 space-y-4 bg-background-light dark:bg-background-dark">
                <div className="flex items-center h-12 justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">{t('appTitle')}</h1>
                    <div className="flex h-8 w-28 items-center justify-center rounded-full bg-border-light dark:bg-card-dark p-1">
                        {(['tr', 'en', 'ku'] as const).map(lang => (
                            <label key={lang} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-xs font-semibold ${uiLang === lang ? 'bg-card-light dark:bg-background-dark text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
                                <span className="truncate">{lang.toUpperCase()}</span>
                                <input className="invisible w-0" name="ui-lang" type="radio" value={lang} checked={uiLang === lang} onChange={() => setUiLang(lang)} />
                            </label>
                        ))}
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 px-1">{t('appSubtitle')}</p>
            </header>

            <main className="flex-grow p-4 space-y-4">
                <div className="flex items-center justify-between gap-2 p-2 bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark">
                    <div className="relative flex-1">
                        <select value={sourceLang} onChange={e => setSourceLang(e.target.value as Language)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-medium focus:outline-none focus:ring-0 border-none">
                            <option value="auto">{t('autoDetect')}</option>
                            <option value="ku">{t('kurdish')}</option>
                            <option value="tr">{t('turkish')}</option>
                            <option value="en">{t('english')}</option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">expand_more</span>
                    </div>
                    <button onClick={handleSwapLanguages} disabled={sourceLang === 'auto'} className="flex items-center justify-center h-10 w-10 rounded-full bg-border-light dark:bg-border-dark text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" title={t('swapLanguages')}>
                        <span className="material-symbols-outlined">swap_horiz</span>
                    </button>
                    <div className="relative flex-1">
                        <select value={targetLang} onChange={e => setTargetLang(e.target.value as Language)} className="w-full appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-medium text-right focus:outline-none focus:ring-0 border-none">
                            <option value="ku">{t('kurdish')}</option>
                            <option value="tr">{t('turkish')}</option>
                            <option value="en">{t('english')}</option>
                        </select>
                        <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">expand_more</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm border border-border-light dark:border-border-dark">
                    <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} maxLength={5000} className="flex w-full min-h-[120px] flex-1 resize-none bg-transparent p-0 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-0 border-none" placeholder={t('sourcePlaceholder')}></textarea>
                    <div className="flex items-center justify-between">
                        {result?.correctedSourceText && result.correctedSourceText !== sourceText && (
                            <button onClick={handleCorrectionClick} className="text-sm text-primary">
                                {t('didYouMean')} <span className="font-semibold">{result.correctedSourceText}</span>
                            </button>
                        )}
                        <div className='flex-grow' />
                        <p className="text-xs text-gray-400 dark:text-gray-500">{sourceText.length}/5000</p>
                    </div>
                    <div className="h-px bg-border-light dark:bg-border-dark"></div>
                    <div className="flex items-center justify-end gap-2">
                        <button disabled={isSourceKurdish || !sourceText} onClick={() => speakText(sourceText)} title={isSourceKurdish ? t('kurdishNotSupportedForTTS') : t('speakTooltip')} className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-border-light dark:hover:bg-border-dark text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined">volume_up</span>
                        </button>
                        <button onClick={() => copyToClipboard(sourceText, 'source')} title={t('copyTooltip')} className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-border-light dark:hover:bg-border-dark text-gray-600 dark:text-gray-300">
                           <span className="material-symbols-outlined">{copiedStates['source'] ? 'check' : 'content_copy'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-4 rounded-lg bg-card-light dark:bg-card-dark p-4 shadow-sm border border-border-light dark:border-border-dark">
                    <div className="min-h-[120px] flex items-start">
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            </div>
                        ) : (
                            <p className="text-lg text-primary">{result?.mainTranslation}</p>
                        )}
                    </div>

                    {result?.meaningExplanation && isMeaningVisible && (
                         <div className="p-3 text-sm rounded-lg bg-background-light dark:bg-background-dark text-gray-600 dark:text-gray-300">
                             <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('meaningTitle')}</h4>
                             {result.meaningExplanation}
                         </div>
                    )}

                    <div className="h-px bg-border-light dark:bg-border-dark"></div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button disabled={isTargetKurdish || !result?.mainTranslation} onClick={() => speakText(result?.mainTranslation)} title={isTargetKurdish ? t('kurdishNotSupportedForTTS') : t('speakTooltip')} className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-border-light dark:hover:bg-border-dark text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined">volume_up</span>
                            </button>
                            <button onClick={() => copyToClipboard(result?.mainTranslation, 'target')} title={t('copyTooltip')} className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-border-light dark:hover:bg-border-dark text-gray-600 dark:text-gray-300">
                                <span className="material-symbols-outlined">{copiedStates['target'] ? 'check' : 'content_copy'}</span>
                            </button>
                        </div>
                        {result?.meaningExplanation && (
                            <button onClick={() => setIsMeaningVisible(!isMeaningVisible)} title={t('infoTooltip')} className="flex items-center justify-center h-10 w-10 rounded-full text-secondary hover:bg-secondary/10">
                                <span className="material-symbols-outlined text-2xl">info</span>
                            </button>
                        )}
                    </div>
                    
                    {result && result.alternativeTranslations.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h4 className='text-sm font-semibold text-gray-500 dark:text-gray-400 px-1'>{t('alternativesTitle')}</h4>
                            {result.alternativeTranslations.map((alt, index) => (
                                <div key={index} onClick={() => handleAlternativeClick(alt)} className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-background-dark cursor-pointer">
                                    <p className="text-sm font-medium">{alt}</p>
                                    <span className="material-symbols-outlined text-lg text-gray-400">swap_horiz</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-700 dark:text-red-400 rounded-lg border border-red-500/20">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
            </main>
        </>
    );
};

export default App;