import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';

interface Category {
  id: number;
  name: string;
  iconBase64?: string;
  imageBase64?: string;
}

interface PopularCategoriesProps {
  title?: string;
}

export default function PopularCategories({ title }: PopularCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
     .get('/categories/public/tree')
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setCategories(data);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{title || 'Popular Categories'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="mt-3 h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-12 px-4 md:px-8 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold mb-8 text-center"
        >
          {title || 'Popular Categories'}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
            >
              <Link
                to={`/products?categoryId=${cat.id}`}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-md flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow border-2 border-transparent group-hover:border-primary/30">
                  {cat.iconBase64 ? (
                    <img
                      src={`data:image/png;base64,${cat.iconBase64}`}
                      alt={cat.name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">🏠</span>
                  )}
                </div>
                <span className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
