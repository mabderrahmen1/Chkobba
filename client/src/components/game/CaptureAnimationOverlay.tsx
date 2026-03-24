import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { Card } from './Card';

export function CaptureAnimationOverlay() {
  const lastAction = useGameStore((s) => s.gameState?.lastAction);
  const playerId = useGameStore((s) => s.playerId);
  const [activeAction, setActiveAction] = useState<typeof lastAction>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const capturedRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (lastAction && lastAction.type === 'capture') {
      setActiveAction(lastAction);
    }
  }, [lastAction?.timestamp]);

  useLayoutEffect(() => {
    if (!activeAction || activeAction.type !== 'capture') return;
    const actionPlayerId = activeAction.playerId;
    if (actionPlayerId === playerId) return;

    const isMobile = window.innerWidth < 640;
    const playedFromX = isMobile ? -120 : -220;
    const playedFromY = isMobile ? -160 : -320;
    const scoreX = isMobile ? 180 : 280;
    const scoreY = isMobile ? -220 : -400;
    const titleToY = isMobile ? -120 : -180;

    const caps = capturedRefs.current.filter(Boolean) as HTMLDivElement[];
    const root = rootRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => setActiveAction(null),
      });

      if (backdropRef.current) {
        tl.from(backdropRef.current, { opacity: 0, duration: 0.2 });
      }
      if (titleRef.current) {
        tl.fromTo(
          titleRef.current,
          { y: 16, opacity: 0, scale: 0.92 },
          { y: titleToY, opacity: 1, scale: 1, duration: 0.36, ease: 'back.out(1.2)' },
          '-=0.1',
        );
      }
      if (playedRef.current) {
        tl.from(
          playedRef.current,
          {
            scale: 0.45,
            x: playedFromX,
            y: playedFromY,
            rotation: -12,
            duration: 0.38,
            ease: 'power2.out',
          },
          '-=0.2',
        );
      }
      if (arrowRef.current) {
        tl.from(arrowRef.current, { scale: 0, rotation: -90, duration: 0.25, ease: 'power2.out' }, '-=0.15');
      }
      if (caps.length) {
        tl.from(
          caps,
          {
            scale: 0.5,
            x: 120,
            y: 36,
            opacity: 0,
            duration: 0.28,
            stagger: 0.06,
            ease: 'power2.out',
          },
          '-=0.1',
        );
      }

      const flyTargets = [playedRef.current, ...caps].filter(Boolean) as HTMLDivElement[];
      if (flyTargets.length) {
        tl.to(
          flyTargets,
          {
            x: scoreX,
            y: scoreY,
            rotation: 72,
            opacity: 0,
            duration: 0.45,
            stagger: 0.06,
            ease: 'power1.in',
            delay: 0.28,
          },
        );
      }
    }, root ?? undefined);

    return () => ctx.revert();
  }, [activeAction, playerId]);

  if (!activeAction || activeAction.type !== 'capture') return null;

  const { card, capturedCards, playerId: actionPlayerId, isChkobba, isHayya } = activeAction;
  const isMe = actionPlayerId === playerId;
  if (isMe) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[240] pointer-events-none flex items-center justify-center opacity-100"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          ref={backdropRef}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0"
        />

        <div className="absolute left-1/2 top-[22%] -translate-x-1/2 text-center pointer-events-none">
          <div
            ref={titleRef}
            className="font-ancient text-2xl sm:text-5xl uppercase tracking-[0.4em] font-bold drop-shadow-glow-gold opacity-0"
            style={{ transformOrigin: 'center center' }}
          >
            <span
              className={
                isChkobba ? 'text-accent' : isHayya ? 'text-pink-400' : 'text-brass'
              }
            >
              {isChkobba ? 'CHKOBBA!' : isHayya ? '7 HAYA!' : 'CAPTURE'}
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-4 sm:gap-16">
          <div ref={playedRef} className="z-20 relative" style={{ transformOrigin: 'center center' }}>
            <Card card={card} />
            <div className="absolute -inset-2 bg-accent/10 blur-xl rounded-full -z-10 pointer-events-none" />
          </div>

          <div
            ref={arrowRef}
            className="text-brass/80 text-2xl sm:text-5xl font-bold"
            style={{ transformOrigin: 'center center' }}
          >
            ➝
          </div>

          <div className="flex -space-x-12 sm:-space-x-24">
            {capturedCards?.map((c, i) => (
              <div
                key={`${c.rank}-${c.suit}-${i}`}
                ref={(el) => {
                  capturedRefs.current[i] = el;
                }}
                className="z-10 shadow-2xl"
                style={{ transformOrigin: 'center center' }}
              >
                <Card card={c} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
