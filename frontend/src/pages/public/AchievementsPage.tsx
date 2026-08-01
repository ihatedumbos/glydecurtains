import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';

interface Achievement {
  id: number;
  title: string;
  description?: string;
  iconBase64?: string;
  year?: number;
  metricValue: string;
  metricFormat: string;
  sortOrder: number;
  isEnabled: boolean;
}

/**
 * Parses a metric value string and returns the numeric target and any surrounding text.
 * Supports formats:
 * - Numeric with suffix: "1500+" -> { target: 1500, suffix: "+" }
 * - Percentage: "98" with format PERCENTAGE -> displayed as "98%"
 * - Plain text: "Nationwide" -> no animation, display as-is
 */
function parseMetricValue(value: string): { target: number; prefix: string; suffix: string } | null {
  const match = value.match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const target = parseInt(numStr.replace(/,/g, ''), 10);
  if (isNaN(target)) return null;
  return { target, prefix: prefix || '', suffix: suffix || '' };
}

function AnimatedMetric({ value, format }: { value: string; format: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState('0');
  const animationRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    const parsed = parseMetricValue(value);

    // Plain text - no animation possible
    if (!parsed) {
      setDisplayValue(value);
      return;
    }

    const { target, prefix, suffix } = parsed;
    const duration = 2000;
    const startTime = performance.now();

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      if (format === 'PERCENTAGE') {
        setDisplayValue(`${prefix}${current.toLocaleString()}%`);
      } else {
        setDisplayValue(`${prefix}${current.toLocaleString()}${suffix}`);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    }

    animationRef.current = requestAnimationFrame(step);
  }, [value, format]);

  useEffect(() => {
    if (!isInView) return;
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isInView, animate]);

  // Show initial state based on format
  useEffect(() => {
    const parsed = parseMetricValue(value);
    if (!parsed) {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue}
    </span>
  );
}

function AchievementCard({ achievement, index }: { achievement: Achievement; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
    >
      {/* Icon */}
      <div className="w-16 h-16 mb-5 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        {achievement.iconBase64 ? (
          <img
            src={`data:image/png;base64,${achievement.iconBase64}`}
            alt={achievement.title}
            className="w-9 h-9 object-contain"
          />
        ) : (
          <span className="text-3xl">🏆</span>
        )}
      </div>

      {/* Metric */}
      <div className="text-4xl font-bold text-primary mb-2">
        <AnimatedMetric value={achievement.metricValue} format={achievement.metricFormat} />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {achievement.title}
      </h3>

      {/* Description */}
      {achievement.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {achievement.description}
        </p>
      )}

      {/* Year badge */}
      {achievement.year && (
        <div className="absolute top-4 right-4 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-full">
          {achievement.year}
        </div>
      )}
    </motion.div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/achievements')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setAchievements(
          data
            .filter((a: Achievement) => a.isEnabled)
            .sort((a: Achievement, b: Achievement) => a.sortOrder - b.sortOrder)
        );
      })
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Our Achievements
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Milestones that define our journey of excellence in crafting premium curtains and home decor solutions.
          </motion.p>
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-md">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mb-5" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <p className="text-lg">No achievements to display yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {achievements.map((achievement, idx) => (
                <AchievementCard key={achievement.id} achievement={achievement} index={idx} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
