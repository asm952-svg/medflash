export type ReviewRating = 1 | 2 | 3 | 4; 
// 1 = Again (تکرار - Failed recall, reset interval)
// 2 = Hard (سخت - Correct with effort, interval increases slowly)
// 3 = Good (خوب - Correct with normal recall, standard SM-2 interval)
// 4 = Easy (آسان - Perfect recall, interval increases rapidly)

export type CardState = 'new' | 'learning' | 'review' | 'mastered';

export interface ReviewLog {
  rating: ReviewRating;
  timestamp: string;
  interval: number;
  easeFactor: number;
  timeSpentMs?: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  cardType?: 'standard' | 'mcq'; // Standard Concept Card or 4-Option MCQ
  front: string; // Question, clinical prompt, or concept
  back: string; // Answer, explanation, rationale for right/wrong options
  keyPoint?: string; // High-yield medical takeaway (نکته طلایی)
  mnemonic?: string; // Memory aid (یادیار / رمز)
  specialty?: string; // e.g. فارماکولوژی, قلب, پاتولوژی
  tags: string[];
  options?: string[]; // Multiple choice options (exactly 4 options for MCQ)
  correctOptionIndex?: number; // 0, 1, 2, or 3 index of the correct answer
  correctAnswer?: string; // Text of the correct answer
  clozeAnswer?: string; // Keyword for active recall typing
  difficultyRating?: 'easy' | 'medium' | 'hard';
  
  // Spaced Repetition (SM-2) Tracking
  repetitions: number;
  interval: number; // Days until next review
  easeFactor: number; // SM-2 EF, default 2.5
  nextReviewDate: string; // ISO date string
  lastReviewedDate?: string;
  state: CardState;
  lapses: number; // Number of times forgotten
  history?: ReviewLog[];
}

export interface Deck {
  id: string;
  title: string;
  englishTitle?: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  createdAt: string;
  tags: string[];
}

export type StudyMode = 'standard' | 'quiz' | 'active_recall';

export interface AIPromptConfig {
  language: 'persian' | 'english' | 'bilingual';
  cardCount: number;
  cardFormat?: 'standard' | 'mcq' | 'mixed'; // Format: Standard or 4-Option MCQ
  style: 'high-yield' | 'clinical-vignette' | 'drug-mechanism' | 'qa' | 'comprehensive';
  specialty: string;
  includeMnemonics: boolean;
  includeMultipleChoice: boolean;
  targetBook?: string;
  chapterTopic?: string;
}

export interface DailyStudyRecord {
  date: string; // YYYY-MM-DD
  count: number;
  correctCount: number;
}

export interface StudyStats {
  totalReviews: number;
  totalCardsStudied: number;
  streakDays: number;
  lastStudyDate: string;
  retentionRate: number; // 0 - 100
  history: DailyStudyRecord[];
}
