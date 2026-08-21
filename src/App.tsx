import React, { useState, useEffect } from 'react';
import { Deck, Flashcard, StudyStats } from './types';
import {
  loadDecks,
  saveDecks,
  loadCards,
  saveCards,
  loadStats,
  saveStats,
  recordCardReviewInStats,
  clearAllCards,
  resetAllToDefaults,
  loadSessionPointer,
  saveSessionPointer,
  clearSessionPointer,
  SessionPointer,
} from './utils/storage';
import { sortCardsForStudy, isCardDue } from './utils/sm2';
import { Navbar } from './components/Navbar';
import { DeckList } from './components/DeckList';
import { StudySession } from './components/StudySession';
import { QuizSession } from './components/QuizSession';
import { ActiveRecallSession } from './components/ActiveRecallSession';
import { AllCardsView } from './components/AllCardsView';
import { StatsView } from './components/StatsView';
import { PromptGeneratorModal } from './components/PromptGeneratorModal';
import { ImportCardsModal } from './components/ImportCardsModal';
import { CardEditorModal } from './components/CardEditorModal';
import { AiFileUploadModal } from './components/AiFileUploadModal';
import { SettingsModal } from './components/SettingsModal';
import { DeepExplainModal } from './components/DeepExplainModal';
import { CheckCircle2, PlayCircle, X as XIcon } from 'lucide-react';

export default function App() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<StudyStats>(loadStats());
  const [activeTab, setActiveTab] = useState<'decks' | 'all-cards' | 'stats'>('decks');

  // Active study session states
  const [activeSession, setActiveSession] = useState<{
    type: 'study' | 'quiz' | 'active_recall';
    deck: Deck;
    cards: Flashcard[];
  } | null>(null);

  // Modal controls
  const [isAiFileModalOpen, setIsAiFileModalOpen] = useState(false);
  const [isPromptGenOpen, setIsPromptGenOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importInitialJson, setImportInitialJson] = useState<string>('');
  const [importTargetDeckId, setImportTargetDeckId] = useState<string | undefined>(undefined);
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [defaultEditorDeckId, setDefaultEditorDeckId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Resume-session banner (shows if the app was closed mid-session)
  const [resumeBanner, setResumeBanner] = useState<{ pointer: SessionPointer; deck: Deck } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize data from local storage
  useEffect(() => {
    const loadedDecks = loadDecks();
    const loadedCards = loadCards();
    const loadedStats = loadStats();
    setDecks(loadedDecks);
    setCards(loadedCards);
    setStats(loadedStats);

    // Check for an interrupted session to offer resuming
    const pointer = loadSessionPointer();
    if (pointer) {
      const deck = loadedDecks.find((d) => d.id === pointer.deckId);
      const deckCards = loadedCards.filter((c) => c.deckId === pointer.deckId);
      const hasWork = pointer.type === 'study' ? deckCards.some(isCardDue) : deckCards.length > 0;
      if (deck && hasWork) {
        setResumeBanner({ pointer, deck });
      } else {
        clearSessionPointer();
      }
    }
  }, []);

  // Save changes
  const updateDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    saveDecks(newDecks);
  };

  const updateCards = (newCards: Flashcard[]) => {
    setCards(newCards);
    saveCards(newCards);
  };

  // Study triggers
  const handleStartStudy = (deck: Deck) => {
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    if (deckCards.length === 0) {
      showToast('ابتدا برای این دسته فلش‌کارت اضافه کنید!');
      return;
    }
    const sorted = sortCardsForStudy(deckCards);
    setActiveSession({
      type: 'study',
      deck,
      cards: sorted,
    });
    setResumeBanner(null);
    saveSessionPointer({ type: 'study', deckId: deck.id, startedAt: new Date().toISOString() });
  };

  const handleStartQuiz = (deck: Deck) => {
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    if (deckCards.length === 0) {
      showToast('ابتدا برای این دسته فلش‌کارت اضافه کنید!');
      return;
    }
    setActiveSession({
      type: 'quiz',
      deck,
      cards: deckCards,
    });
    setResumeBanner(null);
    saveSessionPointer({ type: 'quiz', deckId: deck.id, startedAt: new Date().toISOString() });
  };

  const handleStartActiveRecall = (deck: Deck) => {
    const deckCards = cards.filter((c) => c.deckId === deck.id);
    if (deckCards.length === 0) {
      showToast('ابتدا برای این دسته فلش‌کارت اضافه کنید!');
      return;
    }
    setActiveSession({
      type: 'active_recall',
      deck,
      cards: deckCards,
    });
    setResumeBanner(null);
    saveSessionPointer({ type: 'active_recall', deckId: deck.id, startedAt: new Date().toISOString() });
  };

  const handleExitSession = () => {
    setActiveSession(null);
    // Intentionally keep the session pointer so the resume banner can
    // offer to continue next time the app is opened.
  };

  // Called after every single card rating in StudySession, so progress is
  // saved to disk immediately rather than only when the whole session ends.
  const handleSessionProgress = (updatedCard: Flashcard) => {
    setCards((prev) => {
      const next = prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      saveCards(next);
      return next;
    });
    recordCardReviewInStats(updatedCard.repetitions > 0 ? 3 : 1);
    setStats(loadStats());
  };

  const handleFinishStudySession = (updatedReviewedCards: Flashcard[]) => {
    const cardMap = new Map<string, Flashcard>(cards.map((c) => [c.id, c]));
    updatedReviewedCards.forEach((c) => {
      cardMap.set(c.id, c);
    });

    const newCardsList: Flashcard[] = Array.from(cardMap.values());
    updateCards(newCardsList);
    setStats(loadStats());
    setActiveSession(null);
    clearSessionPointer();
    showToast('پیشرفت جلسه مرور در الگوریتم با موفقیت ذخیره شد!');
  };

  // Deck Management
  const handleCreateDeck = (title: string, category: string) => {
    const newDeck: Deck = {
      id: `deck_${Date.now()}`,
      title,
      category: category || 'عمومی',
      description: `دسته فلش‌کارت‌های ${title}`,
      color: 'emerald',
      icon: 'Layers',
      createdAt: new Date().toISOString(),
      tags: [category],
    };
    updateDecks([...decks, newDeck]);
    showToast(`دسته «${title}» با موفقیت ایجاد شد.`);
  };

  const handleDeleteDeck = (deckId: string) => {
    updateDecks(decks.filter((d) => d.id !== deckId));
    updateCards(cards.filter((c) => c.deckId !== deckId));
    showToast('دسته و کارت‌های آن حذف شدند.');
  };

  // Import Handler
  const handleImportSuccess = (
    newCards: Flashcard[],
    targetDeckId: string,
    newDeckTitle?: string
  ) => {
    let currentDecks = [...decks];

    if (newDeckTitle) {
      const createdDeck: Deck = {
        id: targetDeckId,
        title: newDeckTitle,
        description: `فلش‌کارت‌های ${newDeckTitle}`,
        category: 'شخصی',
        color: 'emerald',
        icon: 'Sparkles',
        createdAt: new Date().toISOString(),
        tags: ['شخصی'],
      };
      currentDecks = [...currentDecks, createdDeck];
      updateDecks(currentDecks);
    }

    const updated = [...cards, ...newCards];
    updateCards(updated);
    showToast(`${newCards.length} فلش‌کارت جدید با موفقیت اضافه شد! 🎉`);
  };

  // Card Editor Handlers
  const handleSaveCard = (cardData: Partial<Flashcard>) => {
    if (cardData.id) {
      const updated = cards.map((c) =>
        c.id === cardData.id ? ({ ...c, ...cardData } as Flashcard) : c
      );
      updateCards(updated);
      showToast('تغییرات فلش‌کارت ذخیره شد.');
    } else {
      const defaultDeck = decks[0]?.id || 'deck_general';
      const newCard: Flashcard = {
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        deckId: cardData.deckId || defaultDeck,
        cardType: cardData.cardType || 'standard',
        front: cardData.front || '',
        back: cardData.back || '',
        keyPoint: cardData.keyPoint || '',
        mnemonic: cardData.mnemonic || '',
        specialty: cardData.specialty || 'پزشکی',
        tags: cardData.tags || [],
        options: cardData.options || [],
        correctOptionIndex: typeof cardData.correctOptionIndex === 'number' ? cardData.correctOptionIndex : 0,
        correctAnswer: cardData.correctAnswer || '',
        clozeAnswer: cardData.clozeAnswer || '',
        difficultyRating: 'medium',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: new Date().toISOString(),
        state: 'new',
        lapses: 0,
      };
      updateCards([...cards, newCard]);
      showToast('فلش‌کارت جدید با موفقیت اضافه شد.');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    updateCards(cards.filter((c) => c.id !== cardId));
    showToast('کارت حذف شد.');
  };

  const handleClearAllCards = () => {
    clearAllCards();
    setCards([]);
    showToast('تمام فلش‌کارت‌ها پاک شدند.');
  };

  const handleResetCardProgress = (cardId: string) => {
    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          state: 'new' as const,
          lapses: 0,
        };
      }
      return c;
    });
    updateCards(updated);
    showToast('پیشرفت کارت ریست شد.');
  };

  const handleResetAllData = () => {
    const res = resetAllToDefaults();
    setDecks(res.decks);
    setCards(res.cards);
    setStats(res.stats);
    showToast('تمام داده‌ها ریست و پاک شدند.');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveSession(null);
          setActiveTab(tab);
        }}
        stats={stats}
        onOpenFileAI={() => setIsAiFileModalOpen(true)}
        onOpenPromptGen={() => setIsPromptGenOpen(true)}
        onOpenImport={() => {
          setImportInitialJson('');
          setIsImportOpen(true);
        }}
        onOpenNewCard={() => {
          setEditingCard(null);
          setDefaultEditorDeckId(decks[0]?.id);
          setIsCardEditorOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Resume interrupted session banner */}
        {resumeBanner && !activeSession && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  یک جلسه مطالعه نیمه‌تمام در «{resumeBanner.deck.title}» دارید
                </p>
                <p className="text-xs text-emerald-800">می‌خواهید از همان‌جا ادامه دهید؟</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => {
                  const deck = resumeBanner.deck;
                  const type = resumeBanner.pointer.type;
                  if (type === 'study') handleStartStudy(deck);
                  else if (type === 'quiz') handleStartQuiz(deck);
                  else handleStartActiveRecall(deck);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                ادامه مطالعه
              </button>
              <button
                onClick={() => {
                  setResumeBanner(null);
                  clearSessionPointer();
                }}
                className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Active Session View (Study, Quiz, Active Recall) */}
        {activeSession ? (
          <div>
            {activeSession.type === 'study' && (
              <StudySession
                deck={activeSession.deck}
                cards={activeSession.cards}
                onFinishSession={handleFinishStudySession}
                onProgress={handleSessionProgress}
                onExit={handleExitSession}
              />
            )}

            {activeSession.type === 'quiz' && (
              <QuizSession
                deck={activeSession.deck}
                cards={activeSession.cards}
                allDeckCards={cards.filter((c) => c.deckId === activeSession.deck.id)}
                onExit={() => {
                  setActiveSession(null);
                  clearSessionPointer();
                }}
                onCardAnswered={(_card, isCorrect) => {
                  recordCardReviewInStats(isCorrect ? 3 : 1);
                  setStats(loadStats());
                }}
              />
            )}

            {activeSession.type === 'active_recall' && (
              <ActiveRecallSession
                deck={activeSession.deck}
                cards={activeSession.cards}
                onExit={() => {
                  setActiveSession(null);
                  clearSessionPointer();
                }}
              />
            )}
          </div>
        ) : (
          /* Normal Tab Views */
          <div>
            {activeTab === 'decks' && (
              <DeckList
                decks={decks}
                cards={cards}
                onStartStudy={handleStartStudy}
                onStartQuiz={handleStartQuiz}
                onStartActiveRecall={handleStartActiveRecall}
                onOpenFileAI={() => setIsAiFileModalOpen(true)}
                onOpenPromptGen={() => setIsPromptGenOpen(true)}
                onOpenImport={(deckId) => {
                  setImportInitialJson('');
                  setImportTargetDeckId(deckId);
                  setIsImportOpen(true);
                }}
                onOpenCardEditor={(deckId) => {
                  setEditingCard(null);
                  setDefaultEditorDeckId(deckId || decks[0]?.id);
                  setIsCardEditorOpen(true);
                }}
                onDeleteDeck={handleDeleteDeck}
                onCreateDeck={handleCreateDeck}
              />
            )}

            {activeTab === 'all-cards' && (
              <AllCardsView
                decks={decks}
                cards={cards}
                onEditCard={(card) => {
                  setEditingCard(card);
                  setIsCardEditorOpen(true);
                }}
                onDeleteCard={handleDeleteCard}
                onResetCardProgress={handleResetCardProgress}
                onAddNewCard={() => {
                  setEditingCard(null);
                  setDefaultEditorDeckId(decks[0]?.id);
                  setIsCardEditorOpen(true);
                }}
                onOpenFileAI={() => setIsAiFileModalOpen(true)}
                onOpenImport={() => {
                  setImportInitialJson('');
                  setIsImportOpen(true);
                }}
                onOpenPromptGen={() => setIsPromptGenOpen(true)}
                onClearAllCards={handleClearAllCards}
              />
            )}

            {activeTab === 'stats' && (
              <StatsView
                stats={stats}
                decks={decks}
                cards={cards}
                onResetAllData={handleResetAllData}
                onClearAllCards={handleClearAllCards}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* AI File Upload to Flashcards Modal */}
      <AiFileUploadModal
        isOpen={isAiFileModalOpen}
        onClose={() => setIsAiFileModalOpen(false)}
        decks={decks}
        onImportSuccess={handleImportSuccess}
        onOpenPromptGen={() => {
          setIsAiFileModalOpen(false);
          setIsPromptGenOpen(true);
        }}
        onOpenSettings={() => {
          setIsAiFileModalOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* Prompt Generator Modal */}
      <PromptGeneratorModal
        isOpen={isPromptGenOpen}
        onClose={() => setIsPromptGenOpen(false)}
        onDirectImport={(rawJson) => {
          setImportInitialJson(rawJson);
          setIsImportOpen(true);
        }}
        onOpenSettings={() => {
          setIsPromptGenOpen(false);
          setIsSettingsOpen(true);
        }}
      />

      {/* Settings Modal (Gemini API key) */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Import Cards Modal */}
      <ImportCardsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        decks={decks}
        initialJson={importInitialJson}
        onImportSuccess={handleImportSuccess}
      />

      {/* Manual Card Editor Modal */}
      <CardEditorModal
        isOpen={isCardEditorOpen}
        onClose={() => {
          setIsCardEditorOpen(false);
          setEditingCard(null);
        }}
        decks={decks}
        editingCard={editingCard}
        defaultDeckId={defaultEditorDeckId}
        onSaveCard={handleSaveCard}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold animate-fade-in" dir="rtl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

