import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores/useUIStore';

export function Toast() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2">
      <AnimatePresence>
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
    const timer = setTimeout(handleRemove, 5000);
    return () => clearTimeout(timer);
  }, [handleRemove]);

  const bg =
    type === 'success'
      ? 'bg-accent-success/90 border-accent-success/50'
      : type === 'error'
        ? 'bg-accent-danger/90 border-accent-danger/50'
        : 'bg-turquoise-dark/90 border-turquoise/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`${bg} text-cream px-6 py-3 rounded-lg shadow-2xl flex items-center gap-4 border backdrop-blur-sm`}
    >
      <span className="font-body">{message}</span>
      <button
        onClick={handleRemove}
        className="text-xl leading-none opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
      >
        &times;
      </button>
    </motion.div>
  );
}
