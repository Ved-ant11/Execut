import { createEmptyCard, fsrs, Rating, State, type Card, type FSRS } from "ts-fsrs";

// FSRS scheduler configured for DSA problem review
// request_retention: 0.9 = target 90% recall probability
// maximum_interval: 365 = max 1 year between reviews
const scheduler: FSRS = fsrs({
  request_retention: 0.9,
  maximum_interval: 365,
  enable_fuzz: true,
});

export { scheduler, createEmptyCard, Rating, State };
export type { Card };

// Rating string to ts-fsrs Rating enum
export const RATING_MAP: Record<string, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

// Convert our Prisma ReviewCard record into a ts-fsrs Card object
export function dbToCard(dbCard: {
  due: Date;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: Date | null;
}): Card {
  return {
    due: dbCard.due,
    stability: dbCard.stability,
    difficulty: dbCard.difficulty,
    elapsed_days: dbCard.elapsedDays,
    scheduled_days: dbCard.scheduledDays,
    reps: dbCard.reps,
    lapses: dbCard.lapses,
    state: dbCard.state as State,
    last_review: dbCard.lastReview ?? undefined,
  } as Card;
}

// Convert a ts-fsrs Card object into data suitable for Prisma upsert
export function cardToDb(card: Card) {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    lastReview: card.last_review ?? null,
  };
}

// Get preview intervals for all 4 ratings (used to show "Good — 4 days" etc.)
export function getPreviewIntervals(card: Card, now: Date) {
  const preview = scheduler.repeat(card, now);
  return {
    again: Math.round(
      (preview[Rating.Again].card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ),
    hard: Math.round(
      (preview[Rating.Hard].card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ),
    good: Math.round(
      (preview[Rating.Good].card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ),
    easy: Math.round(
      (preview[Rating.Easy].card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
}
