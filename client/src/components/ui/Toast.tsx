import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/useUIStore';

export function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 min-w-[280px] max-w-[calc(100vw-2rem)]" style={{ bottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}>
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

  const styles = {
    success: { accent: 'text-success border-success/30', icon: '\u2713' },
    error: { accent: 'text-danger border-danger/30', icon: '\u2715' },
    info: { accent: 'text-accent border-accent/30', icon: '\u2139' },
  }[type as 'success' | 'error' | 'info'] || { accent: 'text-text-primary border-border', icon: '\u2022' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`bg-surface-1 border ${styles.accent} px-5 py-3 rounded-xl shadow-lg flex items-center gap-3`}
    >
      <span className="text-sm font-semibold opacity-70">{styles.icon}</span>
      <span className="text-sm font-medium flex-1">{message}</span>

      <button
        onClick={handleRemove}
        className="ml-1 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors text-text-tertiary hover:text-text-primary"
        aria-label="Dismiss notification"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
