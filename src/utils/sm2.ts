import { Flashcard, ReviewRating, ReviewLog } from '../types';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 * Calculates the next interval, repetition count, and ease factor
 * based on user recall grade (1 = Again, 2 = Hard, 3 = Good, 4 = Easy).
 */
export function calculateSM2(
  card: Flashcard,
  rating: ReviewRating
): {
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: string;
  state: Flashcard['state'];
  lapses: number;
} {
  let { repetitions, interval, easeFactor, lapses } = card;
  easeFactor = easeFactor || 2.5;

  let newInterval: number;
  let newRepetitions: number;
  let newEaseFactor: number;
  let newLapses = lapses || 0;

  // Grade mapping for SM-2:
  // Rating 1 (Again / Forgotten) -> Grade 1
  // Rating 2 (Hard / Difficult)  -> Grade 3
  // Rating 3 (Good / Recalled)   -> Grade 4
  // Rating 4 (Easy / Mastered)   -> Grade 5

  if (rating === 1) {
    // Forgotten: reset repetitions and interval to 1 day
    newRepetitions = 0;
    newInterval = 1;
    newLapses += 1;
    // Lower ease factor
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 2) {
    // Hard: correct with struggle
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.max(1, Math.round(interval * 1.2));
    }
    newEaseFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 3) {
    // Good: standard successful recall
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.max(1, Math.round(interval * easeFactor));
    }
    // SM-2 formula EF' = EF + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)) with grade 4:
    newEaseFactor = Math.max(1.3, easeFactor);
  } else {
    // Easy: mastered with ease, reward with bonus interval
    newRepetitions = repetitions + 1;
    if (newRepetitions === 1) {
      newInterval = 4;
    } else if (newRepetitions === 2) {
      newInterval = 8;
    } else {
      newInterval = Math.max(1, Math.round(interval * easeFactor * 1.3));
    }
    newEaseFactor = Math.min(3.2, easeFactor + 0.15);
  }

  // Calculate next review timestamp
  const now = new Date();
  const nextDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  // Determine state
  let state: Flashcard['state'] = 'review';
  if (newRepetitions === 0) {
    state = 'learning';
  } else if (newRepetitions >= 4 && newInterval >= 21) {
    state = 'mastered';
  }

  return {
    repetitions: newRepetitions,
    interval: newInterval,
    easeFactor: Number(newEaseFactor.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
    state,
    lapses: newLapses,
  };
}

/**
 * Returns human-readable next review interval preview for the UI buttons
 */
export function getIntervalPreview(
  card: Flashcard,
  rating: ReviewRating,
  language: 'fa' | 'en' = 'fa'
): string {
  const result = calculateSM2(card, rating);
  const days = result.interval;

  if (language === 'fa') {
    if (rating === 1) return '< ۱۰ دقیقه';
    if (days === 1) return '۱ روز';
    if (days < 30) return `${days} روز`;
    const months = Math.round(days / 30);
    return `${months} ماه`;
  } else {
    if (rating === 1) return '< 10 min';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30);
    return `${months} mo`;
  }
}

/**
 * Checks if a card is currently due for review
 */
export function isCardDue(card: Flashcard): boolean {
  if (!card.nextReviewDate) return true;
  const reviewTime = new Date(card.nextReviewDate).getTime();
  const nowTime = Date.now();
  return reviewTime <= nowTime;
}

/**
 * Sorts cards prioritizing due cards and high lapses
 */
export function sortCardsForStudy(cards: Flashcard[]): Flashcard[] {
  return [...cards].sort((a, b) => {
    const dueA = isCardDue(a) ? 0 : 1;
    const dueB = isCardDue(b) ? 0 : 1;
    if (dueA !== dueB) return dueA - dueB;

    // Prioritize learning / lapsed cards
    if (a.state === 'learning' && b.state !== 'learning') return -1;
    if (b.state === 'learning' && a.state !== 'learning') return 1;

    // Prioritize older nextReviewDate
    const dateA = new Date(a.nextReviewDate || 0).getTime();
    const dateB = new Date(b.nextReviewDate || 0).getTime();
    return dateA - dateB;
  });
}
