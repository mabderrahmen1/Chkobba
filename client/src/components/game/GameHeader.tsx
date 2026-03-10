import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { motion } from 'framer-motion';

export function GameHeader() {
  const gameState = useGameStore((s) => s.gameState);
  const roomId = useGameStore((s) => s.roomId);
  const addToast = useUIStore((s) => s.addToast);
  
  if (!gameState) return null;

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId).then(() => {
        addToast('Room code copied!', 'success');
      }).catch(() => {
        addToast('Failed to copy', 'error');
      });
    }
  };

  return (
    <div className="flex justify-between items-start w-full px-2 sm:px-4 md:px-6 py-1 sm:py-2 pt-2 sm:pt-4 relative z-20">

      {/* Left: Scores (Brass Plate) & Room Code */}
      <div className="flex gap-2 sm:gap-4 items-start">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex bg-wood-dark border-2 sm:border-[3px] border-wood-light rounded-lg shadow-theme-md overflow-hidden relative h-[44px] sm:h-[60px]"
        >
          <div className="absolute inset-0 bg-wood-pattern opacity-50" />

          <div className="px-2 sm:px-4 py-1 sm:py-2 border-r-2 sm:border-r-[3px] border-wood-light z-10 flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-brass-light font-ancient uppercase tracking-widest opacity-80">T1</span>
            <span className="text-lg sm:text-2xl font-ancient text-brass font-bold leading-none">{gameState.scores.team0}</span>
          </div>
          <div className="px-2 sm:px-4 py-1 sm:py-2 z-10 flex flex-col items-center">
            <span className="text-[8px] sm:text-[10px] text-brass-light font-ancient uppercase tracking-widest opacity-80">T2</span>
            <span className="text-lg sm:text-2xl font-ancient text-brass font-bold leading-none">{gameState.scores.team1}</span>
          </div>
        </motion.div>

        {/* Room Code Display - Hidden on very small screens */}
        {roomId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden sm:flex flex-col items-center cursor-pointer group"
            onClick={handleCopyCode}
            title="Click to copy room code"
          >
            <span className="text-[10px] text-brass-light font-ancient uppercase tracking-widest opacity-80">Room Code</span>
            <div className="bg-surface-card px-3 py-1 rounded border border-brass/30 text-cream font-mono tracking-widest text-sm group-hover:border-brass/80 transition-colors shadow-theme-sm">
              {roomId}
            </div>
          </motion.div>
        )}
      </div>

      {/* Center: Logo & Mascot */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 flex flex-col items-center">
        {/* The Wooden Arc Background for Logo */}
        <div className="bg-wood-dark px-4 sm:px-8 md:px-12 py-1.5 sm:py-3 rounded-b-2xl sm:rounded-b-3xl border-b-2 sm:border-b-[4px] border-x-2 sm:border-x-[4px] border-wood-light shadow-theme-lg relative flex items-center justify-center">
          <div className="absolute inset-0 bg-wood-pattern rounded-b-2xl sm:rounded-b-3xl opacity-50 pointer-events-none" />

          <div className="flex items-center gap-1.5 sm:gap-3 relative z-10">
             <span className="text-base sm:text-2xl" role="img" aria-label="palm">🌴</span>
             <h1 className="font-ancient text-lg sm:text-2xl md:text-3xl font-bold text-brass tracking-wider" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0px rgba(255,255,255,0.2)' }}>
               Chkobix
             </h1>
             <span className="text-base sm:text-2xl text-brass" role="img" aria-label="cards">🎴</span>
          </div>
        </div>

        {/* Mascot - Hidden on small screens */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mt-1 sm:mt-2 hidden sm:block"
        >
          <div className="w-10 h-10 sm:w-16 sm:h-16 bg-surface-card rounded-full shadow-theme-md border-2 border-brass-dark flex items-center justify-center text-xl sm:text-3xl">
            🐿️
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-4 sm:h-6 bg-gradient-to-b from-brass to-transparent opacity-50" />
        </motion.div>
      </div>

      {/* Right: Round Info (Brass Plate) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-wood-dark border-2 sm:border-[3px] border-wood-light rounded-lg shadow-theme-md relative overflow-hidden flex flex-col items-center px-3 sm:px-6 py-1 sm:py-2 h-[44px] sm:h-[60px] justify-center"
      >
        <div className="absolute inset-0 bg-wood-pattern opacity-50 pointer-events-none" />
        <span className="text-[8px] sm:text-[10px] text-brass-light font-ancient uppercase tracking-widest relative z-10 opacity-80">Round</span>
        <span className="text-base sm:text-xl font-ancient text-brass font-bold leading-none relative z-10">{gameState.roundNumber}</span>
        <span className="text-[8px] sm:text-[10px] text-brass-light font-ancient relative z-10 mt-0.5 sm:mt-1 opacity-70">Goal: {gameState.targetScore}</span>
      </motion.div>

    </div>
  );
}
