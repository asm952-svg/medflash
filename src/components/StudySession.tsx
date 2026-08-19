import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Volume2,
  Lightbulb,
  Bookmark,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  BrainCircuit,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Flashcard, ReviewRating, Deck } from '../types';
import { calculateSM2, getIntervalPreview } from '../utils/sm2';

interface StudySessionProps {
  deck: Deck;
  cards: Flashcard[];
  onFinishSession: (updatedCards: Flashcard[]) => void;
  onExit: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({
  deck,
  cards,
  onFinishSession,
  onExit,
}) => {
  // Active queue of cards to study in this session
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [reviewedCardsMap, setReviewedCardsMap] = useState<Map<string, Flashcard>>(new Map());
  const [sessionStats, setSessionStats] = useState({
    againCount: 0,
    hardCount: 0,
    goodCount: 0,
    easyCount: 0,
    totalReviewed: 0,
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  useEffect(() => {
    if (cards.length > 0) {
      setQueue([...cards]);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSelectedOptionIndex(null);
      setIsCompleted(false);
      setReviewedCardsMap(new Map());
      setSessionStats({ againCount: 0, hardCount: 0, goodCount: 0, easyCount: 0, totalReviewed: 0 });
    }
  }, [cards]);

  const currentCard = queue[currentIndex];
  const isMCQ = currentCard?.cardType === 'mcq' || (currentCard?.options && currentCard.options.length >= 2);
  const correctIdx = typeof currentCard?.correctOptionIndex === 'number' ? currentCard.correctOptionIndex : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleOptionSelect = (index: number) => {
    if (isFlipped) return;
    setSelectedOptionIndex(index);
    setIsFlipped(true);
  };

  const handleSpeech = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        // Detect Persian vs English
        const isPersian = /[\u0600-\u06FF]/.test(text);
        utterance.lang = isPersian ? 'fa-IR' : 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis unavailable', e);
    }
  };

  const handleRating = useCallback(
    (rating: ReviewRating) => {
      if (!currentCard) return;

      const sm2Result = calculateSM2(currentCard, rating);
      const updatedCard: Flashcard = {
        ...currentCard,
        ...sm2Result,
        lastReviewedDate: new Date().toISOString(),
      };

      // Record in reviewed cards map
      const updatedMap = new Map(reviewedCardsMap);
      updatedMap.set(updatedCard.id, updatedCard);
      setReviewedCardsMap(updatedMap);

      // Update session statistics
      setSessionStats((prev) => ({
        ...prev,
        totalReviewed: prev.totalReviewed + 1,
        againCount: rating === 1 ? prev.againCount + 1 : prev.againCount,
        hardCount: rating === 2 ? prev.hardCount + 1 : prev.hardCount,
        goodCount: rating === 3 ? prev.goodCount + 1 : prev.goodCount,
        easyCount: rating === 4 ? prev.easyCount + 1 : prev.easyCount,
      }));

      // If answered wrong (Rating 1: Again), push to the end of the queue in current session
      if (rating === 1) {
        setQueue((prev) => [...prev, updatedCard]);
      }

      // Move to next card or complete
      if (currentIndex + 1 < queue.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setSelectedOptionIndex(null);
        setShowMnemonic(false);
      } else {
        // All cards completed
        setIsCompleted(true);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    },
    [currentCard, currentIndex, queue.length, reviewedCardsMap]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (!isFlipped && isMCQ && currentCard?.options) {
        if (e.key === '1' && currentCard.options[0]) handleOptionSelect(0);
        if (e.key === '2' && currentCard.options[1]) handleOptionSelect(1);
        if (e.key === '3' && currentCard.options[2]) handleOptionSelect(2);
        if (e.key === '4' && currentCard.options[3]) handleOptionSelect(3);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
        if (e.key === '4') handleRating(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRating, isFlipped, isCompleted, isMCQ, currentCard]);

  const handleFinish = () => {
    const allFinalCards = Array.from(reviewedCardsMap.values());
    onFinishSession(allFinalCards);
  };

  if (!currentCard && !isCompleted) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200" dir="rtl">
        <p className="text-sm">هیچ کارتی برای مرور یافت نشد.</p>
        <button
          onClick={onExit}
          className="mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg"
        >
          بازگشت به دسته‌ها
        </button>
      </div>
    );
  }

  if (isCompleted) {
    const accuracy =
      sessionStats.totalReviewed > 0
        ? Math.round(
            ((sessionStats.goodCount + sessionStats.easyCount) / sessionStats.totalReviewed) * 100
          )
        : 100;

    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6" dir="rtl">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Award className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">جلسه مرور به پایان رسید! 🎉</h2>
          <p className="text-xs text-slate-500">
            تمام کارت‌های دسته «{deck.title}» طبق الگوریتم فاصله تکرار SM-2 زمان‌بندی شدند.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
            <span className="text-[11px] text-emerald-700 font-medium block">دقت یادآوری</span>
            <span className="text-xl font-black text-emerald-900">{accuracy}٪</span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <span className="text-[11px] text-blue-700 font-medium block">کارت‌های مرور شده</span>
            <span className="text-xl font-black text-blue-900">{sessionStats.totalReviewed}</span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <span className="text-[11px] text-amber-700 font-medium block">سخت / دوباره</span>
            <span className="text-xl font-black text-amber-900">
              {sessionStats.againCount + sessionStats.hardCount}
            </span>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <span className="text-[11px] text-indigo-700 font-medium block">خوب / آسان</span>
            <span className="text-xl font-black text-indigo-900">
              {sessionStats.goodCount + sessionStats.easyCount}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed">
          💡 <strong className="text-slate-800">منطق تکرار فاصله‌دار:</strong> کارت‌هایی که پاسخ درست دادید در فاصله‌های زمانی طولانی‌تر (۳ تا ۲۰ روز دیگر) ظاهر می‌شوند و کارت‌هایی که با دشواری پاسخ دادید زودتر (فردا یا همین هفته) برای مرور مجدد به صف اضافه خواهند شد.
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={handleFinish}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            ذخیره پیشرفت و بازگشت
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-5" dir="rtl">
      {/* Session Top Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="خروج از جلسه"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{deck.title}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                {currentCard.specialty || deck.category}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              کارت {currentIndex + 1} از {queue.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-32 sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-700">{progressPercent}٪</span>
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div
        onClick={handleFlip}
        className="cursor-pointer min-h-[380px] sm:min-h-[420px] bg-white rounded-3xl border-2 border-slate-200/80 hover:border-emerald-500/50 shadow-lg hover:shadow-xl transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between relative group select-none"
      >
        {/* Card Header Info */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isFlipped
                  ? 'bg-emerald-100 text-emerald-800'
                  : isMCQ
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isFlipped
                ? 'پاسخ و تحلیل (Back)'
                : isMCQ
                ? 'تست ۴ گزینه‌ای (MCQ)'
                : 'سوال بالینی (Front)'}
            </span>

            {currentCard.state === 'learning' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-medium">
                درحال یادگیری
              </span>
            )}
            {currentCard.state === 'mastered' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                تسلط یافته
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSpeech(isFlipped ? currentCard.back : currentCard.front);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
              title="تلفظ صوتی"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              {isMCQ && !isFlipped ? 'انتخاب گزینه یا Space' : 'کلیک یا Space برای چرخش'}
            </span>
          </div>
        </div>

        {/* Card Main Body */}
        <div className="my-auto py-4 space-y-4">
          {!isFlipped ? (
            /* FRONT OF CARD */
            <div className="space-y-5 text-right">
              <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                {currentCard.front}
              </p>

              {/* 4 Options if MCQ Card */}
              {isMCQ && currentCard.options && currentCard.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    یکی از ۴ گزینه زیر را انتخاب کنید:
                  </span>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentCard.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptionSelect(idx);
                        }}
                        className="w-full text-right p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 bg-slate-50/70 transition flex items-start gap-3 text-xs sm:text-sm leading-relaxed group/opt cursor-pointer shadow-2xs"
                      >
                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 group-hover/opt:border-emerald-500 group-hover/opt:bg-emerald-600 group-hover/opt:text-white text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs mt-0.5 transition">
                          {idx + 1}
                        </span>
                        <span className="flex-1 text-slate-800 font-medium">{option}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentCard.tags && currentCard.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {currentCard.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* BACK OF CARD */
            <div className="space-y-4 text-right">
              {/* If was answered via MCQ options */}
              {isMCQ && selectedOptionIndex !== null && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                    selectedOptionIndex === correctIdx
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {selectedOptionIndex === correctIdx ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>پاسخ شما کاملاً صحیح بود! 🎯 (گزینه {correctIdx + 1})</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        پاسخ نادرست ❌ — گزینه صحیح: گزینه {correctIdx + 1} ({currentCard.options?.[correctIdx] || currentCard.correctAnswer || ''})
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Options Breakdown on Back */}
              {isMCQ && currentCard.options && currentCard.options.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-1 gap-1.5">
                    {currentCard.options.map((option, idx) => {
                      const isCorrect = idx === correctIdx;
                      const isSelected = selectedOptionIndex === idx;

                      let cls = 'bg-slate-50 border-slate-200 text-slate-500 opacity-70';
                      if (isCorrect) {
                        cls = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold opacity-100 ring-1 ring-emerald-400';
                      } else if (isSelected && !isCorrect) {
                        cls = 'bg-rose-50 border-rose-400 text-rose-950 font-semibold opacity-100';
                      }

                      return (
                        <div
                          key={idx}
                          className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs ${cls}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white/80 border border-current text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{option}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                              پاسخ صحیح ✓
                            </span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-md font-bold">
                              انتخاب شما ✗
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-emerald-800 block">
                  {isMCQ ? 'تحلیل تشریحی و فیزیوپاتولوژی:' : 'پاسخ و مکانیسم:'}
                </span>
                <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed whitespace-pre-line bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {currentCard.back}
                </p>
              </div>

              {currentCard.keyPoint && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 block mb-0.5">نکته کلیدی طلایی (High-Yield Pearl):</strong>
                    <span>{currentCard.keyPoint}</span>
                  </div>
                </div>
              )}

              {currentCard.mnemonic && (
                <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-3 text-xs text-purple-950 flex items-start gap-2.5">
                  <BrainCircuit className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-900 block mb-0.5">یادیار و رمز حافظه (Mnemonic):</strong>
                    <span>{currentCard.mnemonic}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Bottom Hint */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>دفعات تکرار موفق: {currentCard.repetitions} بار</span>
          {!isFlipped ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1 group-hover:translate-x-[-2px] transition">
              <Eye className="w-4 h-4" />
              برای دیدن پاسخ کلیک کنید
            </span>
          ) : (
            <span className="text-slate-500 font-medium">
              سطح یادآوری خود را از کلیدهای زیر انتخاب کنید:
            </span>
          )}
        </div>
      </div>

      {/* Response Action Controls (SM-2 Interval Rating) */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Again (Rating 1) */}
          <button
            onClick={() => handleRating(1)}
            className="flex flex-col items-center justify-center p-3.5 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-400 text-rose-800 rounded-2xl transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-xs font-black">
              <span>۱. دوباره (فراموش شد)</span>
            </div>
            <span className="text-[11px] text-rose-600 font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
              {getIntervalPreview(currentCard, 1, 'fa')}
            </span>
          </button>

          {/* Hard (Rating 2) */}
          <button
            onClick={() => handleRating(2)}
            className="flex flex-col items-center justify-center p-3.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-400 text-amber-900 rounded-2xl transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-xs font-black">
              <span>۲. سخت (با تلاش)</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
              {getIntervalPreview(currentCard, 2, 'fa')}
            </span>
          </button>

          {/* Good (Rating 3) */}
          <button
            onClick={() => handleRating(3)}
            className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-900 rounded-2xl transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-xs font-black">
              <span>۳. خوب (یادم آمد)</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
              {getIntervalPreview(currentCard, 3, 'fa')}
            </span>
          </button>

          {/* Easy (Rating 4) */}
          <button
            onClick={() => handleRating(4)}
            className="flex flex-col items-center justify-center p-3.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 text-blue-900 rounded-2xl transition shadow-sm cursor-pointer group"
          >
            <div className="flex items-center gap-1 text-xs font-black">
              <span>۴. آسان (مسلط)</span>
            </div>
            <span className="text-[11px] text-blue-700 font-bold mt-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
              {getIntervalPreview(currentCard, 4, 'fa')}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <button
            onClick={handleFlip}
            className="w-full sm:w-auto px-12 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>مشاهده پاسخ (Space)</span>
          </button>
        </div>
      )}
    </div>
  );
};
