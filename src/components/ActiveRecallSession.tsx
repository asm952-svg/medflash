import React, { useState } from 'react';
import {
  ChevronRight,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lightbulb,
  Award,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Deck, Flashcard } from '../types';

interface ActiveRecallSessionProps {
  deck: Deck;
  cards: Flashcard[];
  onExit: () => void;
}

export const ActiveRecallSession: React.FC<ActiveRecallSessionProps> = ({
  deck,
  cards,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedAnswer.trim() || isSubmitted) return;

    setIsSubmitted(true);
    // Simple fuzzy match
    const target = (currentCard.clozeAnswer || currentCard.back).toLowerCase();
    const input = typedAnswer.trim().toLowerCase();

    const isMatch =
      target.includes(input) ||
      input.includes(target) ||
      input.length >= 3 && target.includes(input.slice(0, Math.floor(input.length * 0.8)));

    if (isMatch) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setTypedAnswer('');
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
      try {
        confetti({ particleCount: 70, spread: 50 });
      } catch (e) {}
    }
  };

  if (!currentCard || isFinished) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-6" dir="rtl">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-500/10">
          <Award className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">جلسه بازیابی فعال به پایان رسید! 🧠</h2>
          <p className="text-xs text-slate-500">
            تایپ مستقیم پاسخ‌ها حافظه بلندمدت نورونی شما را تقویت می‌کند.
          </p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl max-w-xs mx-auto">
          <span className="text-[11px] text-purple-700 font-medium block">تعداد پاسخ‌های موفق</span>
          <span className="text-2xl font-black text-purple-900">
            {score} از {cards.length}
          </span>
        </div>

        <div className="pt-2">
          <button
            onClick={onExit}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/20"
          >
            بازگشت به دسته‌ها
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-slate-800">بازیابی فعال و تایپ پاسخ (Active Recall)</span>
            <span className="text-[11px] text-slate-400 block">
              کارت {currentIndex + 1} از {cards.length}
            </span>
          </div>
        </div>

        <div className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl">
          امتیاز: {score}
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
            سوال / سناریوی تشخیصی
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
            {currentCard.front}
          </p>
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              پاسخ، نام دارو، ساختار آناتومیک یا اقدام بالینی را تایپ کنید:
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={isSubmitted}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="تایپ پاسخ..."
                className="w-full text-sm p-4 bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none pr-4 pl-12"
              />
              {!isSubmitted && (
                <button
                  type="submit"
                  disabled={!typedAnswer.trim()}
                  className="absolute left-2.5 top-2.5 p-2 bg-purple-600 disabled:opacity-40 hover:bg-purple-700 text-white rounded-xl transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Evaluation Output */}
        {isSubmitted && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-purple-900 block">پاسخ مرجع استاندارد:</span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{currentCard.back}</p>
            </div>

            {currentCard.keyPoint && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900">نکته کلیدی:</strong> {currentCard.keyPoint}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/20"
              >
                {currentIndex + 1 < cards.length ? 'کارت بعدی' : 'مشاهده خلاصه'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
