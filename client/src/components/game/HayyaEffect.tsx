import gsap from 'gsap';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { getEmoteById } from '../../lib/emoteCatalog';
import { playCelebrationFanfare, playImpactBoom, stopCelebrationPlayback } from '../../lib/playAssetSound';
import { shakeAppChrome, shakeTableElement } from '../../lib/gsapShake';

const RING_COUNT = 6;
const DIAMOND_ORBIT = 8;
const SPARK_COUNT = 14;

/**
 * 7 Haya — prismatic diamond + rings. Fanfare: player-picked emote (default OH) + boom; screen + table shake.
 */
export function HayyaEffect({ tableShakeRef }: { tableShakeRef?: RefObject<HTMLElement | null> }) {
  const hayyaPlayer = useGameStore((s) => s.hayyaPlayer);
  const hayyaSeq = useGameStore((s) => s.hayyaSeq);
  const [show, setShow] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbitRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sparkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const diamondRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  const lastFanfareSeqRef = useRef(useGameStore.getState().hayyaSeq);
  useEffect(() => {
    if (!hayyaPlayer) {
      lastFanfareSeqRef.current = hayyaSeq;
      return;
    }
    if (hayyaSeq === lastFanfareSeqRef.current) return;
    lastFanfareSeqRef.current = hayyaSeq;
    const id = useUIStore.getState().sfxCelebrationHayyaEmoteId;
    const meta = getEmoteById(id);
    if (meta) {
      playCelebrationFanfare(meta.file, 'hayya:celebration', 1.12);
    } else {
      stopCelebrationPlayback();
      playImpactBoom(1, { celebration: true });
    }
    shakeTableElement(tableShakeRef?.current ?? null, 1.15);
    shakeAppChrome(document.getElementById('app-chrome'), 1.08);
  }, [hayyaPlayer, hayyaSeq, tableShakeRef]);

  useEffect(() => {
    if (!hayyaPlayer) {
      setShow(false);
      return;
    }
    setShow(false);
    const t = window.setTimeout(() => setShow(true), 95);
    return () => clearTimeout(t);
  }, [hayyaPlayer, hayyaSeq]);

  const hasHayya = !!hayyaPlayer;

  useLayoutEffect(() => {
    if (!show || !hasHayya) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const veil = veilRef.current;
      const diamond = diamondRef.current;
      const glyph = glyphRef.current;
      const title = titleRef.current;
      const sub = subRef.current;
      const rings = ringRefs.current.filter(Boolean) as HTMLDivElement[];
      const orbits = orbitRefs.current.filter(Boolean) as HTMLDivElement[];
      const sparks = sparkRefs.current.filter(Boolean) as HTMLDivElement[];

      gsap.set(root, { opacity: 1 });
      if (veil) gsap.set(veil, { opacity: 0, scale: 1.2 });
      rings.forEach((el, i) => gsap.set(el, { opacity: 0, scale: 0.2 + i * 0.05 }));
      orbits.forEach((el) => gsap.set(el, { opacity: 0, scale: 0, x: 0, y: 0 }));
      sparks.forEach((el) => gsap.set(el, { opacity: 0, scale: 0 }));
      if (diamond) gsap.set(diamond, { opacity: 0, scale: 0.3, rotation: 0 });
      if (glyph) gsap.set(glyph, { opacity: 0, scale: 0, rotation: -90 });
      if (title) gsap.set(title, { opacity: 0, y: 36, scale: 0.85 });
      if (sub) gsap.set(sub, { opacity: 0, y: 20 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.call(() => playImpactBoom(0.26), [], 0.38);

      if (veil) {
        tl.to(veil, { opacity: 0.58, scale: 1, duration: 0.25, ease: 'power2.out' }, 0);
        tl.to(veil, { opacity: 0, scale: 1.35, duration: 0.55, ease: 'power2.in' }, 0.85);
      }

      sparks.forEach((el, i) => {
        const ang = (i / SPARK_COUNT) * Math.PI * 2;
        const r = 100 + gsap.utils.random(-30, 40);
        const tx = Math.cos(ang) * r;
        const ty = Math.sin(ang) * r;
        tl.to(
          el,
          { opacity: 1, scale: 1.1, x: tx * 0.15, y: ty * 0.15, duration: 0.2, ease: 'power2.out' },
          0.04 + i * 0.018,
        );
        tl.to(
          el,
          { x: tx * 1.6, y: ty * 1.6, opacity: 0, scale: 0.2, duration: 0.5, ease: 'power3.in' },
          0.22 + i * 0.02,
        );
      });

      rings.forEach((el, i) => {
        const delay = i * 0.05;
        tl.to(el, { opacity: 0.55 - i * 0.06, scale: 1, duration: 0.35, ease: 'power3.out' }, 0.05 + delay);
        tl.to(el, { opacity: 0, scale: 2.2, duration: 0.5, ease: 'power2.in' }, 0.45 + delay);
      });

      if (diamond) {
        tl.to(diamond, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.7)' }, 0.08);
        tl.to(diamond, { scale: 1.12, duration: 0.14, yoyo: true, repeat: 2, ease: 'sine.inOut' }, 0.42);
      }

      if (glyph) {
        tl.to(glyph, { opacity: 1, scale: 1, rotation: 0, duration: 0.38, ease: 'power3.out' }, 0.1);
        tl.to(glyph, { rotation: 360, duration: 0.85, ease: 'power1.inOut' }, 0.1);
      }

      orbits.forEach((el, i) => {
        const angle = (i / DIAMOND_ORBIT) * Math.PI * 2;
        const r = 120 + gsap.utils.random(-20, 20);
        const tx = Math.cos(angle) * r;
        const ty = Math.sin(angle) * r;
        tl.to(
          el,
          { opacity: 0.9, scale: 1, x: tx * 0.2, y: ty * 0.2, duration: 0.2, ease: 'power2.out' },
          0.15 + i * 0.04,
        );
        tl.to(
          el,
          { x: tx * 1.8, y: ty * 1.8, opacity: 0, scale: 0.3, duration: 0.45, ease: 'power3.in' },
          0.35 + i * 0.03,
        );
      });

      if (title) {
        tl.to(title, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.35)' }, 0.22);
        tl.to(title, { scale: 1.06, duration: 0.1, yoyo: true, repeat: 2, ease: 'power2.inOut' }, 0.55);
      }
      if (sub) {
        tl.to(sub, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }, 0.58);
      }

      tl.to(
        root,
        { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => setShow(false) },
        1.88,
      );
    }, root);

    return () => ctx.revert();
  }, [show, hasHayya, hayyaSeq]);

  if (!show || !hasHayya) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(99,102,241,0.38) 0%, transparent 45%), radial-gradient(circle at 50% 55%, rgba(255,107,53,0.42) 0%, transparent 50%)',
          transformOrigin: '50% 50%',
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: SPARK_COUNT }).map((_, i) => (
          <div
            key={`spark-${i}`}
            ref={(el) => {
              sparkRefs.current[i] = el;
            }}
            className="absolute h-2 w-2 rounded-full bg-gradient-to-br from-amber-200 to-orange-500 sm:h-2.5 sm:w-2.5"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -5,
              marginTop: -5,
              boxShadow: '0 0 10px rgba(255,180,100,0.9)',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <div
            key={`ring-${i}`}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            className="absolute rounded-full border-2 border-[#a5b4fc]/60"
            style={{
              width: `${(i + 1) * 18}%`,
              height: `${(i + 1) * 18}%`,
              maxWidth: 'min(92vw, 560px)',
              maxHeight: 'min(92vw, 560px)',
              transformOrigin: '50% 50%',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {Array.from({ length: DIAMOND_ORBIT }).map((_, i) => (
          <div
            key={`orbit-${i}`}
            ref={(el) => {
              orbitRefs.current[i] = el;
            }}
            className="absolute h-3 w-3 rounded-sm bg-gradient-to-br from-white to-orange-500 sm:h-4 sm:w-4"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-6px',
              marginTop: '-6px',
              transformOrigin: '50% 50%',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center px-4">
        <div
          ref={diamondRef}
          className="mb-4 flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36"
          style={{ transformOrigin: '50% 50%' }}
        >
          <div
            ref={glyphRef}
            className="flex h-full w-full items-center justify-center text-7xl font-black leading-none text-white sm:text-9xl"
            style={{
              transformOrigin: '50% 50%',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #ff6b35 55%, #c2410c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            &#9830;
          </div>
        </div>

        <div
          ref={titleRef}
          className="font-ancient text-5xl font-black tracking-[0.25em] text-orange-400 sm:text-8xl md:text-9xl"
          style={{
            textShadow: '0 0 28px rgba(255,107,53,0.5), 0 8px 0 rgba(0,0,0,0.35)',
          }}
        >
          HAYYA!
        </div>

        <div
          ref={subRef}
          className="mt-8 rounded-2xl border-2 border-orange-500/50 bg-gradient-to-r from-indigo-950/90 via-orange-950/80 to-indigo-950/90 px-8 py-3 sm:px-12 sm:py-10"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-ancient text-lg font-black uppercase italic tracking-[0.35em] text-orange-300 sm:text-2xl">
              {hayyaPlayer}
            </span>
            <span className="font-ancient text-sm font-bold uppercase tracking-[0.4em] text-orange-200/90 sm:text-lg">
              ymami
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
