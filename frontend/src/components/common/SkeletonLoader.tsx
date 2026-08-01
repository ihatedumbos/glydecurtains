import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'page';
  count?: number;
  className?: string;
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`skeleton-shimmer rounded-lg ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-4 space-y-4">
      <SkeletonBlock className="h-48 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-4 w-1/2" />
      <SkeletonBlock className="h-8 w-1/3" />
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-[60vh] p-6 space-y-6 animate-fade-in">
      <SkeletonBlock className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SkeletonLoader({
  variant = 'page',
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  if (variant === 'page') return <PageSkeleton />;

  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => {
        switch (variant) {
          case 'card':
            return <CardSkeleton key={i} />;
          case 'text':
            return <TextSkeleton key={i} />;
          case 'circle':
            return <SkeletonBlock key={i} className="h-12 w-12 rounded-full" />;
          default:
            return <SkeletonBlock key={i} className="h-4 w-full" />;
        }
      })}
    </div>
  );
}
