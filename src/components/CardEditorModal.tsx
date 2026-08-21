import React, { useState, useEffect } from 'react';
import { Plus, Check, Edit, Layers, Tag, Lightbulb, BrainCircuit, ShieldAlert } from 'lucide-react';
import { Deck, Flashcard } from '../types';
import { findDuplicate, DuplicateMatch } from '../utils/duplicateDetection';

interface CardEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  existingCards: Flashcard[];
  editingCard?: Flashcard | null;
  defaultDeckId?: string;
  onSaveCard: (card: Partial<Flashcard>) => void;
}

export const CardEditorModal: React.FC<CardEditorModalProps> = ({
  isOpen,
  onClose,
  decks,
  existingCards,
  editingCard,
  defaultDeckId,
  onSaveCard,
}) => {
  const [deckId, setDeckId] = useState<string>(defaultDeckId || decks[0]?.id || '');
  const [cardType, setCardType] = useState<'standard' | 'mcq'>('standard');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [keyPoint, setKeyPoint] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [tagsString, setTagsString] = useState('');
  const [clozeAnswer, setClozeAnswer] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateMatch | null>(null);
  const [confirmedDespiteDuplicate, setConfirmedDespiteDuplicate] = useState(false);

  useEffect(() => {
    if (editingCard) {
      setDeckId(editingCard.deckId);
      setCardType(editingCard.cardType || (editingCard.options && editingCard.options.length >= 2 ? 'mcq' : 'standard'));
      setFront(editingCard.front);
      setBack(editingCard.back);
      const opts = editingCard.options && editingCard.options.length >= 4
        ? [...editingCard.options]
        : editingCard.options && editingCard.options.length > 0
        ? [...editingCard.options, ...Array(4 - editingCard.options.length).fill('')]
        : ['', '', '', ''];
      setOptions(opts);
      setCorrectOptionIndex(typeof editingCard.correctOptionIndex === 'number' ? editingCard.correctOptionIndex : 0);
      setKeyPoint(editingCard.keyPoint || '');
      setMnemonic(editingCard.mnemonic || '');
      setSpecialty(editingCard.specialty || '');
      setTagsString((editingCard.tags || []).join(', '));
      setClozeAnswer(editingCard.clozeAnswer || '');
    } else {
      setDeckId(defaultDeckId || decks[0]?.id || '');
      setCardType('mcq');
      setFront('');
      setBack('');
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      setKeyPoint('');
      setMnemonic('');
      setSpecialty('');
      setTagsString('');
      setClozeAnswer('');
    }
    setDuplicateWarning(null);
    setConfirmedDespiteDuplicate(false);
  }, [editingCard, defaultDeckId, decks, isOpen]);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deckId) return;

    // Duplicate check only applies to brand-new cards (not edits to an existing one),
    // and only against other cards already saved in the same deck.
    if (!editingCard && !confirmedDespiteDuplicate) {
      const pool = existingCards.filter((c) => c.deckId === deckId);
      const match = findDuplicate({ front: front.trim(), back: back.trim() }, pool);
      if (match) {
        setDuplicateWarning(match);
        return;
      }
    }
    setDuplicateWarning(null);

    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanOptions = cardType === 'mcq' ? options.map((o) => o.trim()).filter(Boolean) : undefined;
    const resolvedCorrectIndex = cardType === 'mcq' ? correctOptionIndex : undefined;
    const resolvedCorrectAnswer = cardType === 'mcq' && cleanOptions && cleanOptions[correctOptionIndex]
      ? cleanOptions[correctOptionIndex]
      : undefined;

    onSaveCard({
      id: editingCard?.id,
      deckId,
      cardType,
      front: front.trim(),
      back: back.trim(),
      options: cleanOptions,
      correctOptionIndex: resolvedCorrectIndex,
      correctAnswer: resolvedCorrectAnswer,
      keyPoint: keyPoint.trim(),
      mnemonic: mnemonic.trim(),
      specialty: specialty.trim() || 'پزشکی',
      tags,
      clozeAnswer: clozeAnswer.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              {editingCard ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {editingCard ? 'ویرایش فلش‌کارت' : 'افزودن فلش‌کارت دستی'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Deck Selection and Card Type Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">دسته فلش‌کارت:</label>
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع کارت:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCardType('mcq')}
                  className={`p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    cardType === 'mcq'
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>۴ گزینه‌ای (MCQ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('standard')}
                  className={`p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    cardType === 'standard'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>پرسش و پاسخ ساده</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              روی کارت (Front - {cardType === 'mcq' ? 'صورت سوال ۴ گزینه‌ای یا سناریوی بالینی' : 'سوال بالینی یا اصطلاح'}):
            </label>
            <textarea
              rows={3}
              required
              value={front}
              onChange={(e) => {
                setFront(e.target.value);
                setDuplicateWarning(null);
                setConfirmedDespiteDuplicate(false);
              }}
              placeholder={
                cardType === 'mcq'
                  ? 'مثال: بیمار با تنگی نفس ناگهانی و تاکی‌کاردی پس از جراحی استخوان ران مراجعه کرده است. محتمل‌ترین تشخیص کدام است؟'
                  : 'مثال: شایع‌ترین تظاهر بالینی آمبولی حاد ریه چیست؟'
              }
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* 4 Options if MCQ Card */}
          {cardType === 'mcq' && (
            <div className="space-y-2.5 p-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-purple-950">
                  ۴ گزینه تستی (روی دکمه شماره گزینه صحیح کلیک کنید):
                </label>
                <span className="text-[10px] text-purple-700 font-medium">
                  گزینه صحیح: گزینه {correctOptionIndex + 1}
                </span>
              </div>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIndex(i)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition cursor-pointer ${
                        correctOptionIndex === i
                          ? 'bg-emerald-600 border-emerald-700 text-white shadow-2xs ring-2 ring-emerald-300'
                          : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={correctOptionIndex === i ? 'گزینه صحیح فعلی' : 'تنظیم به عنوان گزینه صحیح'}
                    >
                      {i + 1}
                    </button>
                    <input
                      type="text"
                      required={i < 2}
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      placeholder={`گزینه ${i + 1} ${i === correctOptionIndex ? '(پاسخ صحیح)' : ''}`}
                      className={`flex-1 p-2 bg-white border rounded-xl focus:outline-none text-xs ${
                        correctOptionIndex === i
                          ? 'border-emerald-400 bg-emerald-50/30 font-medium'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              پشت کارت (Back - {cardType === 'mcq' ? 'تحلیل تشریحی گزینه صحیح و دلایل رد سایر گزینه‌ها' : 'پاسخ، مکانیسم فیزیوپاتولوژی، درمان'}):
            </label>
            <textarea
              rows={3}
              required
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="مثال: پاسخ صحیح گزینه ۱ است. آمبولی ریه به دنبال DVT در جراحی‌های ارتوپدی بسیار شایع است..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                نکته کلیدی طلایی (اختیاری):
              </label>
              <input
                type="text"
                value={keyPoint}
                onChange={(e) => setKeyPoint(e.target.value)}
                placeholder="خلاصه تک‌جمله‌ای برای مرور سریع"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5 text-purple-500" />
                یادیار و رمز حافظه (Mnemonic):
              </label>
              <input
                type="text"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="کد رمزی یا تصویرسازی ذهنی"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">تخصص / مبحث:</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="مثال: ریه و مراقبت‌های ویژه"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">برچسب‌ها (با کاما جدا کنید):</label>
              <input
                type="text"
                value={tagsString}
                onChange={(e) => setTagsString(e.target.value)}
                placeholder="آمبولی, ریه, اورژانس"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {duplicateWarning && (
            <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1">
                <p>
                  این کارت شبیه به یک کارت موجود در همین دسته است (
                  {Math.round(duplicateWarning.score * 100)}٪ مشابهت):
                </p>
                <p className="italic text-amber-800">
                  «{(duplicateWarning.matchedCard.front || '').slice(0, 100)}
                  {(duplicateWarning.matchedCard.front || '').length > 100 ? '…' : ''}»
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmedDespiteDuplicate(true)}
                  className="mt-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  متوجه شدم، دوباره روی «افزودن به کارت‌ها» بزنید
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {editingCard ? 'ذخیره تغییرات' : 'افزودن به کارت‌ها'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
