import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '@/api/axiosInstance';

interface Testimonial {
  id: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

interface CustomerTestimonialsProps {
  title?: string;
}

export default function CustomerTestimonials({ title }: CustomerTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/feedback/public', { params: { size: 6 } })
      .then((res) => {
        const data = res.data?.data?.content || res.data?.content || [];
        setTestimonials(data);
      })
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="mb-8 text-center font-display text-2xl text-[#2f3e46] md:text-3xl">{title || 'What Our Customers Say'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-6 bg-[#ffffff] rounded-xl">
                <div className="h-4 bg-[#f2f4f5] rounded w-3/4 mb-3" />
                <div className="h-3 bg-[#f2f4f5] rounded w-full mb-2" />
                <div className="h-3 bg-[#f2f4f5] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 bg-[#ffffff]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-2xl text-[#2f3e46] md:text-3xl"
        >
          {title || 'What Our Customers Say'}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.4 }}
              className="p-6 bg-[#ffffff] rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < t.rating ? 'text-yellow-400' : 'text-[#f2f4f5]'}`}>
                    ★
                  </span>
                ))}
              </div>
              <h4 className="font-semibold text-[#2f3e46] mb-2">{t.title}</h4>
              <p className="text-sm text-[#5c6b73] mb-4 line-clamp-3">{t.comment}</p>
              <div className="flex items-center justify-between text-xs text-[#5c6b73]">
                <span className="font-medium">{t.userName}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
