import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/useChatStore';
import { socket } from '../../lib/socket';

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const isOpen = useChatStore((s) => s.isOpen);
  const messages = useChatStore((s) => s.messages);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    socket.emit('chat_message', { message: trimmed });
    setMessage('');
  };

  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="flex flex-col w-[260px] sm:w-[300px] max-w-[calc(100vw-1rem)] max-h-[300px] sm:max-h-[400px] bg-surface-alt rounded-xl shadow-2xl mb-2 overflow-hidden border border-brass/15"
          >
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-[200px]">
              {messages.length === 0 && (
                <p className="text-foreground-muted text-sm text-center italic font-body">No messages yet</p>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-0.5 p-2 rounded-lg text-sm ${
                    msg.isSystem
                      ? 'text-cream-dark/50 italic text-center font-body'
                      : 'bg-surface-card border border-brass/5'
                  }`}
                >
                  {msg.isSystem ? (
                    <span>{msg.message}</span>
                  ) : (
                    <>
                      <span className="font-ancient font-semibold text-brass text-xs">
                        {msg.playerNickname}
                      </span>
                      <span className="text-cream font-body break-words">{msg.message}</span>
                      <span className="text-[10px] text-foreground-muted text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-brass/10">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 px-3 py-2 bg-surface-card border border-brass/15 rounded-lg text-cream text-sm font-body focus:outline-none focus:border-brass/40"
                autoComplete="off"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-accent/80 hover:bg-accent text-cream rounded-lg text-sm font-ancient font-semibold cursor-pointer transition-colors"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={toggleChat}
        className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-wood border-2 sm:border-[3px] border-brass/60 text-cream text-base sm:text-xl cursor-pointer shadow-2xl transition-transform hover:scale-110 flex items-center justify-center"
        style={{
          boxShadow: '0 6px 12px rgba(0,0,0,0.5), inset 0 -3px 8px rgba(0,0,0,0.3), 0 0 12px rgba(212,175,55,0.1)'
        }}
      >
        <span className="relative z-10" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>&#128172;</span>
      </button>
    </div>
  );
}
