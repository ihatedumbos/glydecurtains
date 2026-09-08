import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ScrollingTickerProps {
  content?: string;
  speed?: number; // pixels per second
  images?: string[];
}

export default function ScrollingTicker({ content, speed = 50, images = [] }: ScrollingTickerProps) {
  const text = content || 'Free shipping on orders above ₹2000 | Manufacturer-direct curtain hardware | Bulk pricing for trade & installers';
  const duration = (text.length * 10) / speed;
  const tickerItems = Array.from({ length: 2 }).flatMap(() => [
    ...images.map((src, index) => ({
      key: `image-${index}`,
      type: 'image' as const,
      src,
      label: 'New arrival',
    })),
    { key: 'text', type: 'text' as const, label: text },
  ]);

  return (
    <div className="relative w-full overflow-hidden border-y border-[#2c2c2c]/15 bg-[#8a6d5a] py-1.5 text-[#faf5ea]">
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
            className="mx-1.5 inline-flex items-center gap-2 rounded-sm border border-[#faf5ea]/25 bg-[#2c2c2c]/10 px-3 py-1 text-sm font-medium"
          >
            {item.type === 'image' ? (
              <>
                <img
                  src={resolveMediaUrl(item.src)}
                  alt="Featured Glyde hardware"
                  className="h-5 w-5 rounded-full border border-[#faf5ea]/50 object-cover"
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
