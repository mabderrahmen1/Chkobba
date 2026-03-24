/**
 * Gameplay animation timing shared by server (turn/bot delays) and client (dealing overlay).
 * Keep values in sync with DealingAnimation.tsx GSAP durations.
 */

export type DealGameType = 'chkobba' | 'rummy';

/** Matches client: card deal stagger + last card flight (0.4s) + fade (0.12s). */
export function dealAnimationDurationMs(gameType: DealGameType, playerCount: number): number {
  const n = Math.max(1, playerCount);
  const cardsPerPlayer = gameType === 'rummy' ? 13 : 3;
  const totalCards = cardsPerPlayer * n;
  const startDelay = 200;
  const timePerCard = Math.min(80, Math.floor(1200 / Math.max(1, totalCards)));
  const lastIndex = totalCards - 1;
  const lastStartMs = startDelay + lastIndex * timePerCard;
  return lastStartMs + 400 + 120;
}

export function getDealAnimationParams(gameType: DealGameType, playerCount: number) {
  const n = Math.max(1, playerCount);
  const cardsPerPlayer = gameType === 'rummy' ? 13 : 3;
  const totalCards = cardsPerPlayer * n;
  const startDelay = 200;
  const timePerCard = Math.min(80, Math.floor(1200 / Math.max(1, totalCards)));
  return {
    totalCards,
    startDelay,
    timePerCard,
    durationMs: dealAnimationDurationMs(gameType, playerCount),
  };
}

/**
 * Pause before advancing turn after Chkobba/Hayya (boom + full-screen overlay).
 * Slightly longer than ChkobbaEffect’s worst case (~1.2s pre-roll + ~1.9s timeline).
 */
export const SPECIAL_CAPTURE_PAUSE_MS = 3200;
