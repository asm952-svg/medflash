import React from 'react';
import {
  Sparkles,
  Layers,
  BarChart3,
  BookOpen,
  Plus,
  Flame,
  Upload,
  Brain,
  Stethoscope,
} from 'lucide-react';
import { StudyStats } from '../types';

interface NavbarProps {
  activeTab: 'decks' | 'all-cards' | 'stats';
  setActiveTab: (tab: 'decks' | 'all-cards' | 'stats') => void;
  stats: StudyStats;
  onOpenFileAI: () => void;
  onOpenPromptGen: () => void;
  onOpenImport: () => void;
  onOpenNewCard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onOpenFileAI,
  onOpenPromptGen,
  onOpenImport,
  onOpenNewCard,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-800">
                MedFlash
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                SM-2 Medical
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block leading-none">
              فلش‌کارت و یادگیری هوشمند پزشکی
            </span>
          </div>
        </div>

        {/* Center Nav Items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('decks')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'decks'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>دسته‌ها و مباحث</span>
          </button>

          <button
            onClick={() => setActiveTab('all-cards')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all-cards'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>بانک تمام کارت‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'stats'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>آمار تثبیت حافظه</span>
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl text-xs font-black shadow-xs">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>{stats.streakDays} روز</span>
          </div>

          {/* AI File Upload Direct CTA */}
          <button
            onClick={onOpenFileAI}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-emerald-600/25 cursor-pointer"
            title="بارگذاری مستقیم فایل (PDF / تصویر / یادداشت) و استخراج کارت با هوش مصنوعی"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>تولید کارت با هوش مصنوعی</span>
          </button>

          {/* Prompt Gen */}
          <button
            onClick={onOpenPromptGen}
            className="hidden lg:flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            title="سازنده پرامپت هوش مصنوعی برای ChatGPT / Claude"
          >
            <span>سازنده پرامپت</span>
          </button>

          {/* Import CTA */}
          <button
            onClick={onOpenImport}
            className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="ورود کدهای هوش مصنوعی"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">ورود کد JSON</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden border-t border-slate-200/60 px-4 py-2 bg-slate-50 justify-around text-xs">
        <button
          onClick={() => setActiveTab('decks')}
          className={`flex items-center gap-1 py-1 font-bold ${
            activeTab === 'decks' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دسته‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab('all-cards')}
          className={`flex items-center gap-1 py-1 font-bold ${
            activeTab === 'all-cards' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>کارت‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-1 py-1 font-bold ${
            activeTab === 'stats' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>آمار</span>
        </button>
      </div>
    </header>
  );
};
