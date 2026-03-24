import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/useUIStore';

export function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-[max(6rem,env(safe-area-inset-bottom)+5rem)] left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-[min(28rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] px-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ id, message, type }: { id: string; message: string; type: string }) {
  const removeToast = useUIStore((s) => s.removeToast);

  const handleRemove = useCallback(() => {
    removeToast(id);
  }, [id, removeToast]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, 4000);
    return () => clearTimeout(timer);
  }, [handleRemove]);

  // Color mapping for premium look
  const styles = {
    success: {
      bg: 'bg-green-900/90',
      border: 'border-green-500/50',
      text: 'text-green-100',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-900/90',
      border: 'border-red-500/50',
      text: 'text-red-100',
      icon: '✕'
    },
    info: {
      bg: 'bg-black/90',
      border: 'border-brass/50',
      text: 'text-brass',
      icon: 'ℹ'
    }
  }[type as 'success' | 'error' | 'info'] || {
    bg: 'bg-black/90',
    border: 'border-brass/50',
    text: 'text-cream',
    icon: '•'
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      className={`${styles.bg} ${styles.border} ${styles.text} px-6 py-4 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.8)] flex items-center gap-4 border-2 backdrop-blur-xl relative overflow-hidden`}
    >
      {/* Decorative accent line */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-current opacity-30" />
      
      <div className="flex-1 flex items-center gap-3">
        <span className="font-ancient text-lg font-bold opacity-80">{styles.icon}</span>
        <span className="font-ancient uppercase tracking-widest text-[11px] sm:text-xs font-bold leading-relaxed">
          {message}
        </span>
      </div>

      <button
        onClick={handleRemove}
        className="ml-2 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
