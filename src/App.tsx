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
} from './utils/storage';
import { sortCardsForStudy } from './utils/sm2';
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
import { CheckCircle2 } from 'lucide-react';

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
  };

  const handleFinishStudySession = (updatedReviewedCards: Flashcard[]) => {
    const cardMap = new Map<string, Flashcard>(cards.map((c) => [c.id, c]));
    updatedReviewedCards.forEach((c) => {
      cardMap.set(c.id, c);
      recordCardReviewInStats(c.repetitions > 0 ? 3 : 1);
    });

    const newCardsList: Flashcard[] = Array.from(cardMap.values());
    updateCards(newCardsList);
    setStats(loadStats());
    setActiveSession(null);
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
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Active Session View (Study, Quiz, Active Recall) */}
        {activeSession ? (
          <div>
            {activeSession.type === 'study' && (
              <StudySession
                deck={activeSession.deck}
                cards={activeSession.cards}
                onFinishSession={handleFinishStudySession}
                onExit={() => setActiveSession(null)}
              />
            )}

            {activeSession.type === 'quiz' && (
              <QuizSession
                deck={activeSession.deck}
                cards={activeSession.cards}
                allDeckCards={cards.filter((c) => c.deckId === activeSession.deck.id)}
                onExit={() => setActiveSession(null)}
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
                onExit={() => setActiveSession(null)}
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
      />

      {/* Prompt Generator Modal */}
      <PromptGeneratorModal
        isOpen={isPromptGenOpen}
        onClose={() => setIsPromptGenOpen(false)}
        onDirectImport={(rawJson) => {
          setImportInitialJson(rawJson);
          setIsImportOpen(true);
        }}
      />

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

