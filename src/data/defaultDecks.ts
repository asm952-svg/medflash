import { Deck, Flashcard } from '../types';

export const INITIAL_DECKS: Deck[] = [
  {
    id: 'deck_general',
    title: 'فلش‌کارت‌های من',
    englishTitle: 'My Flashcards',
    category: 'عمومی',
    description: 'دسته پیش‌فرض برای یادداشت‌ها، سوالات و فلش‌کارت‌های شخصی شما',
    color: 'emerald',
    icon: 'Brain',
    createdAt: new Date().toISOString(),
    tags: ['شخصی'],
  },
];

export const INITIAL_CARDS: Flashcard[] = [];

