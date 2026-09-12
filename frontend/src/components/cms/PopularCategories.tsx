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
          <h2 className="mb-8 text-center font-display text-2xl text-[#2c2c2c] md:text-3xl">{title || 'Popular Categories'}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="w-24 h-24 bg-[#e8dfcd] rounded-full" />
                <div className="mt-3 h-4 bg-[#e8dfcd] rounded w-20" />
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
    <section className="bg-[#f4ede1] px-4 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-2xl text-[#2c2c2c] md:text-3xl"
        >
          {title || 'Popular Categories'}
        </motion.h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
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
                  className="group flex flex-col items-center text-center"
                >
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-dashed border-[#a06b3a]/45 bg-[#faf5ea] shadow-[0_1px_2px_rgba(44,34,24,0.08)] transition-colors group-hover:border-[#a06b3a]">
                    {categoryImage ? (
                      <img
                        src={categoryImage}
                        alt={cat.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-display text-[#a06b3a]">
                        {cat.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="mt-3 text-sm font-semibold text-[#2c2c2c] transition-colors group-hover:text-[#a06b3a]">
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
