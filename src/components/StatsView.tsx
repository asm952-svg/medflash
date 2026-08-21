import React, { useState } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  BrainCircuit,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Deck, Flashcard, StudyStats } from '../types';
import { isCardDue } from '../utils/sm2';
import { loadAISettings } from '../utils/storage';
import { analyzeStudyPerformance, GeminiError } from '../utils/geminiClient';

interface StatsViewProps {
  stats: StudyStats;
  decks: Deck[];
  cards: Flashcard[];
  onResetAllData: () => void;
  onClearAllCards?: () => void;
  onOpenSettings?: () => void;
}

interface SpecialtyPerf {
  specialty: string;
  totalReviews: number;
  correctReviews: number;
  lapses: number;
  masteredCount: number;
  cardCount: number;
  accuracy: number;
}

function buildSpecialtyBreakdown(cards: Flashcard[]): SpecialtyPerf[] {
  const map = new Map<string, SpecialtyPerf>();
  for (const card of cards) {
    const key = card.specialty?.trim() || 'دسته‌بندی‌نشده';
    if (!map.has(key)) {
      map.set(key, {
        specialty: key,
        totalReviews: 0,
        correctReviews: 0,
        lapses: 0,
        masteredCount: 0,
        cardCount: 0,
        accuracy: 0,
      });
    }
    const entry = map.get(key)!;
    entry.cardCount += 1;
    entry.lapses += card.lapses || 0;
    if (card.state === 'mastered') entry.masteredCount += 1;
    const history = card.history || [];
    for (const log of history) {
      entry.totalReviews += 1;
      if (log.rating >= 2) entry.correctReviews += 1;
    }
  }
  for (const entry of map.values()) {
    entry.accuracy = entry.totalReviews > 0 ? Math.round((entry.correctReviews / entry.totalReviews) * 100) : 0;
  }
  return Array.from(map.values()).sort((a, b) => b.cardCount - a.cardCount);
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  decks,
  cards,
  onResetAllData,
  onClearAllCards,
  onOpenSettings,
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [analysisError, setAnalysisError] = useState('');
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const handleAnalyze = async () => {
    setAnalysisState('loading');
    setAnalysisError('');
    setNeedsApiKey(false);

    try {
      const { geminiApiKey, geminiModel } = loadAISettings();
      if (!geminiApiKey) {
        setNeedsApiKey(true);
        throw new GeminiError('برای تحلیل هوشمند آمار، ابتدا کلید Gemini API خود را در تنظیمات وارد کنید.');
      }

      const reviewedCards = cards.filter((c) => (c.history || []).length > 0);
      if (reviewedCards.length === 0) {
        throw new GeminiError('هنوز داده‌ای برای تحلیل وجود ندارد. ابتدا چند جلسه مطالعه انجام دهید.');
      }

      const breakdown = buildSpecialtyBreakdown(cards).filter((s) => s.totalReviews > 0);
      const weakCards = cards
        .filter((c) => c.lapses >= 2 || (c.history || []).filter((h) => h.rating === 1).length >= 2)
        .slice(0, 25)
        .map((c) => ({ front: c.front.slice(0, 120), specialty: c.specialty, lapses: c.lapses }));

      const promptText = `آمار کلی مطالعه کاربر:
- مجموع دفعات مرور: ${stats.totalReviews}
- نرخ کلی تثبیت حافظه (Retention): ${stats.retentionRate}٪
- توالی روزهای متوالی مطالعه: ${stats.streakDays}
- تعداد کل کارت‌ها: ${cards.length}

عملکرد به تفکیک تخصص/مبحث (specialty):
${breakdown
  .map(
    (s) =>
      `- ${s.specialty}: ${s.cardCount} کارت، ${s.totalReviews} بار مرور، دقت ${s.accuracy}٪، ${s.masteredCount} کارت تسلط‌یافته، ${s.lapses} بار فراموشی`
  )
  .join('\n')}

نمونه‌ای از کارت‌هایی که کاربر بیشترین فراموشی/اشتباه را در آن‌ها داشته:
${weakCards.map((c) => `- [${c.specialty || 'نامشخص'}] ${c.front}`).join('\n') || 'موردی ثبت نشده'}

لطفاً بر اساس این داده‌ها:
۱. مشخص کن کاربر در کدام مبحث/تخصص ضعیف‌تر است و چرا (بر اساس دقت پایین یا فراموشی بالا)
۲. مشخص کن در کدام مبحث قوی‌ترین عملکرد را دارد
۳. ۳ تا ۵ توصیه عملی و مشخص برای بهبود مطالعه بده (مثلاً افزایش تکرار در فلان مبحث، تمرکز بیشتر روی فلان نوع سوال)
۴. یک جمع‌بندی کوتاه انگیزشی در پایان بنویس.`;

      const result = await analyzeStudyPerformance(promptText, geminiApiKey, geminiModel);
      setAnalysis(result);
      setAnalysisState('idle');
    } catch (err: any) {
      if (err instanceof GeminiError && /کلید Gemini API/.test(err.message)) {
        setNeedsApiKey(true);
      }
      setAnalysisError(err.message || 'خطا در تحلیل هوش مصنوعی آمار مطالعه.');
      setAnalysisState('error');
    }
  };

  const newCount = cards.filter((c) => c.state === 'new').length;
  const learningCount = cards.filter((c) => c.state === 'learning').length;
  const reviewCount = cards.filter((c) => c.state === 'review').length;
  const masteredCount = cards.filter((c) => c.state === 'mastered').length;
  const dueCount = cards.filter(isCardDue).length;

  const totalCards = cards.length || 1;
  const masteredPercent = Math.round((masteredCount / totalCards) * 100);
  const learningPercent = Math.round((learningCount / totalCards) * 100);
  const reviewPercent = Math.round((reviewCount / totalCards) * 100);
  const newPercent = Math.round((newCount / totalCards) * 100);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">توالی مطالعه (Streak)</span>
            <span className="text-2xl font-black text-slate-800">{stats.streakDays} روز متوالی</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">نرخ تثبیت حافظه (Retention)</span>
            <span className="text-2xl font-black text-emerald-700">{stats.retentionRate}٪</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">مجموع دفعات مرور</span>
            <span className="text-2xl font-black text-slate-800">{stats.totalReviews} بار</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">کارت‌های آماده مرور امروز</span>
            <span className="text-2xl font-black text-rose-700">{dueCount} کارت</span>
          </div>
        </div>
      </div>

      {/* AI Performance Analysis */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">تحلیل هوشمند عملکرد با هوش مصنوعی</h3>
              <p className="text-xs text-slate-500">شناسایی نقاط ضعف و قوت شما بر اساس آمار مرور کارت‌ها</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analysisState === 'loading'}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-60 shrink-0"
          >
            {analysisState === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : analysis ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{analysis ? 'تحلیل مجدد' : 'شروع تحلیل'}</span>
          </button>
        </div>

        {analysisState === 'error' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-bold leading-relaxed">{analysisError}</p>
              {needsApiKey && onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 font-bold rounded-xl text-[11px] transition shadow-xs cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>باز کردن تنظیمات</span>
                </button>
              )}
            </div>
          </div>
        )}

        {analysis && analysisState !== 'error' && (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-800 leading-loose whitespace-pre-wrap">
            {analysis}
          </div>
        )}

        {!analysis && analysisState === 'idle' && (
          <p className="text-[11px] text-slate-400">
            هوش مصنوعی با استفاده از کلید Gemini شخصی شما، آمار مرور کارت‌ها را تحلیل کرده و بهترین و ضعیف‌ترین
            مباحث شما را همراه با توصیه‌های عملی مشخص می‌کند.
          </p>
        )}
      </div>

      {/* SM-2 Retention Distribution */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            توزیع وضعیت کارت‌ها در الگوریتم فاصله تکرار SM-2
          </h3>
          <p className="text-xs text-slate-500">
            منحنی انتقال مفاهیم از حافظه کوتاه‌مدت به حافظه بلندمدت نورونی
          </p>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${masteredPercent}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`تسلط کامل: ${masteredCount}`}
            />
            <div
              style={{ width: `${reviewPercent}%` }}
              className="bg-purple-500 h-full transition-all"
              title={`مرور دوره‌ای: ${reviewCount}`}
            />
            <div
              style={{ width: `${learningPercent}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`درحال یادگیری: ${learningCount}`}
            />
            <div
              style={{ width: `${newPercent}%` }}
              className="bg-blue-400 h-full transition-all"
              title={`جدید: ${newCount}`}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>تسلط کامل (Mastered)</span>
              </div>
              <span className="text-lg font-black text-emerald-900 block mt-1">
                {masteredCount} ({masteredPercent}٪)
              </span>
              <span className="text-[11px] text-emerald-700">فاصله بیش از ۲۱ روز</span>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>مرور دوره‌ای (Review)</span>
              </div>
              <span className="text-lg font-black text-purple-900 block mt-1">
                {reviewCount} ({reviewPercent}٪)
              </span>
              <span className="text-[11px] text-purple-700">فاصله ۶ تا ۲۰ روز</span>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>درحال یادگیری (Learning)</span>
              </div>
              <span className="text-lg font-black text-amber-900 block mt-1">
                {learningCount} ({learningPercent}٪)
              </span>
              <span className="text-[11px] text-amber-700">فاصله ۱ تا ۳ روز</span>
            </div>

            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span>کارت‌های جدید (New)</span>
              </div>
              <span className="text-lg font-black text-blue-900 block mt-1">
                {newCount} ({newPercent}٪)
              </span>
              <span className="text-[11px] text-blue-700">هنوز شروع نشده</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset & Clear section */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-800 block">مدیریت و پاک‌سازی داده‌ها</span>
          <span className="text-[11px] text-slate-500">
            امکان حذف تمام کارت‌های ثبت‌شده یا ریست آمار مطالعه
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cards.length > 0 && onClearAllCards && (
            <button
              onClick={() => {
                if (confirm('آیا مطمئن هستید که می‌خواهید تمام فلش‌کارت‌ها را حذف کنید؟')) {
                  onClearAllCards();
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>پاک کردن تمام کارت‌ها</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('آیا از بازنشانی کامل آمار و داده‌ها مطمئن هستید؟')) {
                onResetAllData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ریست کامل</span>
          </button>
        </div>
      </div>
    </div>
  );
};

