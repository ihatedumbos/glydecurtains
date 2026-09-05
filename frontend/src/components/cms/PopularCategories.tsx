import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';

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

  const getCategoryImageSrc = (value?: string) => {
    if (!value) return '';
    if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) return value;
    if (value.startsWith('/')) return resolveMediaUrl(value) || value;
    if (value.startsWith('9j/') || value.startsWith('iVB') || value.startsWith('R0lG') || value.startsWith('UklGR')) {
      return `data:image/png;base64,${value}`;
    }
    return `data:image/png;base64,${value}`;
  };

  return (
    <section className="py-12 px-4 md:px-8 bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold mb-8 text-center text-blue-950"
        >
          {title || 'Popular Categories'}
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map((cat, idx) => {
            const categoryImage = getCategoryImageSrc(cat.imageBase64 || cat.iconBase64);

            return (
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
                  <div className="w-28 h-28 rounded-[26px] bg-gradient-to-br from-blue-100 via-white to-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.12)] flex items-center justify-center overflow-hidden group-hover:shadow-[0_18px_36px_rgba(37,99,235,0.18)] transition-shadow border border-blue-100 group-hover:border-blue-200">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-3xl text-white">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-sm font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
