import { Flashcard } from '../types';

export interface ParseResult {
  success: boolean;
  cards: Partial<Flashcard>[];
  errors: string[];
  formatDetected: 'json' | 'markdown' | 'tsv' | 'unknown';
}

/**
 * Intelligent parser that can digest JSON, Markdown, TSV, or AI formatted flashcards
 */
export function parseCardsFromText(rawText: string, deckId: string): ParseResult {
  const text = rawText.trim();
  const errors: string[] = [];
  const cards: Partial<Flashcard>[] = [];

  if (!text) {
    return { success: false, cards: [], errors: ['متنی جهت پردازش وارد نشده است.'], formatDetected: 'unknown' };
  }

  // 1. Try parsing JSON (including JSON embedded in markdown codeblocks)
  try {
    let jsonString = text;
    // Extract JSON from ```json ... ``` or ``` ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    } else {
      // Find outermost array [ ... ]
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        jsonString = text.substring(firstBracket, lastBracket + 1);
      }
    }

    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      parsed.forEach((item, index) => {
        const front = item.front || item.question || item.q || item.title || item.روی_کارت || '';
        const back = item.back || item.answer || item.a || item.explanation || item.پشت_کارت || '';

        if (!front || !back) {
          errors.push(`کارت شماره ${index + 1} فاقد متن روی کارت (Front) یا پشت کارت (Back) است.`);
          return;
        }

        const options = Array.isArray(item.options) ? item.options.map(String) : [];
        let correctOptionIndex = typeof item.correctOptionIndex === 'number' ? item.correctOptionIndex : undefined;
        let correctAnswer = item.correctAnswer || '';

        // If correctAnswer is specified but correctOptionIndex is not, find matching index
        if (correctOptionIndex === undefined && correctAnswer && options.length > 0) {
          const matchIdx = options.findIndex((opt: string) => opt.trim() === correctAnswer.trim());
          if (matchIdx !== -1) {
            correctOptionIndex = matchIdx;
          }
        }

        // If correctOptionIndex is specified, verify correctAnswer
        if (correctOptionIndex !== undefined && options[correctOptionIndex] && !correctAnswer) {
          correctAnswer = options[correctOptionIndex];
        }

        const cardType = item.cardType === 'mcq' || options.length >= 2 ? 'mcq' : (item.cardType || 'standard');

        cards.push({
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deckId,
          cardType,
          front: String(front).trim(),
          back: String(back).trim(),
          keyPoint: item.keyPoint || item.key_point || item.نکته_کلیدی || '',
          mnemonic: item.mnemonic || item.رمز || item.یادیار || '',
          specialty: item.specialty || item.تخصص || '',
          tags: Array.isArray(item.tags) ? item.tags.map(String) : typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : [],
          options,
          correctOptionIndex: correctOptionIndex !== undefined ? correctOptionIndex : (options.length > 0 ? 0 : undefined),
          correctAnswer,
          clozeAnswer: item.clozeAnswer || '',
          difficultyRating: item.difficulty || 'medium',
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          state: 'new',
          lapses: 0,
        });
      });

      if (cards.length > 0) {
        return {
          success: true,
          cards,
          errors,
          formatDetected: 'json',
        };
      }
    }
  } catch (jsonErr) {
    // Not valid JSON, fallback to line-by-line / Markdown
  }

  // 2. Try parsing Markdown format (e.g. # Question / ## Answer or Q: / A:)
  const lines = text.split('\n');
  let currentFront = '';
  let currentBack = '';
  let currentKeyPoint = '';
  let currentMnemonic = '';

  const pushCurrentCard = () => {
    if (currentFront.trim() && currentBack.trim()) {
      cards.push({
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deckId,
        front: currentFront.trim(),
        back: currentBack.trim(),
        keyPoint: currentKeyPoint.trim(),
        mnemonic: currentMnemonic.trim(),
        tags: [],
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        state: 'new',
        lapses: 0,
      });
    }
    currentFront = '';
    currentBack = '';
    currentKeyPoint = '';
    currentMnemonic = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check for delimiter like "---" or "==="
    if (line.startsWith('---') || line.startsWith('===')) {
      pushCurrentCard();
      continue;
    }

    // Check for TSV / Tab separation (Front \t Back)
    if (line.includes('\t')) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        cards.push({
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deckId,
          front: parts[0].trim(),
          back: parts[1].trim(),
          keyPoint: parts[2]?.trim() || '',
          mnemonic: parts[3]?.trim() || '',
          tags: [],
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          state: 'new',
          lapses: 0,
        });
        continue;
      }
    }

    // Check for Q: / A: or سوال: / پاسخ:
    if (/^(Q|Question|سوال|روی کارت)[:：]/i.test(line)) {
      if (currentFront && currentBack) pushCurrentCard();
      currentFront = line.replace(/^(Q|Question|سوال|روی کارت)[:：]\s*/i, '');
    } else if (/^(A|Answer|پاسخ|پشت کارت)[:：]/i.test(line)) {
      currentBack = line.replace(/^(A|Answer|پاسخ|پشت کارت)[:：]\s*/i, '');
    } else if (/^(Key|نکته|نکته کلیدی)[:：]/i.test(line)) {
      currentKeyPoint = line.replace(/^(Key|نکته|نکته کلیدی)[:：]\s*/i, '');
    } else if (/^(Mnemonic|رمز|یادیار)[:：]/i.test(line)) {
      currentMnemonic = line.replace(/^(Mnemonic|رمز|یادیار)[:：]\s*/i, '');
    } else if (currentBack) {
      currentBack += '\n' + line;
    } else if (currentFront) {
      currentFront += '\n' + line;
    }
  }
  pushCurrentCard();

  if (cards.length > 0) {
    return {
      success: true,
      cards,
      errors,
      formatDetected: 'markdown',
    };
  }

  return {
    success: false,
    cards: [],
    errors: ['فرمت داده نامعتبر است. لطفاً از خروجی JSON تولید شده توسط پرامپت هوش مصنوعی استفاده کنید.'],
    formatDetected: 'unknown',
  };
}
