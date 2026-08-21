import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Edit2,
  Trash2,
  Copy,
  Check,
  Brain,
  Sliders,
  FileCode,
  FileQuestion,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { loadAISettings } from '../utils/storage';
import { generateFlashcardsFromSource, GeminiError } from '../utils/geminiClient';

interface AiFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  onImportSuccess: (newCards: Flashcard[], targetDeckId: string, newDeckTitle?: string) => void;
  onOpenPromptGen?: () => void;
  onOpenSettings?: () => void;
}

export const AiFileUploadModal: React.FC<AiFileUploadModalProps> = ({
  isOpen,
  onClose,
  decks,
  onImportSuccess,
  onOpenPromptGen,
  onOpenSettings,
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    base64: string;
    previewUrl?: string;
  } | null>(null);
  const [textContent, setTextContent] = useState('');

  // AI Configuration
  const [selectedDeckId, setSelectedDeckId] = useState<string>('new');
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [cardCount, setCardCount] = useState<number>(10);
  const [cardFormat, setCardFormat] = useState<'mcq' | 'standard' | 'mixed'>('mcq');
  const [language, setLanguage] = useState<'persian' | 'bilingual' | 'english'>('persian');
  const [specialty, setSpecialty] = useState('پزشکی بالینی عمومی');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customInstructions, setCustomInstructions] = useState('');

  // Generation & Review State
  const [step, setStep] = useState<'config' | 'generating' | 'preview'>('config');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('در حال پردازش فایل...');
  const [generatedCards, setGeneratedCards] = useState<Partial<Flashcard>[]>([]);
  const [suggestedDeckTitle, setSuggestedDeckTitle] = useState('');
  const [generationSummary, setGenerationSummary] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain');
    
    // Auto-fill deck title suggestion
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (!newDeckTitle) {
      setNewDeckTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedFile({
        name: file.name,
        size: file.size,
        mimeType: mimeType,
        base64: result,
        previewUrl: file.type.startsWith('image/') ? result : undefined,
      });
    };

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.readAsDataURL(file);
    } else {
      // Text / md / docx
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (inputMode === 'file' && !selectedFile) {
      setErrorMessage('لطفاً یک فایل (PDF، تصویر یا یادداشت) انتخاب کنید.');
      return;
    }
    if (inputMode === 'text' && !textContent.trim()) {
      setErrorMessage('لطفاً متن جزوه یا خلاصه مبحث را وارد کنید.');
      return;
    }

    setErrorMessage(null);
    setStep('generating');
    setGenerationProgress(15);
    setStatusMessage('در حال اتصال به هوش مصنوعی و خواندن فایل...');

    const progressTimer = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 40) {
          setStatusMessage('در حال تحلیل پاتوفیزیولوژی و استخراج سناریوهای بالینی...');
          return prev + 10;
        } else if (prev < 75) {
          setStatusMessage(
            cardFormat === 'mcq'
              ? 'در حال طراحی تست‌های ۴ گزینه‌ای و گزینه‌های گمراه‌کننده (Distractors)...'
              : 'در حال نگارش فلش‌کارت‌های فعال و نکات طلایی...'
          );
          return prev + 7;
        } else if (prev < 92) {
          setStatusMessage('در حال اعتبارسنجی پاسخ‌های تشریحی و کدینگ‌های یادسپاری...');
          return prev + 3;
        }
        return prev;
      });
    }, 1200);

    try {
      const { geminiApiKey, geminiModel } = loadAISettings();
      if (!geminiApiKey) {
        clearInterval(progressTimer);
        setNeedsApiKey(true);
        setErrorMessage('برای تولید با هوش مصنوعی، ابتدا کلید Gemini API خود را در تنظیمات وارد کنید.');
        setStep('config');
        return;
      }

      const result = await generateFlashcardsFromSource(
        {
          content: inputMode === 'text' ? textContent : undefined,
          file:
            inputMode === 'file' && selectedFile
              ? { base64: selectedFile.base64, mimeType: selectedFile.mimeType, name: selectedFile.name }
              : undefined,
          language,
          cardCount,
          cardFormat,
          specialty,
          difficulty,
          customInstructions,
        },
        geminiApiKey,
        geminiModel
      );

      clearInterval(progressTimer);
      setGenerationProgress(100);
      setStatusMessage('فلش‌کارت‌ها با موفقیت تولید شدند!');
      setGeneratedCards(result.cards);
      setSuggestedDeckTitle(result.suggestedDeckTitle || newDeckTitle || 'فلش‌کارت‌های هوش مصنوعی');
      setGenerationSummary(result.summary || '');
      setStep('preview');
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('AI Generation Failed:', err);
      if (err instanceof GeminiError && /کلید Gemini API/.test(err.message)) {
        setNeedsApiKey(true);
      }
      setErrorMessage(err.message || 'متأسفانه در تولید هوش مصنوعی خطایی رخ داد.');
      setStep('config');
    }
  };

  const handleCardDelete = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCardUpdate = (index: number, updatedFields: Partial<Flashcard>) => {
    setGeneratedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updatedFields } : c))
    );
  };

  const handleFinalSave = () => {
    if (generatedCards.length === 0) return;

    let finalDeckId = selectedDeckId;
    let customDeckName: string | undefined = undefined;

    if (selectedDeckId === 'new') {
      finalDeckId = `deck_${Date.now()}`;
      customDeckName = newDeckTitle.trim() || suggestedDeckTitle || 'فلش‌کارت‌های هوش مصنوعی';
    }

    const finalizedCards: Flashcard[] = generatedCards.map((c) => ({
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deckId: finalDeckId,
      cardType: c.cardType || (c.options && c.options.length >= 2 ? 'mcq' : 'standard'),
      front: c.front || '',
      back: c.back || '',
      keyPoint: c.keyPoint || '',
      mnemonic: c.mnemonic || '',
      specialty: c.specialty || specialty,
      tags: c.tags || [specialty],
      options: c.options || [],
      correctOptionIndex: typeof c.correctOptionIndex === 'number' ? c.correctOptionIndex : 0,
      correctAnswer:
        c.correctAnswer || (c.options && typeof c.correctOptionIndex === 'number' ? c.options[c.correctOptionIndex] : ''),
      clozeAnswer: c.clozeAnswer || '',
      difficultyRating: c.difficultyRating || difficulty,
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

  const handleCopyRawJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generatedCards, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-l from-emerald-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  تبدیل مستقیم فایل به فلش‌کارت با هوش مصنوعی
                </h2>
                <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded-full">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300">
                بارگذاری مستقیم PDF، تصاویر صفحات کتاب، جزوات یا یادداشت‌ها جهت استخراج خودکار تست و کارت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: CONFIGURATION & UPLOAD */}
          {step === 'config' && (
            <div className="space-y-5">
              {/* Input Mode Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl max-w-md">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    inputMode === 'file'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>بارگذاری فایل (PDF / تصویر / یادداشت)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>متن یا خلاصه مبحث</span>
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-bold leading-relaxed">{errorMessage}</p>
                    <div className="flex flex-wrap gap-2">
                      {needsApiKey && onOpenSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenSettings();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition shadow-xs cursor-pointer"
                        >
                          <span>باز کردن تنظیمات و وارد کردن کلید API</span>
                        </button>
                      )}
                      {onOpenPromptGen && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenPromptGen();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 font-bold rounded-xl text-[11px] transition shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>استفاده از سازنده پرامپت هوش مصنوعی (کپی رایگان برای ChatGPT / Claude)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 1: File Dropzone */}
              {inputMode === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {!selectedFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3.5 ${
                        isDragOver
                          ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
                          : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/30'
                      }`}
                    >
                      <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-800">
                          فایل خود را اینجا بکشید یا برای انتخاب کلیک کنید
                        </h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          پشتیبانی از کتاب‌ها و مقالات PDF، عکس صفحات کتاب/اسلایدها (PNG, JPG) و فایل‌های متنی
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-mono">
                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">PDF Books</span>
                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">Book Photos / ECG</span>
                        <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200">Word / TXT Notes</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {selectedFile.previewUrl ? (
                          <img
                            src={selectedFile.previewUrl}
                            alt="preview"
                            className="w-16 h-16 rounded-2xl object-cover border border-emerald-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <FileText className="w-7 h-7" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {selectedFile.name}
                            </h4>
                            <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded-md">
                              آماده پردازش
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.mimeType}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          تغییر فایل
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Direct Text Input */}
              {inputMode === 'text' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      متن جزوه، مقاله یا نکات بالینی را وارد کنید:
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{textContent.length} کاراکتر</span>
                  </div>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="متن فصل کتاب (مثل هاریسون، شوارتز، نلسون، ویلیامز) یا یادداشت‌های کلاسی خود را اینجا الصاق کنید..."
                    rows={7}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs text-slate-800 leading-relaxed transition outline-hidden"
                  />
                </div>
              )}

              {/* AI Parameters Settings */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 border-b border-slate-200/60 pb-3">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>تنظیمات و شخصی‌سازی استخراج کارت‌ها با هوش مصنوعی</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Destination Deck */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">محل ذخیره‌سازی فلش‌کارت‌ها</label>
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                    >
                      <option value="new">+ ایجاد دسته جدید اختصاصی (پیشنهاد هوش مصنوعی)</option>
                      {decks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* If new deck selected */}
                  {selectedDeckId === 'new' && (
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700">نام دسته جدید (اختیاری)</label>
                      <input
                        type="text"
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        placeholder="مثلاً: گوارش هاریسون / فارماکولوژی قلب"
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  )}

                  {/* Card Format */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">فرمت خروجی کارت‌ها</label>
                    <select
                      value={cardFormat}
                      onChange={(e) => setCardFormat(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                    >
                      <option value="mcq">تست‌های ۴ گزینه‌ای بالینی (MCQ - مناسب آزمون‌ها)</option>
                      <option value="standard">فلش‌کارت مفهومی و پرسش و پاسخ (Active Recall)</option>
                      <option value="mixed">ترکیبی (هم تست ۴ گزینه‌ای هم فلش‌کارت)</option>
                    </select>
                  </div>

                  {/* Card Count */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">تعداد کارت‌های استخراجی</label>
                    <select
                      value={cardCount}
                      onChange={(e) => setCardCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                    >
                      <option value={5}>۵ کارت (سریع و خلاصه)</option>
                      <option value={10}>۱۰ کارت (استاندارد)</option>
                      <option value={15}>۱۵ کارت (جامع)</option>
                      <option value={20}>۲۰ کارت (کامل‌ترین پوشش)</option>
                      <option value={30}>۳۰ کارت (بانک سوالات فشرده)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">زبان تولید محتوا</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                    >
                      <option value="persian">فارسی روان با اصطلاحات انگلیسی (استاندارد ایران)</option>
                      <option value="bilingual">دوزبانه فارسی و انگلیسی</option>
                      <option value="english">انگلیسی کامل (USMLE / Board Style)</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700">سطح دشواری تست‌ها</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                    >
                      <option value="easy">پایه و یادآوری سریع (Easy)</option>
                      <option value="medium">متوسط و بالینی استاندارد (Medium)</option>
                      <option value="hard">پیشرفته و سطح آزمون دستیاری (Hard)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <label className="block text-[11px] font-bold text-slate-700">
                    دستورات ویژه یا تمرکز خاص (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="مثلاً: تمرکز ویژه روی گایدلاین‌های درمانی خط اول، علایم اختصاصی و عوارض دارویی..."
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500">
                  با کلیک روی شروع پردازش، هوش مصنوعی محتوای سند شما را خوانده و کارت‌ها را تولید خواهد کرد.
                </p>

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تولید هوشمند فلش‌کارت‌ها</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GENERATING ANIMATION */}
          {step === 'generating' && (
            <div className="py-16 px-4 text-center space-y-6 max-w-lg mx-auto">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-emerald-400/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <Brain className="w-12 h-12 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-slate-800">
                  هوش مصنوعی در حال پردازش فایل و نگارش کارت‌هاست
                </h3>
                <p className="text-xs text-emerald-700 font-bold animate-pulse">{statusMessage}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Gemini AI Engine</span>
                  <span>{generationProgress}%</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed text-right space-y-1">
                <span className="font-bold text-slate-800 block">💡 نکته حین تولید:</span>
                <span>
                  هوش مصنوعی به طور خودکار گزینه‌های اشتباه منطقی (Distractors)، پاسخ تشریحی کامل، نکات طلایی و
                  کدینگ‌های یادسپاری را طبق استانداردهای امتحانی استخراج می‌کند.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & EDIT BEFORE SAVE */}
          {step === 'preview' && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <h4 className="text-sm font-bold text-emerald-950">
                      {generatedCards.length} فلش‌کارت با موفقیت تولید و استخراج شد
                    </h4>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    دسته پیشنهادی: <strong className="font-bold">{suggestedDeckTitle}</strong>
                    {generationSummary && ` • ${generationSummary}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={handleCopyRawJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
                  >
                    {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRaw ? 'کپی شد!' : 'کپی کد JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('config')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تولید مجدد</span>
                  </button>
                </div>
              </div>

              {/* Cards List Preview */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {generatedCards.map((card, idx) => {
                  const isMCQ = card.cardType === 'mcq' || (card.options && card.options.length >= 2);
                  return (
                    <div
                      key={idx}
                      className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 relative group hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isMCQ ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {isMCQ ? 'تست ۴ گزینه‌ای بالینی (MCQ)' : 'فلش‌کارت مفهومی'}
                          </span>
                          {card.specialty && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                              {card.specialty}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCardDelete(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="حذف این کارت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Question / Front */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          صورت سوال / پرسش:
                        </label>
                        <p className="text-xs font-bold text-slate-900 leading-relaxed whitespace-pre-wrap">
                          {card.front}
                        </p>
                      </div>

                      {/* MCQ Options if available */}
                      {isMCQ && card.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {card.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === card.correctOptionIndex;
                            const optionLabels = ['الف', 'ب', 'ج', 'د'];
                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                    : 'bg-slate-50/70 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {optionLabels[oIdx] || oIdx + 1}
                                </span>
                                <span className="leading-snug">{opt}</span>
                                {isCorrect && (
                                  <span className="mr-auto text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                                    پاسخ صحیح
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Rationale / Back */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900 text-[11px] block">پاسخ تشریحی و تحلیل:</span>
                        <p className="whitespace-pre-wrap">{card.back}</p>
                      </div>

                      {/* KeyPoint & Mnemonic */}
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                        {card.keyPoint && (
                          <div className="bg-amber-50 border border-amber-200/80 text-amber-900 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span className="font-bold">✨ نکته طلایی:</span>
                            <span>{card.keyPoint}</span>
                          </div>
                        )}
                        {card.mnemonic && (
                          <div className="bg-purple-50 border border-purple-200/80 text-purple-900 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <span className="font-bold">🧠 کدینگ / یادیار:</span>
                            <span>{card.mnemonic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('config')}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
                >
                  بازگشت و تغییر تنظیمات
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    انصراف
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>افزودن تمام {generatedCards.length} کارت به بانک مطالعه</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
