import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ScrollingTickerProps {
  content?: string;
  speed?: number; // pixels per second
  images?: string[];
}

export default function ScrollingTicker({ content, speed = 50, images = [] }: ScrollingTickerProps) {
  const text = content || 'Manufacturer-direct curtain hardware | Made in Pune | Bulk pricing for dealers & installers | PAN India delivery';
  const duration = (text.length * 10) / speed;
  // The list is rendered twice so the loop scrolls seamlessly; keys carry the copy number to stay unique.
  const tickerItems = Array.from({ length: 2 }).flatMap((_, copy) => [
    ...images.map((src, index) => ({
      key: `image-${copy}-${index}`,
      type: 'image' as const,
      src,
      label: 'New arrival',
    })),
    { key: `text-${copy}`, type: 'text' as const, label: text },
  ]);

  return (
    <div className="relative w-full overflow-hidden border-y border-[#2f3e46]/15 bg-[#6d787e] py-1.5 text-[#ffffff]">
      <motion.div
        className="inline-flex whitespace-nowrap items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: Math.max(duration, 12),
            ease: 'linear',
          },
        }}
      >
        {tickerItems.map((item) => (
          <span
            key={item.key}
            className="mx-1.5 inline-flex items-center gap-2 rounded-sm border border-[#ffffff]/25 bg-[#2f3e46]/10 px-3 py-1 text-sm font-medium"
          >
            {item.type === 'image' ? (
              <>
                <img
                  src={resolveMediaUrl(item.src)}
                  alt="Featured Glyde hardware"
                  className="h-5 w-5 rounded-full border border-[#ffffff]/50 object-cover"
                />
                <span>{item.label}</span>
              </>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
