import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore, type Screen } from '../../stores/useUIStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { socket } from '../../lib/socket';

export function LandingScreen() {
  const [nickname, setNicknameLocal] = useState(useGameStore.getState().nickname);
  const { roomId, playerId } = useGameStore((s) => ({ roomId: s.roomId, playerId: s.playerId }));
  const setNickname = useGameStore((s) => s.setNickname);
  const setScreen = useUIStore((s) => s.setScreen);
  const addToast = useUIStore((s) => s.addToast);
  const isSubmitting = useUIStore((s) => s.isSubmitting);
  const setIsSubmitting = useUIStore((s) => s.setIsSubmitting);

  const validateAndProceed = (target: Screen) => {
    if (isSubmitting) return;
    
    const trimmed = nickname.trim();
    if (!trimmed) {
      addToast('Please enter a nickname', 'error');
      return;
    }
    if (trimmed.length < 2) {
      addToast('Nickname must be at least 2 characters', 'error');
      return;
    }
    setNickname(trimmed);
    
    if (target === 'createRoom') {
      setIsSubmitting(true);
      socket.emit('create_room', { 
        nickname: trimmed,
        targetScore: 21,
        maxPlayers: 2,
        gameType: 'chkobba'
      });
    } else {
      setScreen(target);
    }
  };

  const handleRejoin = () => {
    if (roomId && playerId && !isSubmitting) {
      setIsSubmitting(true);
      socket.emit('rejoin_game', { roomId, playerId });
    }
  };

  useEffect(() => {
    const handleSuccess = () => setIsSubmitting(false);
    socket.on('room_joined', handleSuccess);
    return () => {
      socket.off('room_joined', handleSuccess);
    };
  }, [setIsSubmitting]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full relative overflow-y-auto overflow-x-hidden bg-transparent flex flex-col items-center p-4 sm:p-6 pb-20"
    >
      {/* Decorative Coffee Steam Particles */}
      <div className="absolute bottom-0 left-1/4 z-10 pointer-events-none opacity-20">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="smoke-particle animate-smoke"
            style={{
              '--dur': `${4 + i}s`,
              '--delay': `${i * 0.8}s`,
              left: `${i * 20}px`,
              width: `${20 + i * 10}px`,
              height: `${20 + i * 10}px`,
            } as any}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center mt-12 sm:mt-20">
        {/* Logo / Title Area */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <h1 className="text-6xl sm:text-8xl font-black text-metallic-gold tracking-tighter mb-2">
            CHKOBBA
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-brass/50" />
            <p className="text-brass font-ancient text-xs sm:text-sm tracking-[0.4em] font-bold uppercase">
              The Café Experience
            </p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-brass/50" />
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full glass-panel-heavy p-8 sm:p-10 rounded-[2.5rem] border-brass/20 relative overflow-hidden"
        >
          {/* Subtle reflection overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <Input
              label="Player Nickname"
              placeholder="Enter your name..."
              value={nickname}
              onChange={setNicknameLocal}
              maxLength={15}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="flex flex-col gap-4 pt-2">
              <Button 
                onClick={() => validateAndProceed('createRoom')} 
                disabled={isSubmitting} 
                variant="brass" 
                size="xl" 
                className="w-full"
              >
                {isSubmitting ? 'Entering...' : 'Create Table'}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => validateAndProceed('joinRoom')} 
                disabled={isSubmitting} 
                size="lg" 
                className="w-full"
              >
                Join Private Room
              </Button>
            </div>

            {roomId && playerId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-4 border-t border-white/5"
              >
                <Button 
                  variant="secondary" 
                  onClick={handleRejoin} 
                  disabled={isSubmitting} 
                  className="w-full py-4 rounded-2xl"
                >
                  Return to Active Session
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-cream/30 text-[10px] uppercase tracking-[0.2em] font-ancient"
        >
          Mediterranean Card Games • Est. 2024
        </motion.p>
      </div>

      {/* --- SEO CONTENT SECTIONS --- */}
      <div className="w-full max-w-4xl mt-24 space-y-20 relative z-10 px-4">
        
        {/* Comment jouer à la Chkobba */}
        <section className="space-y-6">
          <h2 className="text-3xl sm:text-4xl font-ancient text-brass text-center">Comment jouer à la Chkobba ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel-heavy p-6 rounded-2xl border-brass/10">
              <div className="text-brass font-ancient text-2xl mb-3">01.</div>
              <h3 className="text-xl text-cream font-bold mb-2">La Distribution</h3>
              <p className="text-cream/60 text-sm leading-relaxed">Chaque joueur reçoit 3 cartes, et 4 cartes sont posées face visible sur la table. Le jeu se joue avec un jeu de 40 cartes traditionnel.</p>
            </div>
            <div className="glass-panel-heavy p-6 rounded-2xl border-brass/10">
              <div className="text-brass font-ancient text-2xl mb-3">02.</div>
              <h3 className="text-xl text-cream font-bold mb-2">La Capture</h3>
              <p className="text-cream/60 text-sm leading-relaxed">À votre tour, jouez une carte. Si sa valeur correspond à une carte sur la table ou à la somme de plusieurs cartes, vous les capturez.</p>
            </div>
            <div className="glass-panel-heavy p-6 rounded-2xl border-brass/10">
              <div className="text-brass font-ancient text-2xl mb-3">03.</div>
              <h3 className="text-xl text-cream font-bold mb-2">La Chkobba</h3>
              <p className="text-cream/60 text-sm leading-relaxed">Si vous capturez la dernière carte de la table, vous faites une "Chkobba" et gagnez un point supplémentaire immédiat.</p>
            </div>
          </div>
        </section>

        {/* Règles de la Chkobba */}
        <section className="glass-panel-heavy p-8 sm:p-12 rounded-[3rem] border-brass/10 space-y-8">
          <h2 className="text-3xl font-ancient text-brass">Règles de la Chkobba : Le Décompte des Points</h2>
          <p className="text-cream/70 leading-relaxed">Pour gagner à la Chkobba en ligne sur chkobba.app, vous devez atteindre 21 points. Voici comment les points sont calculés à la fin de chaque manche :</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 text-brass font-bold">1</div>
              <div>
                <h4 className="text-cream font-bold">Carta (Les Cartes)</h4>
                <p className="text-cream/50 text-sm">L'équipe qui a capturé plus de 20 cartes gagne 1 point.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 text-brass font-bold">1</div>
              <div>
                <h4 className="text-cream font-bold">Dinari (Les Carreaux)</h4>
                <p className="text-cream/50 text-sm">L'équipe qui a plus de 5 cartes de carreau gagne 1 point.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 text-brass font-bold">1</div>
              <div>
                <h4 className="text-cream font-bold">Bermila (Les Sept)</h4>
                <p className="text-cream/50 text-sm">L'équipe qui a le plus de 7 (ou de 6 en cas d'égalité) gagne 1 point.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center flex-shrink-0 text-brass font-bold">1</div>
              <div>
                <h4 className="text-cream font-bold">Sabaa El Haya (7 de Carreau)</h4>
                <p className="text-cream/50 text-sm">Le joueur qui capture le 7 de carreau gagne automatiquement 1 point.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-ancient text-brass text-center">Foire Aux Questions (FAQ)</h2>
          <div className="space-y-4">
            <details className="glass-panel-heavy p-6 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold list-none flex justify-between items-center">
                Peut-on jouer à la Chkobba en ligne gratuitement ?
                <span className="text-brass group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-cream/60 text-sm">Oui, sur chkobba.app, vous pouvez jouer gratuitement sans inscription et sans téléchargement.</p>
            </details>
            <details className="glass-panel-heavy p-6 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold list-none flex justify-between items-center">
                Comment jouer avec des amis à distance ?
                <span className="text-brass group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-cream/60 text-sm">Il suffit de créer une table, de copier le code de la chambre et de l'envoyer à vos amis pour qu'ils rejoignent votre partie en temps réel.</p>
            </details>
            <details className="glass-panel-heavy p-6 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold list-none flex justify-between items-center">
                Le jeu est-il disponible sur mobile ?
                <span className="text-brass group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-cream/60 text-sm">Absolument. Chkobba.app est une Web App optimisée pour tous les navigateurs mobiles, iPhone et Android.</p>
            </details>
            <details className="glass-panel-heavy p-6 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold list-none flex justify-between items-center">
                Quelles sont les différences entre Chkobba et Scopa ?
                <span className="text-brass group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-cream/60 text-sm">La Chkobba est la variante tunisienne de la Scopa italienne. Les règles de base sont identiques, mais le décompte des points (Carta, Dinari, Bermila) est spécifique à la tradition tunisienne.</p>
            </details>
            <details className="glass-panel-heavy p-6 rounded-2xl border-brass/10 group cursor-pointer">
              <summary className="text-cream font-bold list-none flex justify-between items-center">
                Peut-on jouer contre l'ordinateur (Bot) ?
                <span className="text-brass group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-cream/60 text-sm">Oui, vous pouvez ajouter des bots à votre table pour vous entraîner ou compléter une partie si vous êtes seul.</p>
            </details>
          </div>
        </section>

      </div>
    </motion.section>
  );
}
