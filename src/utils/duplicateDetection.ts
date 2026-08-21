import { Flashcard } from '../types';

/**
 * Normalizes Persian/English text for comparison purposes:
 * - lowercases
 * - unifies Arabic/Persian character variants (ي/ی, ك/ک, ة/ه)
 * - strips diacritics (اعراب), punctuation and extra whitespace/digits noise
 */
export function normalizeForCompare(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // Arabic/Persian diacritics
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200f\u200e]/g, ' ') // ZWNJ/RTL/LTR marks
    .replace(/[.,،؛;:!؟?"'`~()\[\]{}<>«»\-_/\\|+=*%$#@^]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(normalizeForCompare(text).split(' ').filter((w) => w.length > 1));
}

/** Jaccard similarity between the word sets of two strings (0..1). */
export function textSimilarity(a: string, b: string): number {
  const normA = normalizeForCompare(a);
  const normB = normalizeForCompare(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  setA.forEach((tok) => {
    if (setB.has(tok)) intersection += 1;
  });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DuplicateMatch {
  matchedCard: Flashcard | Partial<Flashcard>;
  score: number; // 0..1, weighted similarity of front (mostly) + back
}

const FRONT_WEIGHT = 0.75;
const BACK_WEIGHT = 0.25;
export const DUPLICATE_THRESHOLD = 0.82;

/** Combined similarity score between two cards, weighted toward the question (front). */
export function cardSimilarity(
  a: { front?: string; back?: string },
  b: { front?: string; back?: string }
): number {
  const frontSim = textSimilarity(a.front || '', b.front || '');
  const backSim = textSimilarity(a.back || '', b.back || '');
  return frontSim * FRONT_WEIGHT + backSim * BACK_WEIGHT;
}

/**
 * Finds the closest match for `candidate` among `pool`, if any exceeds the
 * duplicate threshold. Returns null if no likely duplicate is found.
 */
export function findDuplicate(
  candidate: { front?: string; back?: string; id?: string },
  pool: (Flashcard | Partial<Flashcard>)[],
  threshold: number = DUPLICATE_THRESHOLD
): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;
  for (const other of pool) {
    if (other.id && candidate.id && other.id === candidate.id) continue;
    const score = cardSimilarity(candidate, other);
    if (score >= threshold && (!best || score > best.score)) {
      best = { matchedCard: other, score };
    }
  }
  return best;
}

export interface BatchDedupeResult {
  /** Index in the original array -> duplicate match info (against existing cards or earlier items in the same batch). */
  duplicates: Map<number, DuplicateMatch & { isInternal: boolean }>;
}

/**
 * Flags duplicates within a batch of new cards, checking each one against:
 *  1) cards already saved in the app (existingCards)
 *  2) cards earlier in the same batch (to catch repeats within one JSON paste)
 */
export function detectDuplicatesInBatch(
  newCards: (Partial<Flashcard>)[],
  existingCards: (Flashcard | Partial<Flashcard>)[],
  threshold: number = DUPLICATE_THRESHOLD
): BatchDedupeResult {
  const duplicates = new Map<number, DuplicateMatch & { isInternal: boolean }>();
  const acceptedSoFar: Partial<Flashcard>[] = [];

  newCards.forEach((card, index) => {
    const existingMatch = findDuplicate(card, existingCards, threshold);
    if (existingMatch) {
      duplicates.set(index, { ...existingMatch, isInternal: false });
      return;
    }
    const internalMatch = findDuplicate(card, acceptedSoFar, threshold);
    if (internalMatch) {
      duplicates.set(index, { ...internalMatch, isInternal: true });
      return;
    }
    acceptedSoFar.push(card);
  });

  return { duplicates };
}
