import { useRef } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Layered scroll ("stacking sections"): the first page stays pinned while the second page, with
 * rounded top corners and a shadow, slides up and covers it. As it covers, the first page eases
 * back (a little smaller and dimmer) so the two read as separate sheets of paper stacked on top
 * of each other. Pinning is desktop only; on phones the sheets just stack. With reduced motion
 * turned on, the easing-back is skipped.
 */
export default function LayeredPages({ under, over }: { under: ReactNode; over: ReactNode }) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // 0 when the top edge of the second page enters the screen, 1 when it reaches the top.
  const { scrollYProgress } = useScroll({ target: sheetRef, offset: ['start end', 'start start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.93]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, 28]);

  return (
    <>
      <div className="bg-white md:sticky md:top-[76px] md:pb-24">
        <motion.div
          style={reduceMotion ? undefined : { scale, opacity, y: lift, transformOrigin: '50% 0%' }}
          className="will-change-transform"
        >
          {under}
        </motion.div>
      </div>
      <div
        ref={sheetRef}
        className="relative z-10 -mt-6 rounded-t-[28px] bg-[#f3f5f6] shadow-[0_-18px_44px_rgba(20,35,43,0.2)] md:-mt-20 md:rounded-t-[44px]"
      >
        {/* A small grab-handle line at the seam makes the second page read as a sheet. */}
        <div aria-hidden="true" className="mx-auto h-1.5 w-14 translate-y-3 rounded-full bg-[#c7d0d5]" />
        {over}
      </div>
    </>
  );
}
