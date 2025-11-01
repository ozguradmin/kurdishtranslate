import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { translateText } from './services/geminiService';
import { Language, TranslationResult, languageMap } from './types';
import { useTranslation } from './i18n';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const App = () => {
    const { t, language: uiLang, setLanguage: setUiLang } = useTranslation();
    const [sourceText, setSourceText] = useState('');
    const [sourceLang, setSourceLang] = useState<Language>('ku');
    const [targetLang, setTargetLang] = useState<Language>('tr'); // Default to TR
    const [result, setResult] = useState<TranslationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const [isMeaningVisible, setIsMeaningVisible] = useState(false);
    const [showAlternatives, setShowAlternatives] = useState(false);

    const debouncedSourceText = useDebounce(sourceText, 750);
    const requestGenerationRef = useRef(0);

    const performTranslation = useCallback(async () => {
        if (!debouncedSourceText.trim()) {
            setResult(null);
            setError('');
            return;
        }

        const currentGeneration = ++requestGenerationRef.current;
        setIsLoading(true);
        setError('');

        try {
            const translation = await translateText(debouncedSourceText, sourceLang, targetLang, uiLang as 'tr' | 'en' | 'ku');
            if (currentGeneration === requestGenerationRef.current) {
                setResult(translation);
                setIsMeaningVisible(false);
                setShowAlternatives(false);
            }
        } catch (e: any) {
            if (currentGeneration === requestGenerationRef.current) {
                setError(e.message === 'API_KEY_MISSING' ? t('apiKeyMissingError') : t('apiError'));
                setResult(null);
            }
        } finally {
            if (currentGeneration === requestGenerationRef.current) {
                setIsLoading(false);
            }
        }
    }, [debouncedSourceText, sourceLang, targetLang, uiLang, t]);

    useEffect(() => {
        performTranslation();
    }, [performTranslation]);

    useEffect(() => {
        if (sourceLang === targetLang) {
            setTargetLang(sourceLang === 'ku' ? 'en' : 'ku');
        }
    }, [sourceLang, targetLang]);

    const handleSwapLanguages = () => {
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
            const newAlternatives = result.alternativeTranslations.filter(t => t !== alternative).concat(currentMain);
            setResult({ ...result, mainTranslation: alternative, alternativeTranslations: newAlternatives });
        }
    };

    const copyToClipboard = (text: string | undefined, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    };

    const speakText = (text: string | undefined, langCode: Language) => {
        if (!text || typeof window.speechSynthesis === 'undefined') return;
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap: Record<string, string> = { 'en': 'en-US', 'tr': 'tr-TR' };
        if (langMap[langCode]) {
            utterance.lang = langMap[langCode];
        }
        window.speechSynthesis.speak(utterance);
    };

    const isSourceKurdish = useMemo(() => sourceLang === 'ku', [sourceLang]);
    const isTargetKurdish = useMemo(() => targetLang === 'ku', [targetLang]);

    const sourceDisplayLang = t(languageMap[sourceLang].toLowerCase() as 'kurdish' | 'turkish' | 'english');

    return (
        <>
            <header className="p-4 pt-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-text-dark/90">
                        Kurdish<span className="text-primary">AI</span>
                    </h1>
                    <div className="flex items-center gap-1 p-1 rounded-full bg-card-dark border border-border-dark">
                        {(['en', 'tr', 'ku'] as const).map(lang => (
                            <button key={lang} onClick={() => setUiLang(lang)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${uiLang === lang ? 'bg-primary/20 text-primary' : 'text-text-dark/60 hover:bg-border-dark/50'}`}>
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 space-y-4">
                <div className="flex items-center justify-between gap-2 p-1 rounded-full bg-card-dark border border-border-dark">
                    <div className="relative flex-1">
                        <select value={sourceLang} onChange={e => setSourceLang(e.target.value as Language)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                            <option value="ku">{t('kurdish')}</option>
                            <option value="tr">{t('turkish')}</option>
                            <option value="en">{t('english')}</option>
                        </select>
                        <div className="flex items-center gap-1.5 pl-4 py-2 pointer-events-none">
                            <span className="text-sm font-medium text-text-dark/80 truncate">{sourceDisplayLang}</span>
                            <span className="material-symbols-outlined text-base text-text-dark/60">expand_more</span>
                        </div>
                    </div>

                    <button onClick={handleSwapLanguages} className="flex items-center justify-center h-10 w-10 rounded-full bg-background-dark border border-border-dark text-primary shadow-glow-inner" title={t('swapLanguages')}>
                        <span className="material-symbols-outlined text-2xl">swap_horiz</span>
                    </button>

                    <div className="relative flex-1">
                         <select value={targetLang} onChange={e => setTargetLang(e.target.value as Language)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
                            <option value="ku">{t('kurdish')}</option>
                            <option value="tr">{t('turkish')}</option>
                            <option value="en">{t('english')}</option>
                        </select>
                        <div className="flex items-center justify-end gap-1.5 pr-4 py-2 pointer-events-none">
                            <span className="text-sm font-medium text-text-dark/80">{t(targetLang)}</span>
                            <span className="material-symbols-outlined text-base text-text-dark/60">expand_more</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-[160px] justify-between gap-4 rounded-xl bg-card-dark p-4 border border-border-dark focus-within:border-primary/50 focus-within:shadow-glow-sm transition-all">
                    <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} maxLength={5000} className="w-full flex-1 resize-none bg-transparent p-0 text-2xl placeholder:text-text-dark/40 focus:outline-none focus:ring-0 border-none" placeholder={t('sourcePlaceholder')}></textarea>
                    {sourceText && <div className="flex items-center justify-between gap-2 text-text-dark/60 fade-in">
                        {result?.correctedSourceText && result.correctedSourceText !== sourceText && (
                            <button onClick={handleCorrectionClick} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors text-left">
                                <span className="material-symbols-outlined text-base">magic_button</span>
                                <span>{t('didYouMean')} <span className="font-semibold">{result.correctedSourceText}</span></span>
                            </button>
                        )}
                         <div className="flex-grow"></div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => speakText(sourceText, sourceLang)} disabled={isSourceKurdish} title={isSourceKurdish ? t('kurdishNotSupportedForTTS') : t('speakTooltip')} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-border-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <span className="material-symbols-outlined text-xl">volume_up</span>
                            </button>
                            <button onClick={() => copyToClipboard(sourceText, 'source')} title={t('copyTooltip')} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-border-dark/50 transition-colors">
                               <span className="material-symbols-outlined text-xl">{copiedStates['source'] ? 'check' : 'content_copy'}</span>
                            </button>
                        </div>
                    </div>}
                </div>
                
                {isLoading ? (
                    <div className="flex flex-col min-h-[160px] justify-center items-center gap-4 rounded-xl bg-card-dark p-4 border border-border-dark">
                        <div className="flex items-center gap-2 loading-dots">
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                            <div className="h-3 w-3 rounded-full bg-primary"></div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 fade-in">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                ) : result?.mainTranslation && (
                    <div className="relative flex flex-col gap-2 rounded-xl bg-card-dark p-4 border border-border-dark fade-in">
                        <div className="flex flex-col min-h-[72px] justify-center">
                            <p className="text-2xl text-text-dark font-medium pr-10">{result.mainTranslation}</p>
                        </div>

                        {result.meaningExplanation && (
                            <button onClick={() => setIsMeaningVisible(!isMeaningVisible)} title={t('infoTooltip')} className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-primary/80 transition-colors hover:bg-border-dark/50 hover:text-primary">
                                <span className="material-symbols-outlined text-xl">{isMeaningVisible ? 'close' : 'question_mark'}</span>
                            </button>
                        )}
                        
                        {isMeaningVisible && result.meaningExplanation && (
                             <div className="p-3 text-sm rounded-lg bg-background-dark text-text-dark/80 fade-in">
                                 <h4 className="font-semibold text-text-dark/90 mb-1">{t('meaningTitle')}</h4>
                                 {result.meaningExplanation}
                             </div>
                        )}

                        <div className="flex items-center justify-between gap-2 text-text-dark/60">
                            <div className="flex items-center gap-2">
                                {result.alternativeTranslations.length > 0 && (
                                    <button onClick={() => setShowAlternatives(!showAlternatives)} className="flex items-center gap-1.5 text-sm text-primary/80 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-base transition-transform" style={{ transform: showAlternatives ? 'rotate(180deg)' : 'rotate(0deg)'}}>expand_more</span>
                                        <span>{t('alternativesToggle')}</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                 <button onClick={() => speakText(result.mainTranslation, targetLang)} disabled={isTargetKurdish} title={isTargetKurdish ? t('kurdishNotSupportedForTTS') : t('speakTooltip')} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-border-dark/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span className="material-symbols-outlined text-xl">volume_up</span>
                                </button>
                                <button onClick={() => copyToClipboard(result.mainTranslation, 'target')} title={t('copyTooltip')} className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-border-dark/50 transition-colors">
                                   <span className="material-symbols-outlined text-xl">{copiedStates['target'] ? 'check' : 'content_copy'}</span>
                                </button>
                            </div>
                        </div>

                        {showAlternatives && result.alternativeTranslations.length > 0 && (
                            <div className="mt-2 pt-4 border-t border-border-dark space-y-2 fade-in">
                                {result.alternativeTranslations.map((alt, index) => (
                                    <div key={index} className="flex justify-between items-center group p-1 rounded">
                                        <p onClick={() => handleAlternativeClick(alt)} className="text-lg text-text-dark/80 cursor-pointer hover:text-text-dark flex-grow">{alt}</p>
                                        <button onClick={() => copyToClipboard(alt, `alt-${index}`)} title={t('copyTooltip')} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-8 w-8 rounded-full bg-border-dark/50 hover:bg-border-dark text-text-dark/80">
                                            <span className="material-symbols-outlined text-xl">{copiedStates[`alt-${index}`] ? 'check' : 'content_copy'}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
            <footer className="p-4 text-center text-xs text-text-dark/40">
                <p>{t('footerCredit')}</p>
            </footer>
        </>
    );
};

export default App;