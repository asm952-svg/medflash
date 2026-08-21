import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Latest & Recommended)' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (High Efficiency)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Fastest)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Reasoning)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Legacy Fallback)' },
];

export async function generateFlashcards(
  prompt: string,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return response.text || '';
}

export async function explainConcept(
  prompt: string,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });

  return response.text || '';
}