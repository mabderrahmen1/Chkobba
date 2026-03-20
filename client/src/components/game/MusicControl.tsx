import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

const FIRST_VIDEO_ID = 'v7QJlY_WRBs';
const PLAYLIST_ID = 'RDv7QJlY_WRBs';

export function MusicControl() {
  const [player, setPlayer] = useState<any>(null);
  const [isOn, setIsOn] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const playerInitRef = useRef(false);

  useEffect(() => {
    if (window.YT && window.YT.Player) { setApiReady(true); return; }
    const exists = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!exists) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); setApiReady(true); };
  }, []);

  useEffect(() => {
    if (!apiReady || playerInitRef.current) return;
    playerInitRef.current = true;
    new window.YT.Player('yt-music-player', {
      height: '1', width: '1',
      videoId: FIRST_VIDEO_ID,
      playerVars: { listType: 'playlist', list: PLAYLIST_ID, autoplay: 0, loop: 1, controls: 0 },
      events: {
        onReady: (e: any) => { e.target.setVolume(35); setPlayer(e.target); },
        onStateChange: (e: any) => {
          if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          else if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
          else if (e.data === window.YT.PlayerState.ENDED) e.target.nextVideo();
        },
      },
    });
  }, [apiReady]);

  const togglePlay = useCallback(() => {
    if (!player) return;
    if (isOn) { player.pauseVideo(); setIsOn(false); setIsPlaying(false); }
    else { player.playVideo(); setIsOn(true); }
  }, [player, isOn]);

  const nextTrack = useCallback(() => {
    if (!player) return;
    if (!isOn) { togglePlay(); return; }
    player.nextVideo();
  }, [player, isOn, togglePlay]);

  return (
    <>
      <div style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
        <div id="yt-music-player" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-16 z-50 flex items-center gap-1 bg-surface-1 border border-border rounded-full px-1 py-1 shadow-sm"
      >
        <button
          onClick={togglePlay}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          title={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <button
          onClick={nextTrack}
          className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Next track"
          title="Next track"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20" /><rect x="15" y="4" width="4" height="16" /></svg>
        </button>
        {isOn && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5"
          />
        )}
      </motion.div>
    </>
  );
}
