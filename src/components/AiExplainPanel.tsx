import React, { useState } from 'react';
import { Sparkles, Loader2, ExternalLink, AlertCircle, BookOpenCheck } from 'lucide-react';
import { Flashcard } from '../types';
import { explainCardInDepth, ExplainCardResult, GeminiError } from '../utils/geminiClient';
import { loadAISettings } from '../utils/storage';

interface AiExplainPanelProps {
  card: Flashcard;
  onOpenSettings?: () => void;
}

// Simple in-memory cache so switching cards back and forth (or re-flipping)
// doesn't re-spend API quota for an explanation already fetched this session.
const explainCache = new Map<string, ExplainCardResult>();

export const AiExplainPanel: React.FC<AiExplainPanelProps> = ({ card, onOpenSettings }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    explainCache.has(card.id) ? 'done' : 'idle'
  );
  const [result, setResult] = useState<ExplainCardResult | null>(explainCache.get(card.id) || null);
  const [error, setError] = useState<string>('');

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const cached = explainCache.get(card.id);
    if (cached) {
      setResult(cached);
      setStatus('done');
      return;
    }

    const { geminiApiKey, geminiModel } = loadAISettings();
    if (!geminiApiKey) {
      setError('کلید Gemini API تنظیم نشده است. ابتدا آن را از بخش تنظیمات وارد کنید.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');
    try {
      const res = await explainCardInDepth(
        { front: card.front, back: card.back, keyPoint: card.keyPoint, specialty: card.specialty },
        geminiApiKey,
        geminiModel
      );
      explainCache.set(card.id, res);
      setResult(res);
      setStatus('done');
    } catch (err) {
      const msg = err instanceof GeminiError ? err.message : 'خطا در دریافت توضیح جامع. دوباره تلاش کنید.';
      setError(msg);
      setStatus('error');
    }
  };

  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={handleExplain}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-800 text-xs font-bold transition cursor-pointer"
      >
        <Sparkles className="w-4 h-4" />
        <span>توضیح جامع‌تر با هوش مصنوعی (جستجوی رفرنس معتبر)</span>
      </button>
    );
  }

  if (status === 'loading') {
    return (
      <div className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 text-indigo-700 text-xs font-bold">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>در حال جستجو و تولید توضیح تخصصی‌تر...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full p-3.5 rounded-2xl border border-rose-200 bg-rose-50/80 text-rose-900 text-xs space-y-2"
      >
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExplain}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
          >
            تلاش دوباره
          </button>
          {onOpenSettings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
            >
              باز کردن تنظیمات
            </button>
          )}
        </div>
      </div>
    );
  }

  // done
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 space-y-3"
    >
      <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
        <Sparkles className="w-4 h-4" />
        <span>توضیح جامع‌تر (هوش مصنوعی + جستجوی وب)</span>
      </div>
      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">{result?.explanation}</p>

      {result && result.references.length > 0 && (
        <div className="pt-2 border-t border-indigo-200/80 space-y-1.5">
          <span className="text-[11px] font-bold text-indigo-800 flex items-center gap-1.5">
            <BookOpenCheck className="w-3.5 h-3.5" />
            منابع و رفرنس‌ها:
          </span>
          <ul className="space-y-1">
            {result.references.map((ref, i) => (
              <li key={i}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1.5 break-all"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span>{ref.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
