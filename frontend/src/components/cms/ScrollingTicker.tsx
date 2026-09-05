import { motion } from 'framer-motion';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ScrollingTickerProps {
  content?: string;
  speed?: number; // pixels per second
  images?: string[];
}

export default function ScrollingTicker({ content, speed = 50, images = [] }: ScrollingTickerProps) {
  const text = content || 'Free shipping on orders above ₹2000 | Premium Quality Curtains & Blinds | Shop Now';
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
    <div className="relative w-full overflow-hidden bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 py-2 text-white shadow-sm">
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
            className="mx-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium backdrop-blur-sm"
          >
            {item.type === 'image' ? (
              <>
                <img
                  src={resolveMediaUrl(item.src)}
                  alt="Featured product"
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-white/40"
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
