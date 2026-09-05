import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ProductItem {
  id: number;
  name: string;
  basePrice: number;
  offerPrice?: number;
  discountPercentage?: number;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
}

type SectionType =
  | 'FEATURED'
  | 'LATEST'
  | 'NEW_ARRIVALS'
  | 'BEST_SELLING'
  | 'TRENDING'
  | 'RECENTLY_ADDED'
  | 'RECOMMENDED'
  | 'FEATURED_ACCESSORIES'
  | 'SEASONAL'
  | 'PREMIUM_COLLECTIONS';

interface ProductSectionProps {
  title?: string;
  sectionType: SectionType;
}

function getQueryParams(sectionType: SectionType): Record<string, string> {
  switch (sectionType) {
    case 'FEATURED':
      return { isFeatured: 'true', size: '8' };
    case 'LATEST':
      return { sortBy: 'createdAt', sortDirection: 'desc', size: '8' };
    case 'NEW_ARRIVALS':
      return { isNewArrival: 'true', size: '8' };
    case 'BEST_SELLING':
      return { isBestSeller: 'true', size: '8' };
    case 'TRENDING':
      return { isTrending: 'true', size: '8' };
    case 'RECENTLY_ADDED':
      return { sortBy: 'createdAt', sortDirection: 'desc', size: '8' };
    case 'RECOMMENDED':
      return { isFeatured: 'true', size: '8' };
    case 'FEATURED_ACCESSORIES':
      return { categoryId: '4', size: '8' }; // Accessories category
    case 'SEASONAL':
      return { isFeatured: 'true', size: '8' };
    case 'PREMIUM_COLLECTIONS':
      return { isPremium: 'true', size: '8' };
    default:
      return { size: '8' };
  }
}

export default function ProductSection({ title, sectionType }: ProductSectionProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = getQueryParams(sectionType);
    axiosInstance
     .get('/products/public', { params })
      .then((res) => {
        const data = res.data?.data?.content || res.data?.content || [];
        setProducts(data);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [sectionType]);

  const displayTitle = title || sectionType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">{displayTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
                <div className="mt-3 h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-[#f7f8fa] py-12 px-4 md:px-8 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Glyde accessories</p>
            <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900"
        >
          {displayTitle}
        </motion.h2>
          </div>
          <Link to="/products" className="text-sm font-semibold text-slate-700 hover:text-slate-950">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Link
                to={`/products/${product.id}`}
                className="block group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-60 overflow-hidden bg-[#eef1f4] p-3">
                  {product.thumbnailUrl ? (
                    <img
                      src={resolveMediaUrl(product.thumbnailUrl) || '/assets/logo/poster.png'}
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src="/assets/logo/poster.png"
                      alt={product.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {product.discountPercentage && product.discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      -{product.discountPercentage}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      ₹{product.offerPrice || product.basePrice}
                    </span>
                    {product.offerPrice && product.offerPrice < product.basePrice && (
                      <span className="text-sm text-slate-400 line-through">₹{product.basePrice}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
