import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  Eye,
  Check,
  Award,
  Sparkles,
  FileUp,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { parseCardsFromText, ParseResult } from '../utils/cardParser';

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  initialJson?: string;
  onImportSuccess: (newCards: Flashcard[], targetDeckId: string, newDeckTitle?: string) => void;
}

export const ImportCardsModal: React.FC<ImportCardsModalProps> = ({
  isOpen,
  onClose,
  decks,
  initialJson = '',
  onImportSuccess,
}) => {
  const [inputText, setInputText] = useState(initialJson);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'new');
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckCategory, setNewDeckCategory] = useState('عمومی');

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [previewCards, setPreviewCards] = useState<Partial<Flashcard>[]>([]);
  const [activeStep, setActiveStep] = useState<'input' | 'preview'>('input');
  const [previewPage, setPreviewPage] = useState(1);
  const cardsPerPage = 20;

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialJson) {
      setInputText(initialJson);
      handleParse(initialJson);
    }
  }, [initialJson]);

  useEffect(() => {
    if (decks.length > 0 && selectedDeckId === 'new' && !newDeckTitle) {
      setSelectedDeckId(decks[0].id);
    }
  }, [decks]);

  if (!isOpen) return null;

  const handleParse = (textToParse: string) => {
    const result = parseCardsFromText(textToParse, selectedDeckId);
    setParseResult(result);
    if (result.success) {
      setPreviewCards(result.cards);
      setPreviewPage(1);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    if (text.trim().length > 10) {
      handleParse(text);
    } else {
      setParseResult(null);
      setPreviewCards([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        handleParse(content);
      }
    };
    reader.readAsText(file);
  };

  const handleRemovePreviewCard = (index: number) => {
    const updated = [...previewCards];
    updated.splice(index, 1);
    setPreviewCards(updated);
  };

  const handleFinalImport = () => {
    if (previewCards.length === 0) return;

    let finalDeckId = selectedDeckId;
    let customDeckName: string | undefined = undefined;

    if (selectedDeckId === 'new') {
      finalDeckId = `deck_${Date.now()}`;
      customDeckName = newDeckTitle.trim() || 'دسته فلش‌کارت جدید';
    }

    const finalizedCards: Flashcard[] = previewCards.map((c) => ({
      id: c.id || `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deckId: finalDeckId,
      cardType: c.cardType || (c.options && c.options.length >= 2 ? 'mcq' : 'standard'),
      front: c.front || '',
      back: c.back || '',
      keyPoint: c.keyPoint || '',
      mnemonic: c.mnemonic || '',
      specialty: c.specialty || 'پزشکی',
      tags: c.tags || ['کارت‌های من'],
      options: c.options || [],
      correctOptionIndex: typeof c.correctOptionIndex === 'number' ? c.correctOptionIndex : 0,
      correctAnswer: c.correctAnswer || (c.options ? c.options[0] : ''),
      clozeAnswer: c.clozeAnswer || '',
      difficultyRating: c.difficultyRating || 'medium',
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: new Date().toISOString(),
      state: 'new',
      lapses: 0,
    }));

    onImportSuccess(finalizedCards, finalDeckId, customDeckName);
    onClose();
  };

  const totalPreviewPages = Math.ceil(previewCards.length / cardsPerPage);
  const displayedPreviewCards = previewCards.slice(
    (previewPage - 1) * cardsPerPage,
    previewPage * cardsPerPage
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">ورود دسته‌ای فلش‌کارت‌ها و تست‌ها</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  پشتیبانی از حجم نامحدود
                </span>
              </div>
              <p className="text-xs text-slate-500">
                کد JSON تولید شده توسط هوش مصنوعی یا فایل‌های متنی/جدولی خود را وارد کنید.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Deck Destination Selector */}
          <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />

              محل ذخیره‌سازی کارت‌ها (انتخاب دسته یا ایجاد دسته جدید):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={selectedDeckId}
                  onChange={(e) => setSelectedDeckId(e.target.value)}
                  className="w-full bg-white border border-blue-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category})
                    </option>
                  ))}
                  <option value="new">+ ایجاد دسته جدید برای این کارت‌ها...</option>
                </select>
              </div>

              {selectedDeckId === 'new' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="نام دسته جدید (مثال: ۵۰۰ تست دستیاری ماژور داخلی)"
                    className="w-full bg-white border border-blue-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveStep('input')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeStep === 'input'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileCode className="w-4 h-4" />
                <span>۱. پیست کردن متن / آپلود فایل</span>
              </button>

              <button
                onClick={() => setActiveStep('preview')}
                disabled={previewCards.length === 0}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeStep === 'preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>۲. پیش‌نمایش ({previewCards.length} کارت شناسایی شده)</span>
              </button>
            </div>

            {/* File Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5 text-blue-600" />
                <span>آپلود فایل JSON / متن</span>
              </button>
            </div>
          </div>

          {activeStep === 'input' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  خروجی JSON دریافتی از هوش مصنوعی را در کادر زیر پیست کنید:
                </label>
                {parseResult && (
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 ${
                      parseResult.success
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {parseResult.success ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{parseResult.cards.length} فلش‌کارت آماده درون‌ریزی</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>خطا در فرمت</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <textarea
                value={inputText}
                onChange={handleTextChange}
                rows={10}
                placeholder="[
  {
    &quot;cardType&quot;: &quot;mcq&quot;,
    &quot;front&quot;: &quot;صورت سوال بالینی آزمون دستیاری...&quot;,
    &quot;options&quot;: [&quot;گزینه ۱&quot;, &quot;گزینه ۲&quot;, &quot;گزینه ۳&quot;, &quot;گزینه ۴&quot;],
    &quot;correctOptionIndex&quot;: 0,
    &quot;back&quot;: &quot;پاسخ تشریحی و رفرنس...&quot;,
    &quot;keyPoint&quot;: &quot;نکته طلایی...&quot;
  }
]"
                className="w-full text-xs font-mono p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed bg-slate-950 text-emerald-400 placeholder:text-slate-600"
                dir="ltr"
              />

              {parseResult && !parseResult.success && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  <span className="font-bold block">خطاهای شناسایی شده:</span>
                  {parseResult.errors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeStep === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  پیش‌نمایش کارت‌های آماده اضافه شدن (مجموع {previewCards.length} کارت - صفحه {previewPage} از {totalPreviewPages || 1}):
                </span>

                {totalPreviewPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                      disabled={previewPage === 1}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-mono">{previewPage} / {totalPreviewPages}</span>
                    <button
                      onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                      disabled={previewPage === totalPreviewPages}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {displayedPreviewCards.map((card, idx) => {
                  const globalIdx = (previewPage - 1) * cardsPerPage + idx;
                  const isMCQ = card.cardType === 'mcq' || (card.options && card.options.length >= 2);

                  return (
                    <div
                      key={globalIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-400 transition space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                              کارت #{globalIdx + 1}
                            </span>
                            {isMCQ && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">
                                تست ۴ گزینه‌ای
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-800 pt-1">{card.front}</p>
                        </div>

                        <button
                          onClick={() => handleRemovePreviewCard(globalIdx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                          title="حذف این کارت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Options Preview if MCQ */}
                      {isMCQ && card.options && card.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          {card.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                                oIdx === (card.correctOptionIndex || 0)
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded bg-slate-100 border text-[9px] flex items-center justify-center shrink-0">
                                {oIdx + 1}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] font-bold text-emerald-700 block mb-0.5">
                          پاسخ و تشریح رفرنس:
                        </span>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {card.back}
                        </p>
                      </div>

                      {card.keyPoint && (
                        <div className="text-[11px] bg-amber-50 text-amber-900 px-2.5 py-1.5 rounded-lg border border-amber-200/80">
                          <strong className="text-amber-950">نکته کلیدی:</strong> {card.keyPoint}
                        </div>
                      )}

                      {card.mnemonic && (
                        <div className="text-[11px] bg-purple-50 text-purple-900 px-2.5 py-1 rounded-lg border border-purple-200/80">
                          <strong>یادیار/رمز:</strong> {card.mnemonic}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            انصراف
          </button>

          <div className="flex items-center gap-3">
            {activeStep === 'input' && previewCards.length > 0 && (
              <button
                onClick={() => setActiveStep('preview')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                مشاهده پیش‌نمایش ({previewCards.length} کارت)
              </button>
            )}

            <button
              onClick={handleFinalImport}
              disabled={previewCards.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>وارد کردن {previewCards.length} فلش‌کارت به برنامه</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
