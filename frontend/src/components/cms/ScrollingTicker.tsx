import { motion } from 'framer-motion';

interface ScrollingTickerProps {
  content?: string;
  speed?: number; // pixels per second
}

export default function ScrollingTicker({ content, speed = 50 }: ScrollingTickerProps) {
  const text = content || 'Free shipping on orders above ₹2000 | Premium Quality Curtains & Blinds | Shop Now';
  const duration = (text.length * 10) / speed;

  return (
    <div className="w-full overflow-hidden bg-primary/90 text-white py-2 relative">
      <motion.div
        className="whitespace-nowrap inline-block"
        animate={{ x: ['0%', '-100%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration,
            ease: 'linear',
          },
        }}
      >
        <span className="text-sm font-medium px-8">{text}</span>
        <span className="text-sm font-medium px-8">{text}</span>
      </motion.div>
    </div>
  );
}
