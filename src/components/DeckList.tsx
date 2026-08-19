import React, { useState } from 'react';
import {
  Pill,
  HeartPulse,
  Stethoscope,
  Brain,
  Layers,
  Sparkles,
  Play,
  HelpCircle,
  Keyboard,
  Plus,
  Trash2,
  Share2,
  Clock,
  CheckCircle2,
  BookOpen,
  Filter,
  Award,
  Flame,
  Check,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { isCardDue } from '../utils/sm2';

interface DeckListProps {
  decks: Deck[];
  cards: Flashcard[];
  onStartStudy: (deck: Deck) => void;
  onStartQuiz: (deck: Deck) => void;
  onStartActiveRecall: (deck: Deck) => void;
  onOpenFileAI: () => void;
  onOpenPromptGen: () => void;
  onOpenImport: (deckId?: string) => void;
  onOpenCardEditor: (deckId?: string) => void;
  onDeleteDeck: (deckId: string) => void;
  onCreateDeck: (title: string, category: string) => void;
}

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  cards,
  onStartStudy,
  onStartQuiz,
  onStartActiveRecall,
  onOpenFileAI,
  onOpenPromptGen,
  onOpenImport,
  onOpenCardEditor,
  onDeleteDeck,
  onCreateDeck,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('عمومی');

  const categories = ['all', ...Array.from(new Set(decks.map((d) => d.category)))];

  const filteredDecks =
    selectedCategory === 'all'
      ? decks
      : decks.filter((d) => d.category === selectedCategory);

  const getDeckIcon = (iconName: string) => {
    switch (iconName) {
      case 'Pill':
        return <Pill className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5" />;
      case 'Brain':
        return <Brain className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateDeck(newTitle.trim(), newCategory);
    setNewTitle('');
    setShowCreateModal(false);
  };

  // Quick stats
  const totalMCQs = cards.filter((c) => c.cardType === 'mcq' || (c.options && c.options.length >= 2)).length;
  const totalDue = cards.filter(isCardDue).length;
  const totalMastered = cards.filter((c) => c.state === 'mastered').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-l from-emerald-800 via-teal-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-xs font-semibold text-emerald-300">
            <Brain className="w-3.5 h-3.5 text-emerald-300" />
            <span>سیستم یادگیری هوشمند با الگوریتم تکرار فاصله‌دار SM-2</span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            بانک فلش‌کارت‌ها و تست‌های شخصی شما
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            فلش‌کارت‌ها و تست‌های خود را بسازید یا جزوات و یادداشت‌هایتان را با پرامپت هوش مصنوعی تبدیل به کارت‌های آزمونی کنید و با الگوریتم فاصله تکرار SM-2 با حداکثر ماندگاری ذهنی مرور نمایید.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={onOpenFileAI}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              <span>بارگذاری فایل و تولید تست با هوش مصنوعی (PDF / عکس)</span>
            </button>

            <button
              onClick={() => onOpenCardEditor()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن فلش‌کارت دستی</span>
            </button>

            <button
              onClick={onOpenPromptGen}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>سازنده پرامپت AI</span>
            </button>

            <button
              onClick={() => onOpenImport()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>ورود کارت‌ها (JSON)</span>
            </button>
          </div>
        </div>

        {/* Quick summary numbers */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">کل فلش‌کارت‌های شما</span>
            <span className="text-base font-bold text-white font-mono">{cards.length} کارت</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">تست‌های چهارگزینه‌ای</span>
            <span className="text-base font-bold text-purple-300 font-mono">{totalMCQs} تست</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">آماده مرور امروز (Due)</span>
            <span className="text-base font-bold text-amber-300 font-mono">{totalDue} کارت</span>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">تسلط کامل (Mastered)</span>
            <span className="text-base font-bold text-emerald-300 font-mono">{totalMastered} کارت</span>
          </div>
        </div>
      </div>

      {/* Empty State Banner if no cards exist */}
      {cards.length === 0 && (
        <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">
              فضای شما کاملاً پاک و آماده اضافه کردن کارت‌های شخصی است
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              تمام کارت‌های پیش‌فرض و تولیدشده حذف شدند. اکنون می‌توانید فلش‌کارت‌ها و سوالات دلخواه خود را به‌صورت دستی یا با کمک هوش مصنوعی اضافه کنید.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenFileAI}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>بارگذاری فایل (PDF / جزوه) و تبدیل با هوش مصنوعی</span>
            </button>
            <button
              onClick={() => onOpenCardEditor()}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن فلش‌کارت دستی</span>
            </button>
            <button
              onClick={onOpenPromptGen}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>سازنده پرامپت</span>
            </button>
          </div>
        </div>
      )}


      {/* Category filter bar & Add Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'همه موضوعات دستیاری' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCardEditor()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>کارت تکی</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>دسته جدید</span>
          </button>
        </div>
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDecks.map((deck) => {
          const deckCards = cards.filter((c) => c.deckId === deck.id);
          const dueCards = deckCards.filter(isCardDue);
          const mcqCards = deckCards.filter((c) => c.cardType === 'mcq' || (c.options && c.options.length >= 2));
          const masteredCards = deckCards.filter((c) => c.state === 'mastered');
          const masteryPercent =
            deckCards.length > 0
              ? Math.round((masteredCards.length / deckCards.length) * 100)
              : 0;

          return (
            <div
              key={deck.id}
              className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/60 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group space-y-4"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                      {getDeckIcon(deck.icon)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                        {deck.title}
                      </h3>
                      {deck.englishTitle && (
                        <span className="text-[11px] text-slate-400 block font-mono" dir="ltr">
                          {deck.englishTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {deck.category}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {deck.description}
                </p>

                {/* Badges & Counters */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {deckCards.length} کارت کل
                  </span>

                  {mcqCards.length > 0 && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      {mcqCards.length} تست ۴ گزینه‌ای
                    </span>
                  )}

                  {dueCards.length > 0 ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dueCards.length} کارت نیازمند مرور
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      به‌روز
                    </span>
                  )}
                </div>
              </div>

              {/* Mastery Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>میزان تسلط پایدار:</span>
                  <span className="font-bold text-slate-700">{masteryPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${masteryPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartStudy(deck)}
                    disabled={deckCards.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>مرور فاصله‌دار (SM-2)</span>
                  </button>

                  <button
                    onClick={() => onStartQuiz(deck)}
                    disabled={deckCards.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>آزمون تستی</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenImport(deck.id)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="افزودن کارت‌های هوش مصنوعی به این دسته"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteDeck(deck.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="حذف این دسته"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating New Deck */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800">ایجاد دسته جدید فلش‌کارت آزمون دستیاری</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  عنوان دسته / سرفصل:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: جراحی عمومی شوارتز فصل شکم حاد"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ماژور / دسته‌بندی:
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="مثال: داخلی، جراحی، اطفال، زنان، فارماکولوژی"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  ایجاد دسته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
