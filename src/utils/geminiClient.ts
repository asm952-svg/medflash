import { GoogleGenAI } from '@google/genai';
import { Flashcard } from '../types';

export const GEMINI_MODELS = [
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Latest & Recommended)' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (High Efficiency)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Fastest)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Deep Reasoning)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
];

export interface ExplainCardResult {
  text: string;
}

export class GeminiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GeminiError';
  }
}

export async function generateFlashcards(
  prompt: string,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<string> {
  if (!apiKey) throw new GeminiError('Gemini API key is required');
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });
    return response.text || '';
  } catch (error: any) {
    throw new GeminiError(error.message || 'Failed to generate flashcards');
  }
}

export async function explainConcept(
  prompt: string,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<string> {
  if (!apiKey) throw new GeminiError('Gemini API key is required');
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || '';
  } catch (error: any) {
    throw new GeminiError(error.message || 'Failed to explain concept');
  }
}

export async function explainCardInDepth(
  card: Flashcard,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<ExplainCardResult> {
  if (!apiKey) throw new GeminiError('Gemini API key is required');
  
  const prompt = `You are an expert medical tutor. Explain the following flashcard concept in clear, structured medical detail:
  
Question / Term:
${card.front}

Answer / Key Points:
${card.back}

Provide:
1. Core Mechanism / Physiology
2. Clinical Significance & Pearls
3. Key Differential Diagnoses or High-Yield Exam Takeaways`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return {
      text: response.text || '',
    };
  } catch (error: any) {
    throw new GeminiError(error.message || 'Failed to explain card in depth');
  }
}

export async function analyzeStudyPerformance(
  statsData: any,
  apiKey: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<string> {
  if (!apiKey) throw new GeminiError('Gemini API key is required');
  
  const prompt = `You are an expert study coach. Analyze the following study performance data and provide actionable advice, identifying weak areas and suggesting improvements.\n\nData: ${JSON.stringify(statsData, null, 2)}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || '';
  } catch (error: any) {
    throw new GeminiError(error.message || 'Failed to analyze study performance');
  }
}