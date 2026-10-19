import { motion } from 'framer-motion';

interface ScrollingTickerProps {
  content?: string;
  speed?: number; // pixels per second
  /** Kept for API compatibility with older CMS configs; the ticker now shows text only. */
  images?: string[];
}

export const DEFAULT_TICKER_CONTENT =
  'Manufacturer-direct curtain hardware | Made in Pune | Bulk pricing for dealers & installers | PAN India delivery | WhatsApp 81490 66661';

export default function ScrollingTicker({ content, speed = 50 }: ScrollingTickerProps) {
  const text = content || DEFAULT_TICKER_CONTENT;
  const messages = text.split('|').map((part) => part.trim()).filter(Boolean);
  const duration = (text.length * 10) / speed;

  // The messages are rendered twice so the loop scrolls seamlessly from -50% back to 0.
  return (
    <div className="relative w-full overflow-hidden bg-[#14232b] py-2 text-[#ffffff]">
      <motion.div
        className="flex w-max items-center whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: Math.max(duration, 20),
            ease: 'linear',
          },
        }}
      >
        {[0, 1].map((copy) =>
          messages.map((message, index) => (
            <span key={`${copy}-${index}`} className="inline-flex shrink-0 items-center text-sm font-medium tracking-wide">
              <span className="px-6">{message}</span>
              <span aria-hidden="true" className="text-[#e08a5a]">
                ●
              </span>
            </span>
          )),
        )}
      </motion.div>
    </div>
  );
}
