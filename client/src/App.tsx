import { useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { useUIStore } from './stores/useUIStore';
import { ChatPanel } from './components/layout/ChatPanel';
import { Toast } from './components/ui/Toast';
import { LandingScreen } from './components/screens/LandingScreen';
import { CreateRoomScreen } from './components/screens/CreateRoomScreen';
import { JoinRoomScreen } from './components/screens/JoinRoomScreen';
import { LobbyScreen } from './components/screens/LobbyScreen';
import { GameScreen } from './components/screens/GameScreen';
import { AnimatePresence } from 'framer-motion';
import { trackPageView } from './lib/analytics';

export default function App() {
  useSocket();
  const screen = useUIStore((s) => s.screen);

  useEffect(() => {
    trackPageView(screen);
  }, [screen]);

  return (
    <>
      <div id="app-chrome" className="h-[100dvh] max-h-[100dvh] min-h-0 w-full relative overflow-hidden bg-black">
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
          <video
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover opacity-40 ${
              screen === 'landing' ? 'landing-bg-ken-burns' : 'scale-105'
            }`}
          >
            <source src="/cafe.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="fixed inset-0 z-0 bg-dark-gradient opacity-60" />

        <main className="relative z-10 h-full min-h-0">
          <AnimatePresence mode="wait">
            {screen === 'landing' && <LandingScreen key="landing" />}
            {screen === 'createRoom' && <CreateRoomScreen key="createRoom" />}
            {screen === 'joinRoom' && <JoinRoomScreen key="joinRoom" />}
            {screen === 'lobby' && <LobbyScreen key="lobby" />}
            {screen === 'game' && <GameScreen key="game" />}
          </AnimatePresence>
        </main>
        <Toast />
      </div>
      {screen === 'game' && <ChatPanel />}
    </>
  );
}
