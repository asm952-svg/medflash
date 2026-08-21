import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Award,
  Lightbulb,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Deck, Flashcard } from '../types';

interface QuizSessionProps {
  deck: Deck;
  cards: Flashcard[];
  allDeckCards: Flashcard[];
  onExit: () => void;
  onCardAnswered?: (card: Flashcard, isCorrect: boolean) => void;
  onExplainMore?: (card: Flashcard) => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({
  deck,
  cards,
  allDeckCards,
  onExit,
  onCardAnswered,
  onExplainMore,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  // Generate 4 options for multiple choice
  const options = useMemo(() => {
    if (!currentCard) return [];
    if (currentCard.options && currentCard.options.length >= 2) {
      return [...currentCard.options].sort(() => 0.5 - Math.random());
    }

    // Fallback: extract back text as correct option and other cards back as distractors
    const correct = currentCard.back.split('\n')[0].slice(0, 120);
    const distractors = allDeckCards
      .filter((c) => c.id !== currentCard.id)
      .map((c) => c.back.split('\n')[0].slice(0, 120))
      .slice(0, 3);

    const generated = [correct, ...distractors];
    return generated.sort(() => 0.5 - Math.random());
  }, [currentCard, allDeckCards]);

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    // Check if correct
    const isCorrect =
      option === currentCard.back.split('\n')[0].slice(0, 120) ||
      (currentCard.options && option === currentCard.options[0]);

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (onCardAnswered) {
      onCardAnswered(currentCard, isCorrect);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      try {
        confetti({ particleCount: 80, spread: 60 });
      } catch (e) {}
    }
  };

  if (!currentCard || isFinished) {
    const accuracy = cards.length > 0 ? Math.round((score / cards.length) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center space-y-6" dir="rtl">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/10">
          <Award className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">آزمون چهارگزینه‌ای به پایان رسید! 🎯</h2>
          <p className="text-xs text-slate-500">دسته: {deck.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-[11px] text-blue-700 font-medium block">امتیاز کسب شده</span>
            <span className="text-2xl font-black text-blue-900">
              {score} از {cards.length}
            </span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] text-emerald-700 font-medium block">درصد پاسخگویی</span>
            <span className="text-2xl font-black text-emerald-900">{accuracy}٪</span>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onExit}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
          >
            بازگشت به منو
          </button>
        </div>
      </div>
    );
  }

  const correctOptionText =
    currentCard.options && currentCard.options[0]
      ? currentCard.options[0]
      : currentCard.back.split('\n')[0].slice(0, 120);

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-slate-800">حالت کوئیز و تست بالینی</span>
            <span className="text-[11px] text-slate-400 block">
              سوال {currentIndex + 1} از {cards.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
          <span>امتیاز: {score}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
            سناریو / سوال بالینی
          </span>
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
            {currentCard.front}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === correctOptionText;

            let btnClass = 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs';
              } else if (isSelected && !isCorrect) {
                btnClass = 'bg-rose-50 border-rose-400 text-rose-950';
              } else {
                btnClass = 'bg-slate-50/50 border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(option)}
                className={`w-full text-right p-4 rounded-2xl border-2 transition flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${btnClass}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-600 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{option}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Explanation Revealed */}
        {isAnswered && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-emerald-900 block">تشریح و پاسخ کامل:</span>
              <p className="text-slate-800 leading-relaxed whitespace-pre-line">{currentCard.back}</p>
            </div>

            {currentCard.keyPoint && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-950 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900">نکته کلیدی:</strong> {currentCard.keyPoint}
                </div>
              </div>
            )}

            {onExplainMore && (
              <button
                type="button"
                onClick={() => onExplainMore(currentCard)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>توضیح بیشتر و منابع با هوش مصنوعی</span>
              </button>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20"
              >
                {currentIndex + 1 < cards.length ? 'سوال بعدی' : 'مشاهده نتیجه آزمون'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
