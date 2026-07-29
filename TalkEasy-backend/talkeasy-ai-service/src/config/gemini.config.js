export const GEMINI_CONFIG = {
    default: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    },
    creative: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    },
    code: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    }
};

export const SAFETY_SETTINGS = [
    {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
];
