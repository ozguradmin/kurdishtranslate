import { GoogleGenAI, Type } from "@google/genai";
import { Language, languageMap, TranslationResult } from '../types';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        detectedLanguage: {
            type: Type.STRING,
            description: "The detected source language (e.g., 'Kurdish', 'Turkish', 'English'). Only present if source language is 'auto'."
        },
        correctedSourceText: {
            type: Type.STRING,
            description: "The source text after correcting any spelling or grammatical errors. This MUST be in the original source language."
        },
        mainTranslation: {
            type: Type.STRING,
            description: "The most accurate and primary translation of the text in the specified target language."
        },
        alternativeTranslations: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            },
            description: "A list of up to 3 alternative translations in the target language."
        },
        meaningExplanation: {
            type: Type.STRING,
            description: "A brief, 1-2 sentence explanation of the translation's cultural context, nuance, or idiomatic meaning, written in the specified UI language."
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
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable is not set.");
        throw new Error("API_KEY_MISSING");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const uiLanguageName = languageMap[uiLang as Language] || 'Turkish';

    const prompt = `
        **Persona:**
        You are a world-class linguist and cultural expert, specializing in the Kurdish (Kurmanji), Turkish, and English languages. You function as a sophisticated translation engine with deep semantic and cultural understanding.

        **Knowledge Base:**
        Your knowledge base is pre-loaded with the entirety of major linguistic resources, including:
        - The Zana Farqînî Kurdish-Turkish Dictionary.
        - The D. Îzolî Kurdish-Turkish/Turkish-Kurdish Dictionary.
        - Comprehensive Kurdish grammar books (e.g., works by Celadet Bedirxan).
        - An extensive corpus of Kurdish literature, poetry, and modern media.
        Your primary goal is to leverage this deep knowledge to provide translations that are not just accurate, but also culturally resonant and contextually appropriate.

        **Core Translation Principles:**
        1.  **Idiomatic over Literal:** Always prefer the most natural and idiomatic expression in the target language. If a literal translation is significantly different, provide it as an alternative.
        2.  **Context is King:** Analyze the source text for tone (formal, informal, poetic, etc.) and preserve it in the translation.
        3.  **Dialectical Nuance:** Assume the Kurdish dialect is Kurmanji unless specific vocabulary suggests otherwise (e.g., Sorani).
        4.  **Cultural Resonance:** Pay close attention to idioms, metaphors, and cultural references, and explain them clearly in the 'meaningExplanation' field.

        **Task:**
        You will be given a text in a specified source language to translate into a target language. You must return a structured JSON object with the translation and related details.

        **Translation Details:**
        - Source Language: ${sourceLanguageName}
        - Target Language: ${targetLanguageName}
        - Text to Translate: "${text}"
        - The user interface language for explanations is: ${uiLanguageName}

        **Execution Instructions (Strictly follow this order):**
        1.  **Correct Source Text**: Analyze the source text for any errors (spelling, grammar, common typos). Provide the corrected version in the **original source language (${sourceLanguageName})**. If perfect, return the original text. This goes into \`correctedSourceText\`.
        2.  **Primary Translation**: Generate the most accurate, high-quality, and natural-sounding translation in the **target language (${targetLanguageName})**. This goes into \`mainTranslation\`.
        3.  **Alternative Translations**: Offer up to 3 diverse alternatives in the **target language (${targetLanguageName})**. These should explore different nuances, tones, or literal meanings. This goes into \`alternativeTranslations\`.
        4.  **Meaning and Context**: Provide a concise, 1-2 sentence explanation of any interesting cultural context, idioms, or nuances. This MUST be written in **${uiLanguageName}**. If there's no special context, briefly state that the translation is straightforward. This goes into \`meaningExplanation\`.

        **Output Format:**
        Respond ONLY with a single, valid JSON object that strictly adheres to the provided schema. Do not include any commentary, markdown, or text outside of the JSON structure. The \`mainTranslation\` and \`alternativeTranslations\` MUST be in ${targetLanguageName}.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
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
