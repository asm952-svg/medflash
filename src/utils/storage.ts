import { Deck, Flashcard, StudyStats } from '../types';
import { INITIAL_DECKS, INITIAL_CARDS } from '../data/defaultDecks';

const STORAGE_KEYS = {
  DECKS: 'medflash_custom_decks_v2',
  CARDS: 'medflash_custom_cards_v2',
  STATS: 'medflash_custom_stats_v2',
  LANG: 'medflash_lang_v2',
  SETTINGS: 'medflash_ai_settings_v1',
  SESSION_POINTER: 'medflash_active_session_v1',
};

export interface AISettings {
  geminiApiKey: string;
  geminiModel: string;
}

const DEFAULT_AI_SETTINGS: AISettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
};

export function loadAISettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load AI settings', e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save AI settings', e);
  }
}

export interface SessionPointer {
  type: 'study' | 'quiz' | 'active_recall';
  deckId: string;
  startedAt: string;
}

export function loadSessionPointer(): SessionPointer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_POINTER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load session pointer', e);
  }
  return null;
}

export function saveSessionPointer(pointer: SessionPointer) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_POINTER, JSON.stringify(pointer));
  } catch (e) {
    console.error('Failed to save session pointer', e);
  }
}

export function clearSessionPointer() {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_POINTER);
  } catch (e) {
    console.error('Failed to clear session pointer', e);
  }
}

// Clean legacy auto-generated keys once
try {
  if (localStorage.getItem('medflash_cards_v1')) {
    localStorage.removeItem('medflash_cards_v1');
    localStorage.removeItem('medflash_decks_v1');
    localStorage.removeItem('medflash_stats_v1');
  }
} catch (e) {
  // ignore
}

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DECKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load decks from storage', e);
  }
  saveDecks(INITIAL_DECKS);
  return INITIAL_DECKS;
}

export function saveDecks(decks: Deck[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DECKS, JSON.stringify(decks));
  } catch (e) {
    console.error('Failed to save decks', e);
  }
}

export function loadCards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load cards from storage', e);
  }
  saveCards(INITIAL_CARDS);
  return INITIAL_CARDS;
}

export function saveCards(cards: Flashcard[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards', e);
  }
}

export function clearAllCards() {
  saveCards([]);
  return [];
}


export function loadStats(): StudyStats {
  const defaultStats: StudyStats = {
    totalReviews: 0,
    totalCardsStudied: 0,
    streakDays: 1,
    lastStudyDate: new Date().toISOString().split('T')[0],
    retentionRate: 85,
    history: [
      {
        date: new Date().toISOString().split('T')[0],
        count: 0,
        correctCount: 0,
      },
    ],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) {
      return { ...defaultStats, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return defaultStats;
}

export function saveStats(stats: StudyStats) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function recordCardReviewInStats(rating: number) {
  const stats = loadStats();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = stats.lastStudyDate;

  // Check streak
  if (lastDate !== today) {
    const lastTime = new Date(lastDate).getTime();
    const todayTime = new Date(today).getTime();
    const diffDays = Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.streakDays += 1;
    } else if (diffDays > 1) {
      stats.streakDays = 1;
    }
    stats.lastStudyDate = today;
  }

  stats.totalReviews += 1;
  const isCorrect = rating >= 2;

  let todayRecord = stats.history.find((h) => h.date === today);
  if (!todayRecord) {
    todayRecord = { date: today, count: 0, correctCount: 0 };
    stats.history.push(todayRecord);
  }
  todayRecord.count += 1;
  if (isCorrect) todayRecord.correctCount += 1;

  // Calculate retention rate across last 100 reviews
  const totalInHistory = stats.history.reduce((acc, h) => acc + h.count, 0);
  const totalCorrect = stats.history.reduce((acc, h) => acc + h.correctCount, 0);
  stats.retentionRate = totalInHistory > 0 ? Math.round((totalCorrect / totalInHistory) * 100) : 100;

  saveStats(stats);
}

export function resetAllToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.DECKS);
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem(STORAGE_KEYS.STATS);
  return {
    decks: INITIAL_DECKS,
    cards: INITIAL_CARDS,
    stats: loadStats(),
  };
}
