import React, { useState } from 'react';
import {
  Copy,
  Check,
  Sparkles,
  BookOpen,
  FileText,
  HelpCircle,
  Zap,
  Sliders,
  Send,
  Loader2,
  AlertCircle,
  FileCode,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';
import { AIPromptConfig } from '../types';
import {
  generateMasterAIPrompt,
  generateResidencyBatchPartPrompt,
  QUICK_TEMPLATES,
  SAMPLE_JSON_DEMO,
} from '../utils/aiPromptTemplate';
import { loadAISettings } from '../utils/storage';
import { generateFlashcardsFromSource, GeminiError } from '../utils/geminiClient';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectImport?: (rawJson: string) => void;
  onOpenSettings?: () => void;
}

export const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onDirectImport,
  onOpenSettings,
}) => {

  const [activeTab, setActiveTab] = useState<'prompt' | 'batch500' | 'direct' | 'sample'>('prompt');
  const [copied, setCopied] = useState(false);
  const [copiedBatchPart, setCopiedBatchPart] = useState<number | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);

  // Prompt configuration state
  const [config, setConfig] = useState<AIPromptConfig>({
    language: 'persian',
    cardCount: 50,
    style: 'clinical-vignette',
    cardFormat: 'mcq',
    specialty: 'آزمون دستیاری تخصصی پزشکی ایران (Iran Residency Exam)',
    includeMnemonics: true,
    includeMultipleChoice: true,
    targetBook: 'هاریسون، شوارتز، نلسون، ویلیامز، کتزونگ',
    chapterTopic: 'سرفصل‌های رفرنس آزمون دستیاری',
  });

  // Selected batch part for 500 questions pack
  const [selectedBatchPart, setSelectedBatchPart] = useState(1);

  // Direct In-App Generation State (via backend Gemini API)
  const [directContent, setDirectContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  if (!isOpen) return null;

  const generatedPrompt = generateMasterAIPrompt(config);

  const BATCH_PARTS = [
    {
      part: 1,
      name: 'پارت ۱: ماژور داخلی (هاریسون و سیسیل)',
      desc: '۱۰۰ تست بالینی ۴ گزینه‌ای: گوارش، غدد، ریه، روماتولوژی، نفرولوژی و هماتولوژی',
      book: 'اصول طب داخلی هاریسون',
    },
    {
      part: 2,
      name: 'پارت ۲: ماژور جراحی عمومی (شوارتز و لارنس)',
      desc: '۱۰۰ تست بالینی ۴ گزینه‌ای: تروما (ATLS)، شکم حاد، پستان، تیروئید و مجاری صفراوی',
      book: 'اصول جراحی شوارتز',
    },
    {
      part: 3,
      name: 'پارت ۳: ماژور کودکان و نوزادان (نلسون)',
      desc: '۱۰۰ تست بالینی ۴ گزینه‌ای: نوزادان، رشد و تکامل، واکسیناسیون کشوری و اورژانس اطفال',
      book: 'مبانی طب کودکان نلسون',
    },
    {
      part: 4,
      name: 'پارت ۴: ماژور زنان و زایمان (ویلیامز و دنفورث)',
      desc: '۱۰۰ تست بالینی ۴ گزینه‌ای: مامایی پرخطر، پره‌اکلامپسی، دکولمان، EP و بیماری‌های زنان',
      book: 'مامایی ویلیامز و زنان دنفورث',
    },
    {
      part: 5,
      name: 'پارت ۵: فارماکولوژی، عفونی، قلب و مینورها',
      desc: '۱۰۰ تست بالینی ۴ گزینه‌ای: کتزونگ (پادزهرها)، مندل (عفونی)، برانوالد (ECG) و مینورها',
      book: 'کتزونگ، مندل، برانوالد و تینتینالی',
    },
  ];

  const currentBatchPrompt = generateResidencyBatchPartPrompt(
    selectedBatchPart,
    5,
    BATCH_PARTS[selectedBatchPart - 1].name,
    100
  );

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCopyBatchPart = async (partNum: number) => {
    try {
      const promptText = generateResidencyBatchPartPrompt(
        partNum,
        5,
        BATCH_PARTS[partNum - 1].name,
        100
      );
      await navigator.clipboard.writeText(promptText);
      setCopiedBatchPart(partNum);
      setTimeout(() => setCopiedBatchPart(null), 2500);
    } catch (err) {
      console.error('Failed to copy batch prompt', err);
    }
  };

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_JSON_DEMO);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleApplyTemplate = (templateConfig: AIPromptConfig) => {
    setConfig((prev) => ({
      ...prev,
      ...templateConfig,
    }));
  };

  const handleDirectGenerate = async () => {
    if (!directContent.trim()) {
      setGenError('لطفاً بخشی از متن کتاب، جزوه یا خلاصه مبحث را در کادر زیر وارد کنید.');
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setNeedsApiKey(false);

    try {
      const { geminiApiKey, geminiModel } = loadAISettings();
      if (!geminiApiKey) {
        setNeedsApiKey(true);
        throw new GeminiError('برای تولید مستقیم، ابتدا کلید Gemini API خود را در تنظیمات وارد کنید.');
      }

      const result = await generateFlashcardsFromSource(
        {
          content: directContent,
          language: config.language,
          cardCount: Math.min(config.cardCount, 50),
          cardFormat: (config.cardFormat as any) || 'mcq',
          specialty: config.specialty,
          difficulty: 'medium',
        },
        geminiApiKey,
        geminiModel
      );

      if (result.cards && onDirectImport) {
        onDirectImport(JSON.stringify(result.cards, null, 2));
        onClose();
      }
    } catch (err: any) {
      if (err instanceof GeminiError && /کلید Gemini API/.test(err.message)) {
        setNeedsApiKey(true);
      }
      setGenError(err.message || 'خطا در ارتباط با Gemini. می‌توانید از پرامپت کپی شده در ChatGPT یا Claude استفاده کنید.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">تولید پرامپت و پکیج‌های آزمون دستیاری ایران</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                  ظرفیت ۵۰۰+ تست
                </span>
              </div>
              <p className="text-xs text-slate-500">
                طراحی شده برای تبدیل کتب رفرنس به تست‌های ۴ گزینه‌ای آزمون پذیرش دستیار تخصصی پزشکی ایران
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white/80 transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 gap-2 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'prompt'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>سازنده پرامپت سفارشی (Prompt Builder)</span>
          </button>

          <button
            onClick={() => setActiveTab('batch500')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'batch500'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>پکیج ۵۰۰ تستی آزمون دستیاری (۵ پارت)</span>
          </button>

          <button
            onClick={() => setActiveTab('direct')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'direct'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>تولید مستقیم در برنامه (In-App)</span>
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'sample'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>نمونه کد JSON</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Custom Prompt Builder */}
          {activeTab === 'prompt' && (
            <div className="space-y-6">
              {/* How it Works Banner */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 flex gap-3 leading-relaxed">
                <BookOpen className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 block mb-1">
                    راهنمای تولید ۵۰۰+ کارت با کتب رفرنس آزمون دستیاری:
                  </span>
                  ۱. مشخصات رفرنس (هاریسون، شوارتز، نلسون، ویلیامز و...) و تعداد درخواستی را مشخص کنید. <br />
                  ۲. پرامپت تولیدشده را کپی کرده و به همراه فایل PDF در ChatGPT (GPT-4o)، Claude یا DeepSeek قرار دهید. <br />
                  ۳. هوش مصنوعی پاسخ را در قالب کد JSON استاندارد ۴ گزینه‌ای ارسال می‌کند. <br />
                  ۴. کد دریافتی را در بخش <strong>«ورود کارت‌ها»</strong> پیست کنید تا بلافاصله دسته‌بندی و وارد برنامه شود.
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  سرفصل‌های آماده آزمون دستیاری تخصصی ایران:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleApplyTemplate(tpl.config)}
                      className="p-3 text-right rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition bg-white shadow-xs group cursor-pointer"
                    >
                      <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 block mb-1">
                        {tpl.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight">
                        {tpl.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Config Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">فرمت سوالات:</label>
                  <select
                    value={config.cardFormat || 'mcq'}
                    onChange={(e) => setConfig({ ...config, cardFormat: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
                  >
                    <option value="mcq">تست ۴ گزینه‌ای استاندارد آزمون دستیاری (MCQ)</option>
                    <option value="standard">پرسش و پاسخ مفهومی (Active Recall)</option>
                    <option value="mixed">ترکیبی (تستی + مفهومی)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">تعداد کارت‌های درخواستی:</label>
                  <select
                    value={config.cardCount}
                    onChange={(e) => setConfig({ ...config, cardCount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
                  >
                    <option value={15}>۱۵ کارت (مرور سریع مبحث)</option>
                    <option value={30}>۳۰ کارت (یک فصل کامل)</option>
                    <option value={50}>۵۰ کارت (یک سیستم ماژور)</option>
                    <option value={100}>۱۰۰ کارت (پکیج جامع یک مبحث)</option>
                    <option value={200}>۲۰۰ کارت (یک ماژور کامل دستیاری)</option>
                    <option value={500}>۵۰۰ کارت (بانک آزمون سراسری دستیاری)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">زبان سوالات و اصطلاحات:</label>
                  <select
                    value={config.language}
                    onChange={(e) => setConfig({ ...config, language: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="persian">فارسی روان (همراه اصطلاحات انگلیسی لاتین)</option>
                    <option value="bilingual">دوزبانه (فارسی + انگلیسی بالینی)</option>
                    <option value="english">انگلیسی تخصصی پزشکی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">سبک سوالات:</label>
                  <select
                    value={config.style}
                    onChange={(e) => setConfig({ ...config, style: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="clinical-vignette">سناریو و کیس بالینی آزمون دستیاری (Clinical Vignette)</option>
                    <option value="high-yield">نکات طلایی و خط اول درمان (High-Yield Pearls)</option>
                    <option value="drug-mechanism">داروشناسی و پادزهرها (کتزونگ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">رشته / ماژور دستیاری:</label>
                  <input
                    type="text"
                    value={config.specialty}
                    onChange={(e) => setConfig({ ...config, specialty: e.target.value })}
                    placeholder="مثال: داخلی گوارش، جراحی تروما، کودکان نلسون"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">کتاب رفرنس آزمون:</label>
                  <input
                    type="text"
                    value={config.targetBook}
                    onChange={(e) => setConfig({ ...config, targetBook: e.target.value })}
                    placeholder="مثال: هاریسون ۲۰۲۲، شوارتز، ویلیامز"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Master Prompt Output Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    پرامپت نهایی تولید شده (آماده کپی و ارسال به ChatGPT / Claude / DeepSeek):
                  </label>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>کپی شد! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>کپی کردن پرامپت (Copy Prompt)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={generatedPrompt}
                    rows={8}
                    className="w-full font-mono text-xs text-slate-100 bg-slate-900 p-4 rounded-xl border border-slate-700 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Batch 500 Questions Generator (5 parts x 100) */}
          {activeTab === 'batch500' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-l from-emerald-800 to-teal-900 text-white p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-300" />
                  <h3 className="font-bold text-sm sm:text-base">
                    استراتژی تولید ۵۰۰ تست آزمون پذیرش دستیاری با هوش مصنوعی
                  </h3>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">
                  از آنجا که ارسال ۵۰۰ سوال در یک درخواست ممکن است به محدودیت توکن خروجی هوش مصنوعی (Output Limit) برسد، پرامپت ۵۰۰ سوالی را به ۵ پارت استاندارد ۱۰۰تایی تقسیم کرده‌ایم تا هر بار با ۱ کلیک پرامپت هر پارت را به AI بدهید و بدون هیچ قطعی کل ۵۰۰ سوال را دریافت کنید:
                </p>
              </div>

              {/* 5 Parts Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  انتخاب پارت جهت کپی پرامپت ۱۰۰ سوالی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {BATCH_PARTS.map((bp) => (
                    <button
                      key={bp.part}
                      onClick={() => setSelectedBatchPart(bp.part)}
                      className={`p-3 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                        selectedBatchPart === bp.part
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                          پارت #{bp.part}
                        </span>
                        <h4 className="text-xs font-bold line-clamp-1">{bp.name.split(':')[1] || bp.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-mono">۱۰۰ تست</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Selected Part Details & Copy */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {BATCH_PARTS[selectedBatchPart - 1].name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {BATCH_PARTS[selectedBatchPart - 1].desc} (منبع: {BATCH_PARTS[selectedBatchPart - 1].book})
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyBatchPart(selectedBatchPart)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {copiedBatchPart === selectedBatchPart ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>پرامپت پارت {selectedBatchPart} کپی شد! ✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>کپی پرامپت پارت {selectedBatchPart} (۱۰۰ تست)</span>
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  readOnly
                  value={currentBatchPrompt}
                  rows={6}
                  className="w-full font-mono text-xs text-slate-100 bg-slate-900 p-3 rounded-lg border border-slate-700 focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Direct In-App Generation */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex gap-3">
                <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-950 block mb-1">تولید سریع با هوش مصنوعی داخلی:</span>
                  می‌توانید بخشی از متن کتاب یا جزوه خود را اینجا پیست کنید تا سیستم فوراً آن را به تست‌های چهارگزینه‌ای بالینی آزمون دستیاری تبدیل کند.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  متن خلاصه فصل، جزوه یا پاراگراف‌های رفرنس پزشکی:
                </label>
                <textarea
                  rows={8}
                  value={directContent}
                  onChange={(e) => setDirectContent(e.target.value)}
                  placeholder="متن کتاب یا یادداشت پزشکی خود را اینجا پیست کنید (مثلاً مبحث درمان شوک در ATLS یا اقدامات اکلامپسی در ویلیامز)..."
                  className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed bg-white"
                />
              </div>

              {genError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <span className="block">{genError}</span>
                    {needsApiKey && onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSettings();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer"
                      >
                        <span>باز کردن تنظیمات و وارد کردن کلید API</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDirectGenerate}
                  disabled={isGenerating || !directContent.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال تحلیل و ساخت تست‌های دستیاری...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>تولید و درون‌ریزی مستقیم به فلش‌کارت‌ها</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: JSON Sample */}
          {activeTab === 'sample' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  نمونه ساختار استاندارد JSON خروجی آزمون دستیاری:
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopySample}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSample ? 'کپی شد!' : 'کپی نمونه'}</span>
                  </button>
                  {onDirectImport && (
                    <button
                      onClick={() => {
                        onDirectImport(SAMPLE_JSON_DEMO);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>درون‌ریزی آزمایشی این نمونه</span>
                    </button>
                  )}
                </div>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed" dir="ltr">
                {SAMPLE_JSON_DEMO}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>منطبق بر سرفصل‌های آزمون پذیرش دستیار تخصصی وزارت بهداشت ایران</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
