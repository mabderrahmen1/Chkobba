import { useGameStore } from '../../stores/useGameStore';
import { useAmbianceSound } from '../../hooks/useAmbianceSound';
import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { getDealAnimationParams } from '@shared/timing';

export function DealingAnimation() {
  const isDistributing = useGameStore((s) => s.isDistributing);
  const gameType = useGameStore((s) => s.gameType);
  const chkobbaPlayers = useGameStore((s) => s.gameState?.players || []);
  const rummyPlayers = useGameStore((s) => s.rummyGameState?.players || []);

  const players = gameType === 'rummy' ? rummyPlayers : chkobbaPlayers;
  const myId = useGameStore((s) => s.playerId);
  const { playCardDealShort } = useAmbianceSound();
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDistributing || !deckRef.current) return;
    gsap.from(deckRef.current, { scale: 0, duration: 0.35, ease: 'back.out(1.7)' });
  }, [isDistributing]);

  if (!isDistributing) return null;

  const cardsPerPlayer = gameType === 'rummy' ? 13 : 3;
  const dealType = gameType === 'rummy' ? 'rummy' : 'chkobba';
  const { startDelay, timePerCard } = getDealAnimationParams(dealType, players.length);

  const orderedCards: { playerIndex: number; cardIndex: number }[] = [];
  for (let c = 0; c < cardsPerPlayer; c++) {
    for (let p = 0; p < players.length; p++) {
      orderedCards.push({ playerIndex: p, cardIndex: c });
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[80] flex items-center justify-center">
      {orderedCards.map((item, i) => (
        <DealingCard
          key={`${item.playerIndex}-${item.cardIndex}`}
          item={item}
          index={i}
          players={players}
          myId={myId}
          onAppear={playCardDealShort}
          startDelay={startDelay}
          timePerCard={timePerCard}
        />
      ))}

      <div
        ref={deckRef}
        className="w-[70px] h-[95px] bg-wood-dark rounded-lg border-2 border-brass/30 shadow-inner flex items-center justify-center"
      >
        <div className="text-brass/20 font-ancient text-[8px] uppercase text-center px-1">Dealing...</div>
      </div>
    </div>
  );
}

function DealingCard({
  item,
  index,
  players,
  myId,
  onAppear,
  startDelay,
  timePerCard,
}: {
  item: { playerIndex: number; cardIndex: number };
  index: number;
  players: { id: string }[];
  myId: string | null;
  onAppear: () => void;
  startDelay: number;
  timePerCard: number;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const myDelay = startDelay + index * timePerCard;

  useEffect(() => {
    const timer = setTimeout(() => {
      onAppear();
    }, myDelay);
    return () => clearTimeout(timer);
  }, [myDelay, onAppear]);

  const { x, y } = getPlayerPosition(item.playerIndex, players, myId);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const delay = myDelay / 1000;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scale: 0.5, x: 0, y: 0, rotation: 0, opacity: 0 },
        {
          scale: 1,
          x,
          y,
          rotation: 360,
          opacity: 1,
          duration: 0.4,
          delay,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(el, { opacity: 0, duration: 0.12 });
          },
        },
      );
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deal flight per mount
  }, []);

  return (
    <div
      ref={elRef}
      className="absolute w-[60px] h-[84px] bg-white rounded-lg border-2 border-brass shadow-2xl overflow-hidden"
    >
      <img src="/card_back.png" alt="card" className="w-full h-full object-cover" />
    </div>
  );
}

function getPlayerPosition(playerIndex: number, players: { id: string }[], myId: string | null) {
  if (!myId || players.length === 0) return { x: 0, y: 0 };

  const me = players.find((p) => p.id === myId);
  const targetPlayer = players[playerIndex];

  if (!me || !targetPlayer) return { x: 0, y: 0 };

  const isSmallScreen = window.innerWidth < 640;
  const offset = isSmallScreen ? 150 : 300;

  if (me.id === targetPlayer.id) return { x: 0, y: offset };

  if (players.length >= 4) {
    if ((targetPlayer as { team?: number }).team === (me as { team?: number }).team) return { x: 0, y: -offset };

    const turnOrder = players.map((p) => p.id);
    const myIdx = turnOrder.indexOf(me.id);
    const nextIdx = (myIdx + 1) % turnOrder.length;

    if (targetPlayer.id === turnOrder[nextIdx]) {
      return { x: offset, y: 0 };
    }
    return { x: -offset, y: 0 };
  }

  return { x: 0, y: -offset };
}
