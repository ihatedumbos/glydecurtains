import { useEffect, useState, useRef } from 'react';
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

interface AchievementsSectionProps {
  title?: string;
}

function AnimatedCounter({ value, format }: { value: string; format: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    if (!isInView) return;

    // Extract numeric part
    const numericMatch = value.match(/[\d,]+/);
    if (!numericMatch) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseInt(numericMatch[0].replace(/,/g, ''), 10);
    if (isNaN(targetNum)) {
      setDisplayValue(value);
      return;
    }

    const suffix = value.replace(numericMatch[0], '');
    const duration = 2000; // 2s
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * targetNum);

      if (format === 'PERCENTAGE') {
        setDisplayValue(`${current}%`);
      } else {
        setDisplayValue(`${current.toLocaleString()}${suffix}`);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isInView, value, format]);

  return <span ref={ref}>{displayValue}</span>;
}

export default function AchievementsSection({ title }: AchievementsSectionProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/achievements')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setAchievements(data.filter((a: Achievement) => a.isEnabled).sort((a: Achievement, b: Achievement) => a.sortOrder - b.sortOrder));
      })
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title || 'Our Achievements'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse text-center p-6">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3" />
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (achievements.length === 0) return null;

  return (
    <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold mb-12 text-center"
        >
          {title || 'Our Achievements'}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center">
                {achievement.iconBase64 ? (
                  <img
                    src={`data:image/png;base64,${achievement.iconBase64}`}
                    alt={achievement.title}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <span className="text-2xl">🏆</span>
                )}
              </div>
              <div className="text-3xl font-bold text-primary mb-1">
                <AnimatedCounter value={achievement.metricValue} format={achievement.metricFormat} />
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{achievement.title}</div>
              {achievement.description && (
                <div className="text-xs text-gray-500 mt-1">{achievement.description}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
