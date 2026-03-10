import { useState } from 'react';
import { useUIStore } from '../../../stores/useUIStore';
import { useAmbianceSound } from '../../../hooks/useAmbianceSound';
import { motion, AnimatePresence } from 'framer-motion';

export function AmbianceToggle() {
  const ambianceSoundOn = useUIStore((s) => s.ambianceSoundOn);
  const toggleAmbianceSound = useUIStore((s) => s.toggleAmbianceSound);
  const musicVolume = useUIStore((s) => s.musicVolume);
  const setMusicVolume = useUIStore((s) => s.setMusicVolume);
  const isWaitressVisible = useUIStore((s) => s.isWaitressVisible);
  const setWaitressVisible = useUIStore((s) => s.setWaitressVisible);
  const setWaitressStatus = useUIStore((s) => s.setWaitressStatus);
  const { playWaitressVoice } = useAmbianceSound();
  const [showSlider, setShowSlider] = useState(false);

  const handleToggleWaitress = () => {
    if (isWaitressVisible) {
      setWaitressVisible(false);
      setWaitressStatus('idle');
    } else {
      setWaitressVisible(true);
      setWaitressStatus('serving');
      playWaitressVoice();
      setTimeout(() => {
        setWaitressStatus('idle');
      }, 3000);
    }
  };

  const handleMusicClick = () => {
    if (!ambianceSoundOn) {
      toggleAmbianceSound();
      setShowSlider(true);
    } else {
      setShowSlider((prev) => !prev);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    if (vol === 0 && ambianceSoundOn) {
      toggleAmbianceSound();
    } else if (vol > 0 && !ambianceSoundOn) {
      toggleAmbianceSound();
    }
  };

  return (
    <div className="fixed top-3 left-3 z-[100] flex flex-col gap-1 items-start">
      {/* Toggle Waitress Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggleWaitress}
        className={`w-9 h-9 rounded-lg flex items-center justify-center text-base cursor-pointer transition-all border ${
          isWaitressVisible ? 'bg-brass border-brass shadow-glow-gold' : 'bg-wood border-brass/40 opacity-80'
        }`}
        title={isWaitressVisible ? "Dismiss Waitress" : "Call Waitress"}
      >
        <span>&#9749;</span>
      </motion.button>

      {/* Music button + slider */}
      <div className="flex items-center gap-1.5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMusicClick}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-base cursor-pointer transition-all border shrink-0 ${
            ambianceSoundOn
              ? 'bg-wood border-brass/40 shadow-glow-gold'
              : 'bg-surface-card border-brass/15 opacity-60'
          }`}
          title="Music"
        >
          <span className="text-sm" style={{ filter: ambianceSoundOn ? 'none' : 'grayscale(1) opacity(0.5)' }}>
            {ambianceSoundOn ? '\u{1F50A}' : '\u{1F507}'}
          </span>
        </motion.button>

        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden flex items-center"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={ambianceSoundOn ? musicVolume : 0}
                onChange={handleVolumeChange}
                className="w-20 sm:w-24 h-1.5 accent-brass cursor-pointer appearance-none rounded-full bg-wood-dark border border-brass/20"
                style={{
                  background: `linear-gradient(to right, #d4af37 0%, #d4af37 ${(ambianceSoundOn ? musicVolume : 0) * 100}%, #2e2018 ${(ambianceSoundOn ? musicVolume : 0) * 100}%, #2e2018 100%)`
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
