import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/useChatStore';
import { socket } from '../../lib/socket';

const TUNISIAN_QUICK_CHATS = [
  "Hayya barcha! 🔥",
  "Chkobba lik! 👑",
  "Zeyed m3ak 👏",
  "Alab ya m3allem!",
  "Rakkaz m3aya 🧐",
  "Malla zhar 🍀",
  "Ta7chaet 😂"
];

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const isOpen = useChatStore((s) => s.isOpen);
  const messages = useChatStore((s) => s.messages);
  const unreadCount = useChatStore((s) => s.unreadCount);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(messages.length);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current && !isOpen) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } catch {}
    }
    prevMessageCount.current = messages.length;
  }, [messages.length, isOpen]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit('chat_message', { message: trimmed });
    setMessage('');
  };

  const scrollQuickChat = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 150;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="fixed bottom-14 left-4 z-50 flex flex-col items-start pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -20, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex flex-col w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)] max-h-[45vh] bg-black/40 backdrop-blur-md rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] mb-3 overflow-hidden border border-white/10 pointer-events-auto"
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 min-h-[150px] custom-scrollbar mask-image-bottom">
              {messages.length === 0 && (
                <p className="text-white/30 text-xs text-center italic font-body mt-auto mb-auto">No messages yet...</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="text-[13px] leading-snug break-words drop-shadow-md">
                  {msg.isSystem ? (
                    <span className="text-brass/70 italic text-[11px] uppercase tracking-wider block text-center my-1">
                      — {msg.message} —
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-2 hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors">
                      <span className="font-ancient font-extrabold text-brass-light shrink-0 text-[11px] uppercase tracking-widest">
                        {msg.playerNickname}:
                      </span>
                      <span className="text-cream/90 font-body">
                        {msg.message}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chat Bar with Arrows */}
            <div className="relative bg-black/60 border-t border-white/5 flex items-center group/qc">
              <button 
                onClick={() => scrollQuickChat('left')}
                className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-black/80 to-transparent text-brass-light opacity-0 group-hover/qc:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-2 px-6 py-2.5 custom-scrollbar-none scroll-smooth"
              >
                {TUNISIAN_QUICK_CHATS.map((qc, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qc)}
                    className="shrink-0 px-4 py-1.5 bg-brass/10 hover:bg-brass/20 text-brass-light hover:text-white text-[11px] font-ancient font-bold rounded-full border border-brass/30 transition-all whitespace-nowrap active:scale-95 shadow-lg"
                  >
                    {qc}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => scrollQuickChat('right')}
                className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-black/80 to-transparent text-brass-light opacity-0 group-hover/qc:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Input Area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(message); }} 
              className="flex bg-black/80 border-t border-brass/20 focus-within:border-brass/50 transition-colors"
            >
              <span className="pl-3 py-2 text-brass/50 font-bold">ALL</span>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Press Enter to chat..."
                maxLength={100}
                className="flex-1 px-2 py-2 bg-transparent text-cream text-[13px] font-body focus:outline-none placeholder:text-white/20"
                autoComplete="off"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleChat}
        className="pointer-events-auto relative px-5 py-2.5 rounded-t-xl rounded-b-sm bg-black/60 backdrop-blur-xl border border-white/10 text-cream/90 hover:text-white text-[11px] font-ancient uppercase tracking-[0.2em] cursor-pointer shadow-lg transition-all hover:bg-black/80 flex items-center gap-2 group mt-2"
      >
        <span className="font-bold">Chat</span>
        <svg className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>

        {unreadCount > 0 && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border border-black shadow-glow-red"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>
    </div>
  );
}
