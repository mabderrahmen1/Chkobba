import gsap from 'gsap';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { getEmoteById } from '../../lib/emoteCatalog';
import { playCelebrationFanfare, playImpactBoom, stopCelebrationPlayback } from '../../lib/playAssetSound';
import { shakeAppChrome, shakeTableElement } from '../../lib/gsapShake';

const SPOKE_COUNT = 20;
const CARD_SHARD_COUNT = 12;
const PARTICLE_COUNT = 18;

/**
 * Chkobba — “gilded burst”: flash + radial spokes + flying card backs + title slam.
 * Fanfare: player-picked emote (default LA) + boom; screen + table shake on trigger.
 */
export function ChkobbaEffect({ tableShakeRef }: { tableShakeRef?: RefObject<HTMLElement | null> }) {
  const chkobbaPlayer = useGameStore((s) => s.chkobbaPlayer);
  const chkobbaSeq = useGameStore((s) => s.chkobbaSeq);
  const [show, setShow] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const chromaRef = useRef<HTMLDivElement>(null);
  const spokeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  const hasChkobba = !!chkobbaPlayer;

  /** Fanfare + shake once per `chkobbaSeq` bump (same player can repeat). Ref avoids replay on mount / Strict Mode. */
  const lastFanfareSeqRef = useRef(useGameStore.getState().chkobbaSeq);
  useEffect(() => {
    if (!chkobbaPlayer) {
      lastFanfareSeqRef.current = chkobbaSeq;
      return;
    }
    if (chkobbaSeq === lastFanfareSeqRef.current) return;
    lastFanfareSeqRef.current = chkobbaSeq;
    const id = useUIStore.getState().sfxCelebrationChkobbaEmoteId;
    const meta = getEmoteById(id);
    if (meta) {
      playCelebrationFanfare(meta.file, 'chkobba:celebration', 1.14);
    } else {
      stopCelebrationPlayback();
      playImpactBoom(1, { celebration: true });
    }
    const felt = tableShakeRef?.current ?? null;
    shakeTableElement(felt, 1.25);
    shakeAppChrome(document.getElementById('app-chrome'), 1.05);
  }, [chkobbaPlayer, chkobbaSeq, tableShakeRef]);

  useEffect(() => {
    if (!chkobbaPlayer) {
      setShow(false);
      return;
    }
    setShow(false);
    const t = window.setTimeout(() => setShow(true), 130);
    return () => clearTimeout(t);
  }, [chkobbaPlayer, chkobbaSeq]);

  useLayoutEffect(() => {
    if (!show || !hasChkobba) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const flash = flashRef.current;
      const chroma = chromaRef.current;
      const title = titleRef.current;
      const sub = subRef.current;
      const spokes = spokeRefs.current.filter(Boolean) as HTMLDivElement[];
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      const particles = particleRefs.current.filter(Boolean) as HTMLDivElement[];

      gsap.set(root, { opacity: 1 });
      if (flash) gsap.set(flash, { opacity: 0, scale: 0.3 });
      if (chroma) gsap.set(chroma, { opacity: 0, scale: 1.15 });
      spokes.forEach((el) => gsap.set(el, { opacity: 0, scaleY: 0, transformOrigin: '50% 100%' }));
      cards.forEach((el) => gsap.set(el, { opacity: 0, x: 0, y: 0, scale: 0.35, rotation: 0 }));
      particles.forEach((el) => gsap.set(el, { opacity: 0, x: 0, y: 0, scale: 0 }));
      if (title) gsap.set(title, { opacity: 0, y: 56, scale: 0.15 });
      if (sub) gsap.set(sub, { opacity: 0, y: 24, scale: 0.95 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.call(() => playImpactBoom(0.28), [], 0.48);

      if (chroma) {
        tl.to(chroma, { opacity: 0.45, scale: 1, duration: 0.12, ease: 'power2.out' }, 0).to(
          chroma,
          { opacity: 0, scale: 1.25, duration: 0.4, ease: 'power2.in' },
          0.1,
        );
      }

      if (flash) {
        tl.to(flash, { opacity: 0.95, scale: 1.05, duration: 0.07, ease: 'power2.out' }, 0).to(
          flash,
          { opacity: 0, scale: 1.8, duration: 0.35, ease: 'power2.in' },
          0.05,
        );
      }

      spokes.forEach((el, i) => {
        const delay = i * 0.01;
        tl.to(
          el,
          { opacity: 0.92, scaleY: 1, duration: 0.28, ease: 'power3.out' },
          0.1 + delay,
        );
        tl.to(el, { opacity: 0, scaleY: 1.9, duration: 0.42, ease: 'power2.in' }, 0.5 + delay * 0.4);
      });

      particles.forEach((el, i) => {
        const ang = (i / PARTICLE_COUNT) * Math.PI * 2 + gsap.utils.random(-0.4, 0.4);
        const dist = gsap.utils.random(140, 280);
        const tx = Math.cos(ang) * dist;
        const ty = Math.sin(ang) * dist;
        tl.to(
          el,
          { opacity: 1, scale: 1, x: tx * 0.08, y: ty * 0.08, duration: 0.18, ease: 'power2.out' },
          0.08 + i * 0.02,
        );
        tl.to(
          el,
          { x: tx, y: ty, opacity: 0, scale: 0.2, rotation: gsap.utils.random(-180, 180), duration: 0.55, ease: 'power3.in' },
          0.22 + i * 0.015,
        );
      });

      cards.forEach((el, i) => {
        const rx = (Math.random() - 0.5) * 420;
        const ry = (Math.random() - 0.5) * 320;
        const rot = gsap.utils.random(-55, 55);
        tl.to(
          el,
          {
            opacity: 1,
            scale: 1,
            x: rx * 0.12,
            y: ry * 0.12,
            rotation: rot * 0.15,
            duration: 0.22,
            ease: 'power2.out',
          },
          0.12 + i * 0.03,
        );
        tl.to(
          el,
          {
            x: rx * 3.2,
            y: ry * 3.2,
            rotation: rot * 2.2,
            opacity: 0,
            duration: 0.52,
            ease: 'power3.in',
          },
          0.34 + i * 0.02,
        );
      });

      if (title) {
        tl.to(title, { opacity: 1, y: 0, scale: 1, duration: 0.48, ease: 'back.out(1.45)' }, 0.16);
        tl.to(title, { scale: 1.08, duration: 0.1, yoyo: true, repeat: 3, ease: 'power2.inOut' }, 0.62);
      }
      if (sub) {
        tl.to(sub, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }, 0.58);
      }

      tl.to(
        root,
        { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => setShow(false) },
        1.85,
      );
    }, root);

    return () => ctx.revert();
  }, [show, hasChkobba, chkobbaSeq]);

  if (!show || !hasChkobba) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div
        ref={chromaRef}
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(255,220,120,0.35)_0%,transparent_55%)] mix-blend-screen"
        style={{ transformOrigin: '50% 50%' }}
      />

      <div
        ref={flashRef}
        className="absolute inset-0 rounded-full bg-[#f5e6a8]"
        style={{ transformOrigin: '50% 50%' }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <div
            key={`p-${i}`}
            ref={(el) => {
              particleRefs.current[i] = el;
            }}
            className="absolute h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -4,
              marginTop: -4,
              background: i % 3 === 0 ? '#f9e596' : i % 3 === 1 ? '#d4af37' : '#fff8dc',
              boxShadow: '0 0 8px rgba(212,175,55,0.9)',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[min(70vh,520px)] w-[min(70vh,520px)]">
          {Array.from({ length: SPOKE_COUNT }).map((_, i) => (
            <div
              key={`spoke-wrap-${i}`}
              className="absolute left-1/2 top-1/2 h-full w-full"
              style={{
                transform: `translate(-50%, -50%) rotate(${i * (360 / SPOKE_COUNT)}deg)`,
              }}
            >
              <div
                ref={(el) => {
                  spokeRefs.current[i] = el;
                }}
                className="absolute bottom-1/2 left-1/2 h-[42%] w-1.5 -translate-x-1/2 rounded-full bg-gradient-to-t from-[#8b6914] via-[#e8c547] to-[#fff8dc]"
                style={{ transformOrigin: '50% 100%' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: CARD_SHARD_COUNT }).map((_, i) => (
          <div
            key={`card-${i}`}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="absolute h-20 w-14 overflow-hidden rounded-md border-2 border-[#c4a86c] sm:h-[5.5rem] sm:w-16"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-1.75rem',
              marginTop: '-2.5rem',
              transformOrigin: '50% 50%',
            }}
          >
            <img src="/card_back.png" alt="" className="h-full w-full object-cover" draggable={false} />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4">
        <div
          ref={titleRef}
          className="font-ancient text-6xl font-black italic tracking-tighter text-[#f9e596] sm:text-8xl md:text-[12rem]"
          style={{
            textShadow: '0 0 24px rgba(212,175,55,0.5), 0 12px 0 rgba(0,0,0,0.35)',
          }}
        >
          CHKOBBA!
        </div>
        <div
          ref={subRef}
          className="mt-6 rounded-2xl border-2 border-brass/50 bg-black/80 px-8 py-3 sm:px-12 sm:py-10"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-ancient text-xl font-black uppercase italic tracking-[0.4em] text-brass-light sm:text-3xl">
              {chkobbaPlayer} scores!
            </span>
            <span className="font-ancient text-sm font-bold uppercase tracking-[0.45em] text-brass/70 sm:text-base">
              ychakeb
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
