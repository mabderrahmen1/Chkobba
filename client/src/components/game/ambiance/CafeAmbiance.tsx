import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../../stores/useUIStore';
import { CoffeeCup } from './CoffeeCup';
import { CigarettePack } from './CigarettePack';
import { Hookah } from './Hookah';
import { Waitress } from './Waitress';

/**
 * Renders the ambient cafe props integrated into the table scene.
 * All images are scaled and positioned for high immersion and interactivity.
 */
export function CafeAmbiance() {
  const showAmbiance = useUIStore((s) => s.showAmbiance);

  return (
    <AnimatePresence>
      {showAmbiance && (
        <div className="absolute inset-0 pointer-events-none">

          {/* Waitress - Center Left */}
          <motion.div
            initial={{ opacity: 0, x: -200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -200 }}
            transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
            className="absolute left-[-3%] sm:left-[-5%] lg:left-[-7%] top-[10%] z-10 hidden sm:block"
          >
            <Waitress />
          </motion.div>

          {/* Cigarette Pack - Top Right Edge */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 sm:top-3 right-[2%] sm:right-[4%] z-20"
          >
            <CigarettePack />
          </motion.div>

          {/* Hookah - Bottom Right Corner - Lifted to show full image */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className="absolute bottom-[2%] sm:bottom-[-6%] right-[1%] sm:right-[1%] z-20"
          >
            <Hookah />
          </motion.div>

          {/* Coffee Cup - Bottom Left side, super close to our cards */}
          <motion.div
            initial={{ opacity: 0, x: -50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className="absolute bottom-[2%] left-[18%] sm:left-[8%] z-20"
          >
            <CoffeeCup />
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
