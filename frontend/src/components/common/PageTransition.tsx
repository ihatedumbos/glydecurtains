import { motion, AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { PageSkeleton } from '@/components/common/SkeletonLoader';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * Fades the current page in and out. Use it in place of <Outlet /> inside a layout, so only the
 * page animates and the header, menus and drawers stay mounted across navigation. (Wrapping the
 * whole router left the old header and its open mobile menu on screen during the fade.)
 */
export default function PageTransition() {
  const location = useLocation();
  // Captured per render, so the page that is fading out keeps showing its own content.
  const outlet = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
