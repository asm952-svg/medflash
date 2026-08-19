import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit,
  RotateCcw,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Award,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';

interface AllCardsViewProps {
  decks: Deck[];
  cards: Flashcard[];
  onEditCard: (card: Flashcard) => void;
  onDeleteCard: (cardId: string) => void;
  onResetCardProgress: (cardId: string) => void;
  onAddNewCard: () => void;
  onOpenFileAI?: () => void;
  onOpenImport?: () => void;
  onOpenPromptGen?: () => void;
  onClearAllCards?: () => void;
}

export const AllCardsView: React.FC<AllCardsViewProps> = ({
  decks,
  cards,
  onEditCard,
  onDeleteCard,
  onResetCardProgress,
  onAddNewCard,
  onOpenFileAI,
  onOpenImport,
  onOpenPromptGen,
  onClearAllCards,
}) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchDeck = selectedDeckId === 'all' || card.deckId === selectedDeckId;
      const matchState = selectedState === 'all' || card.state === selectedState;
      const isMCQ = card.cardType === 'mcq' || (card.options && card.options.length >= 2);
      const matchType =
        selectedType === 'all' ||
        (selectedType === 'mcq' && isMCQ) ||
        (selectedType === 'standard' && !isMCQ);
      const matchDifficulty =
        selectedDifficulty === 'all' ||
        (card.difficultyRating && card.difficultyRating === selectedDifficulty);

      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        card.front.toLowerCase().includes(term) ||
        card.back.toLowerCase().includes(term) ||
        (card.options && card.options.some((o) => o.toLowerCase().includes(term))) ||
        (card.keyPoint && card.keyPoint.toLowerCase().includes(term)) ||
        (card.tags && card.tags.some((t) => t.toLowerCase().includes(term))) ||
        (card.specialty && card.specialty.toLowerCase().includes(term));

      return matchDeck && matchState && matchType && matchDifficulty && matchSearch;
    });
  }, [cards, selectedDeckId, selectedState, selectedType, selectedDifficulty, searchTerm]);

  // Reset page when filters change
  const totalPages = Math.ceil(filteredCards.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCards = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, safeCurrentPage, pageSize]);

  const getDeckTitle = (deckId: string) => {
    const d = decks.find((deck) => deck.id === deckId);
    return d ? d.title : 'نامشخص';
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">بانک و مدیریت تمام فلش‌کارت‌ها</h2>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                {cards.length} کارت فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مجموع {filteredCards.length} کارت در نتایج فیلتر (نمایش صفحه {safeCurrentPage} از {totalPages})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenFileAI && (
              <button
                onClick={onOpenFileAI}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>تبدیل فایل با هوش مصنوعی</span>
              </button>
            )}

            {onOpenImport && (
              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>ورود JSON</span>
              </button>
            )}

            <button
              onClick={onAddNewCard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>کارت دستی</span>
            </button>

            {cards.length > 0 && onClearAllCards && (
              <button
                onClick={() => {
                  if (confirm('آیا از پاک کردن تمام فلش‌کارت‌ها مطمئن هستید؟')) {
                    onClearAllCards();
                  }
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="پاک کردن تمام فلش‌کارت‌ها"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>


        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو در سوالات بالینی، داروها، علایم..."
              className="w-full text-xs pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedDeckId}
              onChange={(e) => {
                setSelectedDeckId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">تمام دسته‌ها ({decks.length} دسته)</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">همه فرمت‌ها (MCQ + تشریحی)</option>
              <option value="mcq">فقط ۴ گزینه‌ای دستیاری (MCQ)</option>
              <option value="standard">فقط پرسش و پاسخ مفهومی</option>
            </select>
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-700 font-medium"
            >
              <option value="all">تمام وضعیت‌های یادگیری</option>
              <option value="new">کارت‌های جدید (New)</option>
              <option value="learning">درحال یادگیری (Learning)</option>
              <option value="review">درحال مرور دوره‌ای (Review)</option>
              <option value="mastered">تسلط کامل (Mastered)</option>
            </select>
          </div>
        </div>

        {/* Pagination & Page Size Control */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>تعداد در هر صفحه:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700"
            >
              <option value={15}>۱۵ کارت</option>
              <option value={25}>۲۵ کارت</option>
              <option value={50}>۵۰ کارت</option>
              <option value={100}>۱۰۰ کارت</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>صفحه قبل</span>
            </button>

            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg font-mono">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg font-bold transition cursor-pointer"
            >
              <span>صفحه بعد</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {filteredCards.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-white rounded-3xl border border-slate-200/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-sm font-bold text-slate-800">
                {cards.length === 0 ? 'بانک فلش‌کارت‌های شما در حال حاضر خالی است' : 'هیچ کارتی با فیلترهای انتخابی یافت نشد'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {cards.length === 0
                  ? 'می‌توانید با دکمه «افزودن کارت دستی» سوالات خود را بنویسید یا با «ورود کدهای هوش مصنوعی»، دسته‌ای از کارت‌ها را اضافه کنید.'
                  : 'عبارت جستجو یا فیلترهای بالا را تغییر دهید.'}
              </p>
            </div>
            {cards.length === 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={onAddNewCard}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن کارت دستی</span>
                </button>
                {onOpenImport && (
                  <button
                    onClick={onOpenImport}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>ورود کدهای هوش مصنوعی</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (

          paginatedCards.map((card, indexOnPage) => {
            const globalIndex = (safeCurrentPage - 1) * pageSize + indexOnPage + 1;
            const isMCQ = card.cardType === 'mcq' || (card.options && card.options.length >= 2);
            const correctIdx = typeof card.correctOptionIndex === 'number' ? card.correctOptionIndex : 0;

            return (
              <div
                key={card.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-sm transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-bold rounded-md font-mono">
                        #{globalIndex}
                      </span>

                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md">
                        {getDeckTitle(card.deckId)}
                      </span>

                      {isMCQ ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">
                          تست ۴ گزینه‌ای
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                          پرسش و پاسخ
                        </span>
                      )}

                      {card.state === 'new' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                          جدید (New)
                        </span>
                      )}
                      {card.state === 'learning' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                          درحال یادگیری ({card.interval} روز)
                        </span>
                      )}
                      {card.state === 'mastered' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          تسلط کامل ({card.interval} روز)
                        </span>
                      )}
                      {card.state === 'review' && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md">
                          مرور دوره‌ای ({card.interval} روز)
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 pt-0.5 leading-relaxed">
                      {card.front}
                    </h4>

                    {/* Options list if MCQ */}
                    {isMCQ && card.options && card.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5">
                        {card.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                              i === correctIdx
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span className="w-4 h-4 rounded bg-white border border-current text-[10px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="truncate">{opt}</span>
                            {i === correctIdx && (
                              <span className="mr-auto text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                                پاسخ صحیح
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onEditCard(card)}
                      className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="ویرایش کارت"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onResetCardProgress(card.id)}
                      className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      title="ریست کردن پیشرفت این کارت به حالت صفر"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteCard(card.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="حذف کارت"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {card.back}
                </div>

                {card.keyPoint && (
                  <div className="text-[11px] bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/80">
                    <strong>نکته کلیدی:</strong> {card.keyPoint}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>صفحه قبل</span>
          </button>

          <span className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs font-mono shadow-xs">
            صفحه {safeCurrentPage} از {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <span>صفحه بعد</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
