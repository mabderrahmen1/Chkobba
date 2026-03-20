import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    if (!trimmed) { addToast('Please enter a nickname', 'error'); return; }
    if (trimmed.length < 2) { addToast('Nickname must be at least 2 characters', 'error'); return; }
    setNickname(trimmed);
    if (target === 'createRoom') {
      setIsSubmitting(true);
      socket.emit('create_room', { nickname: trimmed, targetScore: 21, maxPlayers: 2, gameType: 'chkobba' });
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
    return () => { socket.off('room_joined', handleSuccess); };
  }, [setIsSubmitting]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-full relative overflow-y-auto overflow-x-hidden bg-bg flex flex-col items-center p-4 sm:p-6 pb-20"
    >
      <div className="w-full max-w-md flex flex-col items-center mt-16 sm:mt-24">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text-primary tracking-tight mb-3">
            Chkobba
          </h1>
          <p className="text-text-secondary text-sm">
            Tunisian card game — play with friends online
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full bg-surface-1 p-7 sm:p-9 rounded-2xl border border-border"
        >
          <div className="space-y-6">
            <Input
              label="Nickname"
              placeholder="Enter your name..."
              value={nickname}
              onChange={setNicknameLocal}
              maxLength={15}
              icon={
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <div className="flex flex-col gap-2.5">
              <Button onClick={() => validateAndProceed('createRoom')} disabled={isSubmitting} size="lg" className="w-full">
                {isSubmitting ? 'Creating...' : 'Create Room'}
              </Button>
              <Button variant="secondary" onClick={() => validateAndProceed('joinRoom')} disabled={isSubmitting} size="lg" className="w-full">
                Join Room
              </Button>
            </div>

            {roomId && playerId && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-3 border-t border-border">
                <Button variant="ghost" onClick={handleRejoin} disabled={isSubmitting} className="w-full">
                  Return to Active Session
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* SEO Content */}
      <div className="w-full max-w-3xl mt-20 space-y-16 px-4" lang="fr">
        <section className="space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center">Comment jouer a la Chkobba ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: '01', title: 'La Distribution', desc: 'Chaque joueur recoit 3 cartes, et 4 cartes sont posees face visible sur la table. Le jeu se joue avec un jeu de 40 cartes traditionnel.' },
              { n: '02', title: 'La Capture', desc: 'A votre tour, jouez une carte. Si sa valeur correspond a une carte sur la table ou a la somme de plusieurs cartes, vous les capturez.' },
              { n: '03', title: 'La Chkobba', desc: 'Si vous capturez la derniere carte de la table, vous faites une "Chkobba" et gagnez un point supplementaire immediat.' },
            ].map((item) => (
              <div key={item.n} className="bg-surface-1 p-5 rounded-xl border border-border">
                <div className="text-accent font-semibold text-lg mb-2">{item.n}.</div>
                <h3 className="text-base text-text-primary font-semibold mb-1.5">{item.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-1 p-7 sm:p-10 rounded-2xl border border-border space-y-6">
          <h2 className="text-2xl font-bold text-text-primary">Regles : Le Decompte des Points</h2>
          <p className="text-text-secondary leading-relaxed text-sm">Pour gagner a la Chkobba en ligne, vous devez atteindre 21 points. Voici comment les points sont calcules :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: 'Carta (Les Cartes)', desc: "L'equipe qui a capture plus de 20 cartes gagne 1 point." },
              { title: 'Dinari (Les Carreaux)', desc: "L'equipe qui a plus de 5 cartes de carreau gagne 1 point." },
              { title: 'Bermila (Les Sept)', desc: "L'equipe qui a le plus de 7 gagne 1 point." },
              { title: 'Sabaa El Haya (7 de Carreau)', desc: 'Le joueur qui capture le 7 de carreau gagne automatiquement 1 point.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-semibold text-sm">1</div>
                <div>
                  <h4 className="text-text-primary font-semibold text-sm">{item.title}</h4>
                  <p className="text-text-secondary text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-bold text-text-primary text-center">FAQ</h2>
          <div className="space-y-3">
            {[
              { q: 'Peut-on jouer a la Chkobba en ligne gratuitement ?', a: 'Oui, sur chkobba.app, vous pouvez jouer gratuitement sans inscription et sans telechargement.' },
              { q: 'Comment jouer avec des amis a distance ?', a: "Il suffit de creer une table, de copier le code de la chambre et de l'envoyer a vos amis." },
              { q: 'Le jeu est-il disponible sur mobile ?', a: 'Absolument. Chkobba.app est une Web App optimisee pour tous les navigateurs mobiles.' },
              { q: 'Quelles sont les differences entre Chkobba et Scopa ?', a: 'La Chkobba est la variante tunisienne de la Scopa italienne. Les regles de base sont identiques, mais le decompte des points est specifique a la tradition tunisienne.' },
              { q: 'Peut-on jouer contre l\'ordinateur (Bot) ?', a: 'Oui, vous pouvez ajouter des bots a votre table pour vous entrainer.' },
            ].map((faq) => (
              <details key={faq.q} className="bg-surface-1 p-5 rounded-xl border border-border group cursor-pointer">
                <summary className="text-text-primary font-medium text-sm list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-text-tertiary group-open:rotate-180 transition-transform text-xs ml-2">&#9660;</span>
                </summary>
                <p className="mt-3 text-text-secondary text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </motion.section>
  );
}
