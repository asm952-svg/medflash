import React from 'react';
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
} from 'lucide-react';
import { Deck, Flashcard, StudyStats } from '../types';
import { isCardDue } from '../utils/sm2';

interface StatsViewProps {
  stats: StudyStats;
  decks: Deck[];
  cards: Flashcard[];
  onResetAllData: () => void;
  onClearAllCards?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  decks,
  cards,
  onResetAllData,
  onClearAllCards,
}) => {

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

