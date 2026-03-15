import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../stores/useUIStore';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

const FIRST_VIDEO_ID = 'd7eikm5KZ9w';
const PLAYLIST_ID = 'RDd7eikm5KZ9w';

export function VintageRadio() {
  const [player, setPlayer] = useState<any>(null);
  const [isOn, setIsOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [volume, setVolume] = useState(35);
  const [tuningAngle, setTuningAngle] = useState(0);
  const [volumeAngle, setVolumeAngle] = useState(94); // 35% of 270
  const [apiReady, setApiReady] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [powerGlow, setPowerGlow] = useState(false);
  const playerInitRef = useRef(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  // Waitress
  const isWaitressVisible = useUIStore((s) => s.isWaitressVisible);
  const setWaitressVisible = useUIStore((s) => s.setWaitressVisible);
  const setWaitressStatus = useUIStore((s) => s.setWaitressStatus);
  const { playWaitressVoice } = useAmbianceSound();

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }
    const exists = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!exists) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      setApiReady(true);
    };
  }, []);

  // Init player once API ready
  useEffect(() => {
    if (!apiReady || playerInitRef.current) return;
    playerInitRef.current = true;

    new window.YT.Player('yt-radio-player', {
      height: '1',
      width: '1',
      videoId: FIRST_VIDEO_ID,
      playerVars: {
        listType: 'playlist',
        list: PLAYLIST_ID,
        autoplay: 0,
        loop: 1,
        controls: 0,
      },
      events: {
        onReady: (e: any) => {
          e.target.setVolume(volume);
          setPlayer(e.target);
        },
        onStateChange: (e: any) => {
          const YT = window.YT;
          if (e.data === YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            const data = e.target.getVideoData();
            setCurrentTitle(data?.title || 'Unknown Track');
          } else if (e.data === YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (e.data === YT.PlayerState.ENDED) {
            // Auto-next
            e.target.nextVideo();
          }
        },
      },
    });
  }, [apiReady]);

  // Check if title needs scrolling
  useEffect(() => {
    if (titleRef.current) {
      setNeedsScroll(titleRef.current.scrollWidth > titleRef.current.clientWidth);
    }
  }, [currentTitle]);

  // Power toggle
  const togglePower = useCallback(() => {
    if (!player) return;
    if (isOn) {
      player.pauseVideo();
      setIsOn(false);
      setIsPlaying(false);
      setPowerGlow(false);
    } else {
      player.playVideo();
      setIsOn(true);
      setPowerGlow(true);
    }
  }, [player, isOn]);

  // Play/Pause
  const togglePlay = useCallback(() => {
    if (!player || !isOn) {
      togglePower();
      return;
    }
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [player, isOn, isPlaying, togglePower]);

  // Next/Prev
  const nextTrack = useCallback(() => {
    if (!player) return;
    if (!isOn) { togglePower(); return; }
    player.nextVideo();
    setTuningAngle((a) => a + 30);
  }, [player, isOn, togglePower]);

  const prevTrack = useCallback(() => {
    if (!player) return;
    if (!isOn) { togglePower(); return; }
    player.previousVideo();
    setTuningAngle((a) => a - 30);
  }, [player, isOn, togglePower]);

  // Volume
  const adjustVolume = useCallback(
    (delta: number) => {
      const newVol = Math.max(0, Math.min(100, volume + delta));
      setVolume(newVol);
      setVolumeAngle(newVol * 2.7);
      if (player) player.setVolume(newVol);
    },
    [player, volume]
  );

  const handleVolumeWheel = useCallback(
    (e: React.WheelEvent) => {
      e.stopPropagation();
      adjustVolume(e.deltaY < 0 ? 5 : -5);
    },
    [adjustVolume]
  );

  // Waitress toggle
  const handleWaitress = useCallback(() => {
    if (isWaitressVisible) {
      setWaitressVisible(false);
      setWaitressStatus('idle');
    } else {
      setWaitressVisible(true);
      setWaitressStatus('serving');
      playWaitressVoice();
      setTimeout(() => setWaitressStatus('idle'), 3000);
    }
  }, [isWaitressVisible, setWaitressVisible, setWaitressStatus, playWaitressVoice]);

  // Volume knob drag
  const volumeKnobRef = useRef<HTMLDivElement>(null);
  const handleVolumeKnobDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const knob = volumeKnobRef.current;
      if (!knob) return;
      const rect = knob.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const clientY = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
        let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
        // Remap: -135 (top-left) = 0%, 135 (bottom-left) = 100%
        angle = ((angle + 225) % 360);
        if (angle > 270) angle = angle > 315 ? 0 : 270;
        const vol = Math.round((angle / 270) * 100);
        setVolume(vol);
        setVolumeAngle(angle);
        if (player) player.setVolume(vol);
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('touchend', onUp);
    },
    [player]
  );

  // Tuning knob drag
  const tuningKnobRef = useRef<HTMLDivElement>(null);
  const tuningAccum = useRef(0);
  const handleTuningKnobDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const knob = tuningKnobRef.current;
      if (!knob) return;
      const rect = knob.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let lastAngle: number | null = null;
      tuningAccum.current = 0;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
        const clientY = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
        const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
        if (lastAngle !== null) {
          let delta = angle - lastAngle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          tuningAccum.current += delta;
          setTuningAngle((a) => a + delta);
          // Every 60 degrees of rotation, change track
          if (tuningAccum.current > 60) {
            tuningAccum.current = 0;
            if (player && isOn) player.nextVideo();
          } else if (tuningAccum.current < -60) {
            tuningAccum.current = 0;
            if (player && isOn) player.previousVideo();
          }
        }
        lastAngle = angle;
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('touchend', onUp);
    },
    [player, isOn]
  );

  // ─── STYLES ────────────────────────────────────────────────
  const woodGradient =
    'linear-gradient(160deg, #a0724a 0%, #8b5e3c 15%, #6b3a2a 40%, #5c3018 60%, #7a4e30 80%, #6b3a2a 100%)';
  const woodShadow =
    '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,220,180,0.15), inset 0 -1px 1px rgba(0,0,0,0.3)';
  const brassGradient = 'radial-gradient(ellipse at 35% 30%, #f0d875 0%, #d4af37 40%, #aa8033 70%, #8b6914 100%)';
  const brassShadow = '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3)';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const smallKnobSize = isMobile ? 14 : 18;
  const bigKnobSize = isMobile ? 30 : 40;

  const fabricPattern: React.CSSProperties = {
    backgroundColor: '#4a3828',
    backgroundImage: [
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)',
      'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 3px)',
    ].join(', '),
    borderRadius: '6px',
    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.6), inset 0 0 3px rgba(0,0,0,0.3)',
    border: '2px solid #3a2515',
  };

  const screenStyle: React.CSSProperties = {
    background: isOn
      ? 'linear-gradient(180deg, #1a1a0a 0%, #0d0d04 100%)'
      : 'linear-gradient(180deg, #0a0a04 0%, #050502 100%)',
    borderRadius: '4px',
    border: '1.5px solid #3a3020',
    boxShadow: isOn
      ? 'inset 0 1px 6px rgba(0,0,0,0.8), 0 0 8px rgba(212,175,55,0.15)'
      : 'inset 0 1px 6px rgba(0,0,0,0.9)',
    overflow: 'hidden',
    position: 'relative' as const,
  };

  if (isMinimized) {
    return (
      <>
        {/* Hidden YouTube player */}
        <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
          <div id="yt-radio-player" />
        </div>
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className="fixed top-20 left-2 sm:top-24 sm:left-3 z-50 cursor-pointer"
          title="Open Radio"
          style={{
            width: isMobile ? 36 : 48,
            height: isMobile ? 36 : 48,
            borderRadius: '10px',
            background: woodGradient,
            boxShadow: woodShadow,
            border: '2px solid #8b6914',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: isMobile ? 16 : 22 }}>📻</span>
          {isOn && (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 6px #4ade80',
              }}
            />
          )}
        </motion.button>
      </>
    );
  }

  return (
    <>
      {/* Hidden YouTube player */}
      <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <div id="yt-radio-player" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="fixed top-4 left-4 z-50 select-none hidden md:block"
        style={{ width: isMobile ? 190 : 250 }}
      >
        {/* ─── RADIO BODY ─── */}
        <div
          style={{
            background: woodGradient,
            borderRadius: isMobile ? '10px' : '14px',
            boxShadow: woodShadow,
            padding: '0',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* Wood grain overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              backgroundImage:
                'repeating-linear-gradient(85deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px)',
              pointerEvents: 'none',
            }}
          />
          {/* Polished sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background:
                'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
              pointerEvents: 'none',
            }}
          />

          {/* ─── HANDLE ─── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
              top: isMobile ? -4 : -6,
              zIndex: 2,
              cursor: 'pointer',
            }}
            onClick={() => setIsMinimized(true)}
            title="Minimize radio"
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
              <div
                style={{
                  width: isMobile ? 7 : 10,
                  height: isMobile ? 12 : 18,
                  borderLeft: `${isMobile ? 2 : 3}px solid #999`,
                  borderTop: `${isMobile ? 2 : 3}px solid #aaa`,
                  borderRadius: '4px 0 0 0',
                  background: 'transparent',
                }}
              />
              <div
                style={{
                  width: isMobile ? 45 : 70,
                  height: isMobile ? 5 : 8,
                  background: 'linear-gradient(180deg, #ccc 0%, #888 40%, #aaa 60%, #999 100%)',
                  borderRadius: '4px 4px 0 0',
                  boxShadow: '0 -2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.4)',
                  marginBottom: isMobile ? 6 : 10,
                }}
              />
              <div
                style={{
                  width: isMobile ? 7 : 10,
                  height: isMobile ? 12 : 18,
                  borderRight: `${isMobile ? 2 : 3}px solid #999`,
                  borderTop: `${isMobile ? 2 : 3}px solid #aaa`,
                  borderRadius: '0 4px 0 0',
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          {/* ─── INNER FACE ─── */}
          <div style={{ padding: isMobile ? '0 8px 8px 8px' : '0 12px 10px 12px' }}>
            {/* ─── TITLE SCREEN ─── */}
            <div style={{ ...screenStyle, height: isMobile ? 22 : 28, marginBottom: isMobile ? 6 : 8, display: 'flex', alignItems: 'center', padding: isMobile ? '0 6px' : '0 8px' }}>
              {isOn && currentTitle ? (
                <div
                  ref={titleRef}
                  style={{
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      animation: needsScroll ? 'radio-scroll-title 12s linear infinite' : 'none',
                      fontFamily: '"Courier New", "Playfair Display", serif',
                      fontSize: isMobile ? '9px' : '11px',
                      fontWeight: 700,
                      color: '#d4af37',
                      textShadow: '0 0 6px rgba(212,175,55,0.5)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    ♫ {currentTitle}
                  </div>
                </div>
              ) : isOn ? (
                <div
                  style={{
                    fontFamily: '"Courier New", serif',
                    fontSize: isMobile ? 8 : 10,
                    color: '#8b7340',
                    letterSpacing: 1,
                  }}
                >
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    TUNING...
                  </motion.span>
                </div>
              ) : (
                <div
                  style={{
                    fontFamily: '"Courier New", serif',
                    fontSize: isMobile ? 7 : 9,
                    color: '#3a3020',
                    letterSpacing: 1,
                  }}
                >
                  ── OFF ──
                </div>
              )}
              {/* Screen reflection */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
                  pointerEvents: 'none',
                  borderRadius: '4px 4px 0 0',
                }}
              />
            </div>

            {/* ─── SPEAKER AREA WITH FLANKING KNOBS ─── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6, marginBottom: isMobile ? 6 : 8 }}>
              {/* LEFT BIG KNOB — POWER */}
              <div
                onClick={togglePower}
                title={isOn ? 'Turn OFF' : 'Turn ON'}
                style={{
                  width: bigKnobSize,
                  height: bigKnobSize,
                  minWidth: bigKnobSize,
                  borderRadius: '50%',
                  background: brassGradient,
                  boxShadow: brassShadow,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'transform 0.3s ease',
                  transform: `rotate(${isOn ? 90 : 0}deg)`,
                }}
              >
                {/* Knob indicator line */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: 10,
                    background: '#5c3018',
                    borderRadius: 2,
                  }}
                />
                {/* Center Ring & LED */}
                <div
                  style={{
                    width: bigKnobSize - 8,
                    height: bigKnobSize - 8,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.2)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 6 : 8,
                      height: isMobile ? 6 : 8,
                      borderRadius: '50%',
                      background: isOn ? '#4ade80' : '#ef4444',
                      boxShadow: isOn ? '0 0 8px #4ade80' : 'inset 0 1px 2px rgba(0,0,0,0.6)',
                      transition: 'all 0.3s',
                    }}
                  />
                </div>
              </div>

              {/* SPEAKER GRILLE */}
              <div
                style={{
                  ...fabricPattern,
                  flex: 1,
                  height: isMobile ? 50 : 70,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={togglePlay}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {/* Decorative horizontal bars on speaker */}
                {(isMobile ? [0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5, 6]).map((i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: isMobile ? 5 : 8,
                      right: isMobile ? 5 : 8,
                      top: (isMobile ? 5 : 8) + i * (isMobile ? 8 : 9),
                      height: 1,
                      background: 'rgba(139,105,20,0.12)',
                    }}
                  />
                ))}
                {/* Play/Pause overlay icon (subtle) */}
                <AnimatePresence>
                  {!isPlaying && isOn && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: isMobile ? 18 : 24, color: '#d4af37' }}
                    >
                      ▶
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Sound wave animation when playing */}
                {isPlaying && (
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {(isMobile ? [0, 1, 2, 3] : [0, 1, 2, 3, 4]).map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: isMobile ? [3, 10 + Math.random() * 8, 3] : [4, 14 + Math.random() * 10, 4] }}
                        transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
                        style={{
                          width: 3,
                          background: 'rgba(212,175,55,0.2)',
                          borderRadius: 2,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT BIG KNOB — VOLUME */}
              <div
                ref={volumeKnobRef}
                onMouseDown={handleVolumeKnobDown}
                onTouchStart={handleVolumeKnobDown}
                onWheel={handleVolumeWheel}
                title={`Volume: ${volume}% — drag or scroll`}
                style={{
                  width: bigKnobSize,
                  height: bigKnobSize,
                  minWidth: bigKnobSize,
                  borderRadius: '50%',
                  background: brassGradient,
                  boxShadow: brassShadow,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'transform 0.15s ease',
                  transform: `rotate(${volumeAngle - 135}deg)`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 2,
                    height: 10,
                    background: '#5c3018',
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: bigKnobSize - 8,
                    height: bigKnobSize - 8,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.2)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)',
                  }}
                />
              </div>
            </div>

            {/* ─── SMALL KNOBS ROW (3 BUTTONS) ─── */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 12 : 20, alignItems: 'center' }}>
              {/* Prev knob */}
              <motion.div
                whileHover={{ scale: 1.15, rotate: -20 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTrack}
                title="Previous track"
                style={{
                  width: smallKnobSize,
                  height: smallKnobSize,
                  borderRadius: '50%',
                  background: brassGradient,
                  boxShadow: brassShadow,
                  cursor: 'pointer',
                }}
              />

              {/* Next knob */}
              <motion.div
                whileHover={{ scale: 1.15, rotate: 20 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTrack}
                title="Next track"
                style={{
                  width: smallKnobSize,
                  height: smallKnobSize,
                  borderRadius: '50%',
                  background: brassGradient,
                  boxShadow: brassShadow,
                  cursor: 'pointer',
                }}
              />

              {/* Waitress knob */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWaitress}
                title={isWaitressVisible ? 'Dismiss waitress' : 'Call waitress'}
                style={{
                  width: smallKnobSize,
                  height: smallKnobSize,
                  borderRadius: '50%',
                  background: isWaitressVisible
                    ? 'radial-gradient(ellipse at 35% 30%, #f0d875 0%, #c9a84c 50%, #aa8033 100%)'
                    : brassGradient,
                  boxShadow: isWaitressVisible
                    ? '0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(212,175,55,0.4), inset 0 1px 1px rgba(255,255,255,0.3)'
                    : brassShadow,
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* ─── DECORATIVE BOTTOM TRIM ─── */}
            <div
              style={{
                marginTop: isMobile ? 4 : 6,
                height: isMobile ? 2 : 3,
                background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2) 20%, rgba(212,175,55,0.3) 50%, rgba(212,175,55,0.2) 80%, transparent)',
                borderRadius: 2,
              }}
            />

            {/* ─── FEET ─── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: isMobile ? '0 14px' : '0 18px', marginTop: 2 }}>
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: isMobile ? 10 : 14,
                    height: isMobile ? 3 : 4,
                    background: 'linear-gradient(180deg, #5c3018, #3a1a08)',
                    borderRadius: '0 0 4px 4px',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.4)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─── LABELS (subtle, beneath radio) ─── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: isMobile ? '1px 14px 0' : '2px 20px 0',
            fontFamily: '"Courier New", serif',
            fontSize: isMobile ? 6 : 7,
            color: 'rgba(212,175,55,0.25)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            userSelect: 'none',
          }}
        >
          <span>Pwr</span>
          <span>Vol {volume}%</span>
        </div>
      </motion.div>
    </>
  );
}
