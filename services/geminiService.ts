import { GoogleGenAI, Type } from "@google/genai";
import { Language, languageMap, TranslationResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        detectedLanguage: {
            type: Type.STRING,
            description: "The detected source language (e.g., 'Kurdish', 'Turkish', 'English'). Only present if source language is 'auto'."
        },
        correctedSourceText: {
            type: Type.STRING,
            description: "The source text after correcting any spelling or grammatical errors. This is a critical step."
        },
        mainTranslation: {
            type: Type.STRING,
            description: "The most accurate and primary translation of the text. For idioms or terms of endearment, this should be the commonly understood meaning."
        },
        alternativeTranslations: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of up to 3 alternative translations. If the main translation is idiomatic, one alternative should be the literal translation."
        },
        meaningExplanation: {
            type: Type.STRING,
            description: "A brief, 1-2 sentence explanation of the translation's cultural context, nuance, or idiomatic meaning. For example, for 'çavreşamın', explain it literally means 'my black eyes' but is used as a term of endearment for a loved one."
        }
    },
    required: ["mainTranslation", "alternativeTranslations", "correctedSourceText", "meaningExplanation"]
};

export const translateText = async (
    text: string,
    sourceLang: Language,
    targetLang: Language,
    uiLang: 'tr' | 'en' | 'ku' // Added UI language parameter
): Promise<TranslationResult> => {
    if (!text.trim()) {
        return {
            detectedLanguage: '',
            correctedSourceText: '',
            mainTranslation: '',
            alternativeTranslations: [],
            meaningExplanation: '',
        };
    }

    const sourceLanguageName = languageMap[sourceLang];
    const targetLanguageName = languageMap[targetLang];
    // Get the full name of the UI language for the prompt
    const uiLanguageName = languageMap[uiLang as Language] || 'Turkish';

    const prompt = `
        You are a world-class, expert multilingual translator specializing in Kurdish (Kurmanji and Sorani dialects), Turkish, and English. Your translations must be precise, culturally aware, and contextually accurate.

        Your task is to translate the following text.
        Source Language: "${sourceLanguageName}"
        Target Language: "${targetLanguageName}"
        Text to Translate: "${text}"

        Follow these steps with extreme precision:
        1.  If Source Language is 'Auto Detect', first identify if the text is Kurdish, Turkish, or English.
        2.  Carefully analyze the text. It may contain colloquialisms, slang, or spelling errors (e.g., 'te ez helendım' should be understood as 'te ez hilandim').
        3.  First, provide a corrected version of the source text in its original language. This is a crucial step.
        4.  Provide the most accurate, natural-sounding translation in the target language. For terms of endearment or idioms (like 'çavreşamın' which literally means 'my black eyes' but is used as 'my darling'), provide the common usage translation in 'mainTranslation'. The literal translation should be an alternative.
        5.  Provide up to 3 alternative translations that capture different nuances.
        6.  Provide a concise 'meaningExplanation' in 1-2 sentences, written in ${uiLanguageName}. This explanation should clarify the cultural context, nuance, or idiomatic meaning. This is mandatory. For 'çavreşamın', you would explain that it literally means 'my black eyes' but is used as a poetic term of endearment.
        7.  Respond ONLY with a valid JSON object that follows the provided schema. Do not add any other text, explanations, or markdown formatting outside the JSON structure.
    `;

    try {
        const response = await ai.models.generateContent({
            // FIX: Use 'gemini-2.5-flash' for basic text tasks as per guidelines.
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        return {
            detectedLanguage: result.detectedLanguage || '',
            correctedSourceText: result.correctedSourceText || text,
            mainTranslation: result.mainTranslation || '',
            alternativeTranslations: result.alternativeTranslations || [],
            meaningExplanation: result.meaningExplanation || ''
        };

    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to get translation from AI. Please check your API key and try again.");
    }
};