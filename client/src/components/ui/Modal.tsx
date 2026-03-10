import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export function Modal({ isOpen, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-surface-alt rounded-xl p-4 sm:p-6 md:p-8 max-w-lg w-full text-center shadow-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto border border-brass/15"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
