import React, { useState, useEffect } from 'react';
import { X, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { AISettings, loadAISettings, saveAISettings } from '../utils/storage';
import { testGeminiConnection } from '../utils/geminiClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: AISettings) => void;
}

const MODEL_OPTIONS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (پیشنهادی، سریع)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (دقیق‌تر، کندتر)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (سبک و سریع‌تر)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const s = loadAISettings();
      setApiKey(s.geminiApiKey);
      setModel(s.geminiModel || 'gemini-2.5-flash');
      setTestState('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const settings: AISettings = { geminiApiKey: apiKey.trim(), geminiModel: model };
    saveAISettings(settings);
    onSaved?.(settings);
    onClose();
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestState('error');
      setTestMessage('ابتدا کلید API را وارد کنید.');
      return;
    }
    setTestState('testing');
    setTestMessage('');
    try {
      await testGeminiConnection(apiKey.trim(), model);
      setTestState('success');
      setTestMessage('اتصال با موفقیت برقرار شد!');
    } catch (e: any) {
      setTestState('error');
      setTestMessage(e.message || 'اتصال ناموفق بود.');
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    saveAISettings({ geminiApiKey: '', geminiModel: model });
    setTestState('idle');
    setTestMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-gradient-to-l from-emerald-900 via-teal-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 flex items-center justify-center shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">تنظیمات هوش مصنوعی</h2>
              <p className="text-[11px] sm:text-xs text-slate-300">اتصال کلید Gemini API شخصی شما</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed space-y-2">
            <p>
              این اپلیکیشن هیچ سروری در پس‌زمینه ندارد. کلید Gemini API شما فقط{' '}
              <strong>روی همین گوشی و در حافظه محلی مرورگر ذخیره می‌شود</strong> و درخواست‌ها مستقیماً از دستگاه شما به
              سرورهای Google ارسال می‌شوند.
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline"
            >
              <span>دریافت رایگان کلید API از Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* API Key input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">کلید Gemini API</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestState('idle');
                }}
                placeholder="AIzaSy..."
                dir="ltr"
                className="w-full px-3.5 py-2.5 pl-10 bg-white rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">مدل هوش مصنوعی</label>
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setTestState('idle');
              }}
              className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={testState === 'testing'}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-60"
            >
              {testState === 'testing' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
              <span>تست اتصال</span>
            </button>
            {testState === 'success' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> {testMessage}
              </span>
            )}
            {testState === 'error' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4" /> {testMessage}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClearKey}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف کلید</span>
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
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
