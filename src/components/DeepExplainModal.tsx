import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, KeyRound, ExternalLink, Link2 } from 'lucide-react';
import { loadAISettings } from '../utils/storage';
import { explainCardInDepth, GeminiError, GroundingSource } from '../utils/geminiClient';

interface DeepExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    front: string;
    back: string;
    keyPoint?: string;
    specialty?: string;
  } | null;
  onOpenSettings?: () => void;
}

export const DeepExplainModal: React.FC<DeepExplainModalProps> = ({ isOpen, onClose, card, onOpenSettings }) => {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [text, setText] = useState('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);

  useEffect(() => {
    if (!isOpen || !card) return;

    let cancelled = false;
    setState('loading');
    setText('');
    setSources([]);
    setErrorMessage('');
    setNeedsApiKey(false);

    (async () => {
      try {
        const { geminiApiKey, geminiModel } = loadAISettings();
        if (!geminiApiKey) {
          setNeedsApiKey(true);
          throw new GeminiError('برای دریافت توضیح جامع‌تر، ابتدا کلید Gemini API خود را در تنظیمات وارد کنید.');
        }
        const result = await explainCardInDepth({
          front: card.front,
          back: card.back,
          keyPoint: card.keyPoint,
          specialty: card.specialty,
          apiKey: geminiApiKey,
          model: geminiModel,
        });
        if (cancelled) return;
        setText(result.text);
        setSources(result.sources);
        setState('success');
      } catch (err: any) {
        if (cancelled) return;
        if (err instanceof GeminiError && /کلید Gemini API/.test(err.message)) {
          setNeedsApiKey(true);
        }
        setErrorMessage(err.message || 'خطا در دریافت توضیح جامع‌تر.');
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-l from-emerald-900 via-teal-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">توضیح جامع‌تر با هوش مصنوعی</h2>
              <p className="text-[11px] sm:text-xs text-slate-300">جستجوی وب برای منابع و توضیح تکمیلی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600">
            <span className="font-bold text-slate-800 block mb-1">سوال کارت:</span>
            <span className="leading-relaxed">{card.front}</span>
          </div>

          {state === 'loading' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-bold">
                در حال جستجوی وب و آماده‌سازی توضیح جامع‌تر...
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="font-bold leading-relaxed">{errorMessage}</p>
                {needsApiKey && onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSettings();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>باز کردن تنظیمات</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 leading-loose whitespace-pre-wrap">
                {text}
              </div>

              {sources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Link2 className="w-4 h-4 text-slate-500" />
                    <span>منابع یافت‌شده از وب:</span>
                  </div>
                  <div className="space-y-1.5">
                    {sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-700 transition"
                        dir="ltr"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{s.title || s.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
